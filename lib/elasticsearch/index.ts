// Ensure the chunks_local index exists with the correct mappings.
// Called by the ingest script; idempotent (skips if already exists).
// Architecture §7, Database §5.
import { getEsClient, INDEX_NAME } from "./client";

export async function ensureIndex(): Promise<void> {
  const es = getEsClient();
  const exists = await es.indices.exists({ index: INDEX_NAME });
  if (exists) return;

  await es.indices.create({
    index: INDEX_NAME,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: { analyzer: { default: { type: "english" } } },
      },
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
          embedding: {
            type: "dense_vector",
            dims: 768,
            index: true,
            similarity: "cosine",
          },
          created_at: { type: "date" },
        },
      },
    },
  });
  console.log(`[es] Created index ${INDEX_NAME}`);
}

export interface ChunkDoc {
  doc_id: string;
  version_id: string;
  version_no: number;
  is_current: boolean;
  department: string;
  sensitivity: string;
  pii_flags: string[];
  title: string;
  location: string;
  text: string;
  embedding: number[];
  created_at: string;
}

export async function indexChunks(chunks: ChunkDoc[]): Promise<void> {
  if (chunks.length === 0) return;
  const es = getEsClient();
  const body = chunks.flatMap((c) => [
    { index: { _index: INDEX_NAME } },
    c,
  ]);
  const res = await es.bulk({ body, refresh: true });
  if (res.errors) {
    const errs = res.items.filter((i) => i.index?.error).map((i) => i.index?.error);
    throw new Error(`ES bulk errors: ${JSON.stringify(errs.slice(0, 3))}`);
  }
  console.log(`[es] Indexed ${chunks.length} chunks`);
}

/** Mark all existing chunks for a doc_id as not current (before re-indexing a new version). */
export async function markSuperseded(docId: string): Promise<void> {
  const es = getEsClient();
  await es.updateByQuery({
    index: INDEX_NAME,
    body: {
      query: { term: { doc_id: docId } },
      script: { source: "ctx._source.is_current = false", lang: "painless" },
    },
  });
}
