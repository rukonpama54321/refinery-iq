// Ingest the HCU Unit Demo Manual into Elasticsearch.
// Usage:  node scripts/ingest-hcu.mjs
// Prereqs: ELASTICSEARCH_URL + GEMINI_API_KEY in .env; ES running.
//
// What it does:
//  1. Parses docs/Policies/HCU_Unit_Demo_Manual.pdf with pdf-parse.
//  2. Chunks the text (~600 tokens, ~100-token overlap) with location labels.
//  3. Embeds each chunk via Gemini text-embedding-004 (768-dim, free tier).
//  4. Creates / verifies the ES `chunks_local` index.
//  5. Marks any existing HCU chunks as superseded.
//  6. Bulk-indexes the new chunks.
//  7. Updates the document_versions row in Supabase (status → indexed).
//
// Can be re-run safely (idempotent per version_id).

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, "..");

// ---- load .env ----
const env = {};
for (const line of readFileSync(join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && m[2].trim()) env[m[1]] = m[2].trim();
}
Object.assign(process.env, env);

// ---- validate prereqs ----
const missing = ["NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","ELASTICSEARCH_URL"]
  .filter((k) => !env[k]);
if (missing.length) { console.error("Missing env:", missing.join(", ")); process.exit(1); }

const hasGemini = !!env.GEMINI_API_KEY;
if (!hasGemini) {
  console.warn("GEMINI_API_KEY not set — will embed with BM25-only placeholder zeros.");
  console.warn("Set GEMINI_API_KEY and re-run to enable vector search.");
}

const PDF_PATH = join(root, "docs/Policies/HCU_Unit_Demo_Manual.pdf");
if (!existsSync(PDF_PATH)) {
  console.error("PDF not found:", PDF_PATH);
  process.exit(1);
}

// ---- constants ----
const DOC_ID      = "a1b2c3d4-0001-0001-0001-000000000001"; // seeded in migration 0002
const DOC_TITLE   = "Hydrocracker Unit (HCU) — Unit Demo Manual";
const DEPARTMENT  = "process_engineering";
const SENSITIVITY = "internal";
const VERSION_NO  = 1;

// ---- dynamic imports (needs env set first) ----
const { default: pdfParse }  = await import("pdf-parse");
const { Client }             = await import("@elastic/elasticsearch");
const { embedMany }          = await import("ai");
const { createGoogleGenerativeAI } = await import("@ai-sdk/google");

// ---- helpers ----
function chunkText(raw) {
  const CHUNK_SIZE = 2400;
  const OVERLAP    = 400;
  const MIN_CHUNK  = 80;
  const text = raw.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const ffParts = text.split(/\f/);
  const pages = ffParts.length > 1
    ? ffParts.map((c, i) => ({ pageNum: i + 1, content: c.trim() })).filter(p => p.content)
    : [{ pageNum: 1, content: text }];

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
      if (para.length < 120 && /^[A-Z0-9 :/-]{4,}$/.test(para)) heading = para.slice(0, 80);
      if (buf.length + para.length + 2 > CHUNK_SIZE) flush();
      buf += (buf ? "\n\n" : "") + para;
    }
    if (buf.trim().length >= MIN_CHUNK) flush();
  }
  return chunks;
}

async function embedTexts(texts) {
  if (!hasGemini) return texts.map(() => new Array(768).fill(0));
  const BATCH = 20, DELAY = 700;
  const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
  const model  = google.textEmbeddingModel("text-embedding-004");
  const all = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const { embeddings } = await embedMany({ model, values: texts.slice(i, i + BATCH) });
    all.push(...embeddings);
    if (i + BATCH < texts.length) await new Promise(r => setTimeout(r, DELAY));
    console.log(`  embedded ${Math.min(i + BATCH, texts.length)}/${texts.length}`);
  }
  return all;
}

