// Ingest ALL policy documents in docs/Policies/ into Elasticsearch.
// Handles PDF (pdf-parse) and DOCX (mammoth). Manages HR v1→v2 versioning.
// Usage:  node scripts/ingest-all.mjs [--file <filename>] [--dry-run]
//   --file <name>  only process the named file
//   --dry-run      parse + chunk but skip embed + ES (useful to check chunk counts)
//
// Prereqs: ELASTICSEARCH_URL + GEMINI_API_KEY in .env; ES and Docker running.
// Safe to re-run: marks old chunks superseded before re-indexing.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");
const POLICIES_DIR = join(root, "docs/Policies");

// ---- parse CLI flags ----
const args = process.argv.slice(2);
const fileIdx    = args.indexOf("--file");
const fileFilter = fileIdx >= 0 ? args[fileIdx + 1] : null;
const dryRun     = args.includes("--dry-run");
if (dryRun) console.log("[dry-run] skipping embed + ES operations\n");

// ---- load .env ----
const env = {};
for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && m[2].trim()) env[m[1]] = m[2].trim();
}
Object.assign(process.env, env);

const hasGemini = !!env.GEMINI_API_KEY;
if (!hasGemini) {
  console.warn("GEMINI_API_KEY not set — embeddings will be zero-vectors (BM25-only retrieval).");
  console.warn("Get a free key at https://aistudio.google.com/apikey and add it to .env.\n");
}

// ---- load corpus config ----
const { CORPUS } = await import("./corpus-config.mjs");

// ---- dynamic imports ----
const { PDFParse }           = await import("pdf-parse");
const { default: mammoth }   = await import("mammoth");
const { Client }             = await import("@elastic/elasticsearch");
const { embedMany }          = await import("ai");
const { createGoogleGenerativeAI } = await import("@ai-sdk/google");

const INDEX_NAME = "chunks_local";
const CHUNK_SIZE = 2400;
const OVERLAP    = 400;
const MIN_CHUNK  = 80;

// ---- text extraction ----
async function extractText(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    const buf = readFileSync(filePath);
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    return { text: result.text, pages: result.total, bytes: buf.length };
  }
  if (ext === ".docx") {
    const buf = readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer: buf });
    return { text, pages: null, bytes: buf.length };
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

// ---- chunking ----
function chunkText(raw) {
  const text = raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const ffParts = text.split(/\f/);
  const pages = ffParts.length > 1
    ? ffParts.map((c, i) => ({ pageNum: i + 1, content: c.trim() })).filter(p => p.content)
    : splitBySize(text);

  const chunks = [];
  for (const { pageNum, content } of pages) {
    const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    let buf = "", heading = "";
    const flush = () => {
      const t = buf.trim();
      if (t.length >= MIN_CHUNK)
        chunks.push({ text: t, location: `p.${pageNum}${heading ? ` — ${heading}` : ""}` });
      buf = t.slice(-OVERLAP);
    };
    for (const para of paragraphs) {
      if (para.length < 120 && /^[A-Z0-9 :/()\-]{4,}$/.test(para)) heading = para.slice(0, 80);
      if (buf.length + para.length + 2 > CHUNK_SIZE) flush();
      buf += (buf ? "\n\n" : "") + para;
    }
    if (buf.trim().length >= MIN_CHUNK) flush();
  }
  return chunks;
}

function splitBySize(text) {
  if (text.length <= CHUNK_SIZE * 2) return [{ pageNum: 1, content: text }];
  const PAGE = 3000;
  const pages = [];
  let start = 0, pageNum = 1;
  while (start < text.length) {
    pages.push({ pageNum, content: text.slice(start, start + PAGE) });
    start += PAGE; pageNum++;
  }
  return pages;
}

