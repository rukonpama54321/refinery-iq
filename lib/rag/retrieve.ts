// Hybrid retrieval: BM25 (text match) + kNN (dense vector) via Elasticsearch,
// fused with RRF. RBAC filter applied BEFORE ranking so disallowed chunks never
// surface. Architecture §7, Database §5.
import { getEsClient, INDEX_NAME } from "@/lib/elasticsearch/client";
import { embedQuery } from "@/lib/rag/embed";

export interface RetrievedChunk {
  id: string;
  doc_id: string;
  version_id: string;
  title: string;
  location: string;
  text: string;
  department: string;
  sensitivity: string;
  score: number;
}

export interface RetrieveOptions {
  /** Permitted department keys (from AppUser.permittedDepartments). */
  departments: string[];
  /** Maximum chunks to return. */
  topK?: number;
  /** Skip vector search (BM25 only) — used when GEMINI_API_KEY is absent. */
  textOnly?: boolean;
}

/**
 * Retrieve the top-K most relevant chunks for a query.
 * Applies RBAC filter, then hybrid BM25+kNN with RRF fusion.
 */
export async function retrieve(
  query: string,
  opts: RetrieveOptions,
): Promise<RetrievedChunk[]> {
  const { departments, topK = 5, textOnly = false } = opts;
  if (!query.trim() || departments.length === 0) return [];

  const es = getEsClient();

  // Shared RBAC + currency filter.
  const filter = [
    { term: { is_current: true } },
    { terms: { department: departments } },
  ];

  let hits: Array<{ _id: string; _score: number | null; _source: Record<string, unknown> }>;

  if (textOnly || !process.env.GEMINI_API_KEY) {
    // BM25 only — no embedding needed.
    const res = await es.search({
      index: INDEX_NAME,
      size: topK,
      body: {
        query: {
          bool: {
            must: [{ match: { text: { query, operator: "or" } } }],
            filter,
          },
        },
        _source: ["doc_id", "version_id", "title", "location", "text", "department", "sensitivity"],
      },
    });
    hits = res.hits.hits as typeof hits;
  } else {
    // Hybrid: BM25 + kNN with RRF fusion.
    const queryVec = await embedQuery(query);
    // Use `as any` for the retriever body — the ES 8.15 typed client requires
    // the `k` field on KnnRetriever but we pass it via the rrf sub-retriever
    // which has slightly different runtime semantics; casting avoids the clash.
    const res = await es.search({
      index: INDEX_NAME,
      size: topK,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(({
        retriever: {
          rrf: {
            retrievers: [
              {
                standard: {
                  query: {
                    bool: {
                      must: [{ match: { text: { query, operator: "or" } } }],
                      filter,
                    },
                  },
                },
              },
              {
                knn: {
                  field: "embedding",
                  query_vector: queryVec,
                  num_candidates: 50,
                  k: topK,
                  filter,
                },
              },
            ],
            rank_window_size: 50,
            rank_constant: 60,
          },
        },
        _source: ["doc_id", "version_id", "title", "location", "text", "department", "sensitivity"],
      }) as any),
    } as any);
    hits = res.hits.hits as typeof hits;
  }

  return hits.map((h) => ({
    id: h._id,
    doc_id: String(h._source.doc_id ?? ""),
    version_id: String(h._source.version_id ?? ""),
    title: String(h._source.title ?? ""),
    location: String(h._source.location ?? ""),
    text: String(h._source.text ?? ""),
    department: String(h._source.department ?? ""),
    sensitivity: String(h._source.sensitivity ?? ""),
    score: h._score ?? 0,
  }));
}

/** Check whether Elasticsearch is reachable (used to degrade gracefully). */
export async function isEsAvailable(): Promise<boolean> {
  try {
    const es = getEsClient();
    await es.ping();
    return true;
  } catch {
    return false;
  }
}
