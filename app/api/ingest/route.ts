// Enqueue an ingest job for an already-uploaded document version.
// POST /api/ingest   { versionId }
// Useful for re-indexing an existing version without re-uploading.
// Requires: authenticated admin or manager.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQueue } from "@/lib/worker/queue";
import type { IngestJobData } from "@/lib/worker/queue";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!appUser || (appUser.role !== "admin" && appUser.role !== "manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { versionId } = body as { versionId?: string };
  if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });

  // Fetch version + document details.
  const { data: ver, error } = await supabase
    .from("document_versions")
    .select("id, document_id, version_no, storage_path, mime_type, documents(id, title, department, sensitivity, current_version_id)")
    .eq("id", versionId)
    .single();
  if (error || !ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const doc = (ver.documents as any);
  const isCurrent = doc.current_version_id === versionId;

  const queue = getQueue();
  const jobData: IngestJobData = {
    versionId:   ver.id,
    docId:       doc.id,
    storagePath: ver.storage_path,
    mimeType:    ver.mime_type,
    title:       doc.title,
    department:  doc.department,
    sensitivity: doc.sensitivity,
    versionNo:   ver.version_no,
    isCurrent,
  };
  const job = await queue.add(`ingest:${versionId}`, jobData);
  await queue.close();

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