// ---- embeddings ----
async function embedTexts(texts) {
  if (!hasGemini) return null; // null = omit embedding field (BM25-only)
  const BATCH = 20, DELAY = 700;
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  const model  = google.textEmbeddingModel("text-embedding-004");
  const all = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const { embeddings } = await embedMany({ model, values: texts.slice(i, i + BATCH) });
    all.push(...embeddings);
    process.stdout.write(`\r  embedded ${Math.min(i + BATCH, texts.length)}/${texts.length}   `);
    if (i + BATCH < texts.length) await new Promise(r => setTimeout(r, DELAY));
  }
  console.log();
  return all;
}

// ---- Supabase REST helper (service role) ----
async function sb(path, body, method = "GET") {
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = env.SUPABASE_SERVICE_ROLE_KEY;
  const res  = await fetch(`${base}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

// ---- ES setup ----
const es = new Client({ node: env.ELASTICSEARCH_URL || "http://localhost:9200" });

async function ensureIndex() {
  const exists = await es.indices.exists({ index: INDEX_NAME }).catch(() => false);
  if (exists) { console.log(`    Index ${INDEX_NAME} already exists.`); return; }
  await es.indices.create({
    index: INDEX_NAME,
    body: {
      settings: { number_of_shards: 1, number_of_replicas: 0 },
      mappings: {
        properties: {
          doc_id:      { type: "keyword" },
          version_id:  { type: "keyword" },
          version_no:  { type: "integer" },
          is_current:  { type: "boolean" },
          department:  { type: "keyword" },
          sensitivity: { type: "keyword" },
          pii_flags:   { type: "keyword" },
          title:       { type: "text" },
          location:    { type: "keyword" },
          text:        { type: "text", analyzer: "english" },
          embedding:   { type: "dense_vector", dims: 768, index: true, similarity: "cosine" },
          created_at:  { type: "date" },
        },
      },
    },
  });
  console.log(`    Created index ${INDEX_NAME}`);
}

// ---- ingest one document entry ----
async function ingestOne(entry) {
  const filePath = join(POLICIES_DIR, entry.filename);
  if (!existsSync(filePath)) {
    console.warn(`  SKIP: ${entry.filename} not found in docs/Policies/`);
    return { skipped: true };
  }

  console.log(`\n  Parsing: ${entry.filename}`);
  const { text: rawText, pages, bytes } = await extractText(filePath);
  console.log(`    ${pages ? pages + " pages, " : ""}${rawText.length} chars`);

  const chunks = chunkText(rawText);
  console.log(`    ${chunks.length} chunks`);

  if (dryRun) {
    console.log("    [dry-run] skipping embed + index");
    return { skipped: false, chunks: chunks.length };
  }

  // Embed.
  console.log(`    Embedding…`);
  const embeddings = await embedTexts(chunks.map(c => c.text));

  // Upsert document row (only for version_no=1 or standalone).
  if (entry.version_no === 1 || !CORPUS.find(c => c.doc_id === entry.doc_id && c.version_no === 1)) {
    const existing = await sb(`documents?id=eq.${entry.doc_id}&select=id`);
    if (!existing.data?.length) {
      await sb("documents", {
        id:          entry.doc_id,
        title:       entry.title,
        department:  entry.department,
        sensitivity: entry.sensitivity,
      }, "POST");
      console.log(`    Created documents row.`);
    }
  }

  // Upsert version row.
  const storagePath = `local/${entry.filename.replace(/ /g, "_")}`;
  let { status: vs, data: vd } = await sb("document_versions", {
    document_id:  entry.doc_id,
    version_no:   entry.version_no,
    storage_path: storagePath,
    mime_type:    extname(entry.filename) === ".docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf",
    byte_size:    bytes,
    status:       "processing",
    notes:        `Ingested ${new Date().toISOString()}`,
  }, "POST");

  let versionId;
  if (vs === 201) {
    versionId = vd[0].id;
  } else {
    // Already exists — fetch.
    const fr = await sb(`document_versions?document_id=eq.${entry.doc_id}&version_no=eq.${entry.version_no}&select=id`);
    versionId = fr.data?.[0]?.id;
  }
  console.log(`    Version row: ${versionId}`);

  // Mark old chunks for this doc superseded.
  await es.updateByQuery({
    index: INDEX_NAME,
    body: {
      query: { bool: { filter: [
        { term: { doc_id: entry.doc_id } },
        { term: { version_no: entry.version_no } },
      ]}},
      script: { source: "ctx._source.is_current = false", lang: "painless" },
    },
    conflicts: "proceed",
  }).catch(() => {});

  // Bulk index new chunks.
  const now = new Date().toISOString();
  const bulkBody = chunks.flatMap((chunk, i) => {
    const doc = {
      doc_id:      entry.doc_id,
      version_id:  versionId,
      version_no:  entry.version_no,
      is_current:  entry.is_latest,
      department:  entry.department,
      sensitivity: entry.sensitivity,
      pii_flags:   [],
      title:       entry.title,
      location:    chunk.location,
      text:        chunk.text,
      created_at:  now,
    };
    // Only include embedding when we have real vectors — ES rejects zero-magnitude vectors with cosine similarity
    if (embeddings !== null) doc.embedding = embeddings[i];
    return [{ index: { _index: INDEX_NAME } }, doc];
  });
  const br = await es.bulk({ body: bulkBody, refresh: true });
  if (br.errors) {
    console.error("    ES bulk errors:", br.items.filter(i => i.index?.error).slice(0, 2));
  } else {
    console.log(`    Indexed ${chunks.length} chunks (is_current=${entry.is_latest})`);
  }

  // Update version status + set current_version_id if latest.
  await sb(`document_versions?id=eq.${versionId}`, { status: "indexed" }, "PATCH");
  if (entry.is_latest) {
    await sb(`documents?id=eq.${entry.doc_id}`, { current_version_id: versionId }, "PATCH");
  }

  return { skipped: false, chunks: chunks.length, versionId };
}

// ======================== MAIN ========================
console.log("=== Numaligarh RefineryIQ — Corpus Ingest ===");
console.log(`Policies dir: ${POLICIES_DIR}`);
console.log(`Elasticsearch: ${env.ELASTICSEARCH_URL || "http://localhost:9200"}`);
console.log(`Embeddings: ${hasGemini ? "Gemini text-embedding-004" : "zeros (GEMINI_API_KEY missing)"}\n`);

// Ping ES.
if (!dryRun) {
  try {
    await es.ping();
    console.log("[ES] reachable ✓");
  } catch {
    console.error("[ES] not reachable. Start Docker: docker compose -f infra/docker-compose.yml up -d");
    process.exit(1);
  }
  await ensureIndex();
}

// Discover files.
let entries = CORPUS;
if (fileFilter) {
  entries = CORPUS.filter(e => e.filename === fileFilter);
  if (!entries.length) { console.error(`No config for file: ${fileFilter}`); process.exit(1); }
}

// Also warn about any PDFs/DOCXs in the folder that aren't in the config.
if (existsSync(POLICIES_DIR)) {
  const onDisk = readdirSync(POLICIES_DIR)
    .filter(f => /\.(pdf|docx)$/i.test(f));
  const configured = new Set(CORPUS.map(e => e.filename));
  for (const f of onDisk) {
    if (!configured.has(f))
      console.warn(`WARNING: ${f} is in docs/Policies/ but not in corpus-config.mjs — skipping.`);
  }
}

// Process each entry in order (v1 before v2 for same doc_id).
const sorted = entries.slice().sort((a, b) => a.version_no - b.version_no);
const results = [];
for (const entry of sorted) {
  const r = await ingestOne(entry);
  results.push({ file: entry.filename, ...r });
}

// Summary.
console.log("\n=== Summary ===");
for (const r of results) {
  if (r.skipped) console.log(`  SKIPPED  ${r.file}  (not found in docs/Policies/)`);
  else console.log(`  OK       ${r.file}  — ${r.chunks} chunks`);
}
console.log("\nDone. RAG retrieval is now live for the indexed documents.");
if (!hasGemini) {
  console.log("Add GEMINI_API_KEY to .env and re-run for full hybrid vector search.");
}
