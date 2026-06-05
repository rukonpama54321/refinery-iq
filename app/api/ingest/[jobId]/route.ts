// Poll job status by BullMQ job ID.
// GET /api/ingest/:jobId
// Returns: { id, state, progress, failedReason? }
// Requires: authenticated session.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Queue } from "bullmq";
import { getConnection, QUEUE_NAME } from "@/lib/worker/queue";
import type { IngestJobProgress } from "@/lib/worker/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;
  const queue = new Queue(QUEUE_NAME, { connection: getConnection() });
  const job = await queue.getJob(jobId);
  await queue.close();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const state    = await job.getState();
  const progress = job.progress as IngestJobProgress | number | undefined;

  return NextResponse.json({
    id:           job.id,
    state,
    progress:     typeof progress === "object" ? progress : { pct: progress ?? 0 },
    failedReason: job.failedReason ?? null,
    attemptsMade: job.attemptsMade,
  });
}
