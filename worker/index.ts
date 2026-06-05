// Worker process entry point.
// Run with:  npm run worker   (uses tsx for TypeScript)
// In Docker: see infra/docker-compose.yml worker service.
import "dotenv/config";
import { createWorker } from "@/lib/worker/queue";
import { processIngestJob } from "./processor";

const worker = createWorker(processIngestJob);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] error:", err);
});

console.log(`[worker] listening on queue "ingest" (Redis: ${process.env.REDIS_URL ?? "redis://localhost:6379"})`);

// Graceful shutdown.
process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM — draining…");
  await worker.close();
  process.exit(0);
});