// ---- Supabase admin helper ----
async function sbAdmin(path, body, method = "POST") {
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

// ======================== MAIN ========================
console.log("=== HCU Ingest ===");

// 1. Parse PDF.
console.log("\n[1] Parsing PDF…");
const pdfBuf = readFileSync(PDF_PATH);
const { text: rawText, numpages } = await pdfParse(pdfBuf);
console.log(`    ${numpages} pages, ${rawText.length} chars`);

// 2. Chunk.
console.log("\n[2] Chunking…");
const textChunks = chunkText(rawText, DOC_TITLE);
console.log(`    ${textChunks.length} chunks`);

// 3. Embed.
console.log(`\n[3] Embedding (${hasGemini ? "Gemini text-embedding-004" : "zeros placeholder"})…`);
const embeddings = await embedTexts(textChunks.map(c => c.text));

// 4. ES index setup.
console.log("\n[4] Ensuring ES index…");
const es = new Client({ node: env.ELASTICSEARCH_URL });
const idxExists = await es.indices.exists({ index: "chunks_local" }).catch(() => false);
if (!idxExists) {
  await es.indices.create({
    index: "chunks_local",
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
  console.log("    Index created.");
} else {
  console.log("    Index already exists.");
}

// 5. Upsert document_version row in Supabase.
console.log("\n[5] Upserting document_version in Supabase…");
const verRes = await sbAdmin("document_versions", {
  document_id:  DOC_ID,
  version_no:   VERSION_NO,
  storage_path: `local/hcu-unit-demo-manual-v${VERSION_NO}.pdf`,
  mime_type:    "application/pdf",
  byte_size:    pdfBuf.length,
  status:       "processing",
  notes:        `Ingested by ingest-hcu.mjs — ${new Date().toISOString()}`,
});
let versionId;
if (verRes.status === 201) {
  versionId = verRes.data[0].id;
  console.log(`    Created version row: ${versionId}`);
} else if (verRes.status === 409 || (verRes.data && verRes.data[0]?.id)) {
  // Already exists — fetch it.
  const fetchRes = await sbAdmin(
    `document_versions?document_id=eq.${DOC_ID}&version_no=eq.${VERSION_NO}&select=id`,
    undefined, "GET"
  );
  versionId = fetchRes.data?.[0]?.id;
  console.log(`    Version row already exists: ${versionId}`);
} else {
  console.warn("    Supabase upsert:", verRes.status, JSON.stringify(verRes.data));
  versionId = `unknown-${Date.now()}`;
}

// 6. Mark old chunks superseded.
console.log("\n[6] Marking old chunks superseded…");
await es.updateByQuery({
  index: "chunks_local",
  body: {
    query: { term: { doc_id: DOC_ID } },
    script: { source: "ctx._source.is_current = false", lang: "painless" },
  },
}).catch(() => {});

// 7. Bulk index.
console.log("\n[7] Bulk indexing…");
const now = new Date().toISOString();
const bulkBody = textChunks.flatMap((chunk, i) => [
  { index: { _index: "chunks_local" } },
  {
    doc_id:      DOC_ID,
    version_id:  versionId,
    version_no:  VERSION_NO,
    is_current:  true,
    department:  DEPARTMENT,
    sensitivity: SENSITIVITY,
    pii_flags:   [],
    title:       DOC_TITLE,
    location:    chunk.location,
    text:        chunk.text,
    embedding:   embeddings[i],
    created_at:  now,
  },
]);
const bulkRes = await es.bulk({ body: bulkBody, refresh: true });
if (bulkRes.errors) {
  const errs = bulkRes.items.filter(i => i.index?.error).slice(0, 3);
  console.error("Bulk errors:", JSON.stringify(errs));
} else {
  console.log(`    Indexed ${textChunks.length} chunks.`);
}

// 8. Update document + version status → indexed.
console.log("\n[8] Updating Supabase status → indexed…");
await sbAdmin(
  `document_versions?id=eq.${versionId}`,
  { status: "indexed" },
  "PATCH"
);
await sbAdmin(
  `documents?id=eq.${DOC_ID}`,
  { current_version_id: versionId },
  "PATCH"
);

console.log("\n=== Done. HCU manual is indexed and ready for RAG retrieval. ===");
if (!hasGemini) {
  console.log("\nNote: embeddings are zero-vectors (GEMINI_API_KEY was missing).");
  console.log("BM25 text search will still work. Add GEMINI_API_KEY and re-run for full hybrid search.");
}
