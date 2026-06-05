// Singleton Elasticsearch client. Uses the URL from env; gracefully absent if
// ELASTICSEARCH_URL is not set (so `next build` passes without ES running).
import { Client } from "@elastic/elasticsearch";

let _client: Client | null = null;

export function getEsClient(): Client {
  if (_client) return _client;
  const url = process.env.ELASTICSEARCH_URL ?? "http://localhost:9200";
  _client = new Client({ node: url });
  return _client;
}

export const INDEX_NAME = "chunks_local";
