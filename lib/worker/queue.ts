// BullMQ queue + connection factory for the document ingestion pipeline.
// Shared between the Next.js app (producer) and the worker process (consumer).
import { Queue, Worker, type ConnectionOptions, type Processor } from "bullmq";

export const QUEUE_NAME = "ingest";

/** Job payload enqueued when a document needs to be (re-)indexed. */
export interface IngestJobData {
  /** Supabase document_versions.id */
  versionId: string;
  /** Supabase documents.id */
  docId: string;
  /** Supabase Storage path (e.g. docs/hr/NRL_HR_v2.docx) */
  storagePath: string;
  /** MIME type — determines which parser to use */
  mimeType: string;
  /** Human-readable title for logging */
  title: string;
  /** Department slug — used for ES RBAC filter */
  department: string;
  /** Sensitivity level */
  sensitivity: string;
  /** Version number within the document lineage */
  versionNo: number;
  /** Whether this version should be marked is_current in ES */
  isCurrent: boolean;
}

/** Progress update emitted while the job is running (for polling). */
export interface IngestJobProgress {
  step: "downloading" | "parsing" | "chunking" | "embedding" | "indexing" | "done";
  pct: number;
  message: string;
}

export function getConnection(): ConnectionOptions {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  // ioredis-style connection from a URL
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

export function getQueue() {
  return new Queue<IngestJobData>(QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24 },   // keep 24 h
      removeOnFail:    { age: 60 * 60 * 24 * 7 }, // keep 7 days
    },
  });
}

export function createWorker(processor: Processor<IngestJobData>) {
  return new Worker<IngestJobData>(QUEUE_NAME, processor, {
    connection: getConnection(),
    concurrency: 2,
  });
}
