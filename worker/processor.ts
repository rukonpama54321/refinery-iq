// Document ingestion job processor.
// Runs in the worker process (not in the Next.js server).
// Pipeline: download → parse → chunk → embed → ES index → Supabase status update.
import type { Job } from "bullmq";
import type { IngestJobData, IngestJobProgress } from "@/lib/worker/queue";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";
import { getEsClient, INDEX_NAME } from "@/lib/elasticsearch/client";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase admin client (service role) ----
function sbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ---- Progress helper ----
async function progress(
  job: Job<IngestJobData>,
  step: IngestJobProgress["step"],
  pct: number,
  message: string,
) {
  await job.updateProgress({ step, pct, message } satisfies IngestJobProgress);
  console.log(`[${job.id}] ${pct}% ${message}`);
}

// ---- MIME → parser ----
async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; pages: number | null }> {
  if (mimeType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new (PDFParse as any)({ data: buffer });
    const result = await parser.getText();
    return { text: result.text as string, pages: result.total as number };
  }
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const { value: text } = await mammoth.default.extractRawText({ buffer });
    return { text, pages: null };
  }
  throw new Error(`Unsupported MIME type: ${mimeType}`);
}

// ======================== PROCESSOR ========================
export async function processIngestJob(job: Job<IngestJobData>): Promise<void> {
  const { versionId, docId, storagePath, mimeType, title, department, sensitivity, versionNo, isCurrent } =
    job.data;

  const sb = sbAdmin();
  const es = getEsClient();

  // 1. Mark as processing in Supabase.
  await sb.from("document_versions").update({ status: "processing" }).eq("id", versionId);
  await progress(job, "downloading", 5, "Downloading from Supabase Storage…");

  // 2. Download from Supabase Storage.
  const { data: fileData, error: dlErr } = await sb.storage
    .from("documents")
    .download(storagePath);
  if (dlErr || !fileData) throw new Error(`Storage download failed: ${dlErr?.message}`);
  const buffer = Buffer.from(await fileData.arrayBuffer());
  await progress(job, "parsing", 15, `Downloaded ${(buffer.length / 1024).toFixed(0)} KB. Parsing…`);

  // 3. Parse text.
  const { text, pages } = await extractText(buffer, mimeType);
  await progress(job, "chunking", 30, `Parsed ${pages ? pages + " pages, " : ""}${text.length} chars. Chunking…`);

  // 4. Chunk.
  const chunks = chunkText(text, title);
  await progress(job, "embedding", 40, `${chunks.length} chunks. Embedding…`);

  // 5. Embed.
  const hasGemini = !!process.env.GEMINI_API_KEY;
  let embeddings: number[][] | null = null;
  if (hasGemini) {
    embeddings = await embedTexts(chunks.map((c) => c.text));
  }
  await progress(job, "indexing", 80, `Embedded. Indexing ${chunks.length} chunks into ES…`);

  // 6. Mark old chunks superseded.
  await es.updateByQuery({
    index: INDEX_NAME,
    body: {
      query: { bool: { filter: [{ term: { doc_id: docId } }, { term: { version_no: versionNo } }] } },
      script: { source: "ctx._source.is_current = false", lang: "painless" },
    },
    conflicts: "proceed",
  }).catch(() => {});

  // 7. Bulk index new chunks.
  const now = new Date().toISOString();
  const bulkBody = chunks.flatMap((chunk, i) => {
    const doc: Record<string, unknown> = {
      doc_id:      docId,
      version_id:  versionId,
      version_no:  versionNo,
      is_current:  isCurrent,
      department,
      sensitivity,
      pii_flags:   [],
      title,
      location:    chunk.location,
      text:        chunk.text,
      created_at:  now,
    };
    if (embeddings !== null) doc.embedding = embeddings[i];
    return [{ index: { _index: INDEX_NAME } }, doc];
  });

  const br = await es.bulk({ body: bulkBody, refresh: true });
  if (br.errors) {
    const errs = br.items.filter((i: any) => i.index?.error);
    throw new Error(`ES bulk errors (${errs.length}): ${JSON.stringify(errs[0]?.index?.error)}`);
  }

  // 8. Update Supabase version status.
  await sb.from("document_versions").update({ status: "indexed" }).eq("id", versionId);
  if (isCurrent) {
    await sb.from("documents").update({ current_version_id: versionId }).eq("id", docId);
  }

  await progress(job, "done", 100, `Done — ${chunks.length} chunks indexed.`);
}
