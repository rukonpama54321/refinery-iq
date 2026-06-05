// Gemini text-embedding-004 via Vercel AI SDK (embedMany).
// 768-dim vectors, free tier. ADR-0004.
import { embedMany, embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

function googleClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in .env");
  return createGoogleGenerativeAI({ apiKey: key });
}

const MODEL_ID = "text-embedding-004";

// Gemini free tier: 100 requests/min. Batch in groups of 20 with a small delay.
const BATCH = 20;
const DELAY_MS = 700;

/** Embed many texts. Returns one 768-dim vector per input string, in order. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const google = googleClient();
  const model = google.textEmbeddingModel(MODEL_ID);
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const { embeddings } = await embedMany({ model, values: batch });
    all.push(...embeddings);
    if (i + BATCH < texts.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  return all;
}

/** Embed a single query string for retrieval. */
export async function embedQuery(text: string): Promise<number[]> {
  const google = googleClient();
  const model = google.textEmbeddingModel(MODEL_ID);
  const { embedding } = await embed({ model, value: text });
  return embedding;
}
