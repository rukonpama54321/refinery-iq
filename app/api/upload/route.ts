// Multipart file upload → Supabase Storage → BullMQ ingest job.
// POST /api/upload   (multipart/form-data)
//   file        — the PDF or DOCX file
//   docId       — existing Supabase documents.id (or omit to auto-create)
//   title       — document title
//   department  — department_t slug
//   sensitivity — sensitivity_t value  (default: internal)
//   isCurrent   — "true" / "false"  (default: true)
//
// Returns: { jobId, versionId, docId }
// Requires: authenticated session with role = admin or manager.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQueue } from "@/lib/worker/queue";
import type { IngestJobData } from "@/lib/worker/queue";
import { createClient as sbAdminClient } from "@supabase/supabase-js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function adminSb() {
  return sbAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // Auth gate.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Role check — admin or manager only.
  const { data: appUser } = await supabase
    .from("app_users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!appUser || (appUser.role !== "admin" && appUser.role !== "manager")) {
    return NextResponse.json({ error: "Forbidden — admin or manager role required" }, { status: 403 });
  }

  // Parse form.
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
  }

  const title      = (form.get("title")      as string | null) ?? file.name;
  const department = (form.get("department") as string | null) ?? "operations";
  const sensitivity= (form.get("sensitivity")as string | null) ?? "internal";
  const isCurrent  = (form.get("isCurrent")  as string | null) !== "false";
  let   docId      = (form.get("docId")      as string | null) ?? null;

  const sb = adminSb();

  // Upsert document row.
  if (!docId) {
    const { data: doc, error: docErr } = await sb
      .from("documents")
      .insert({ title, department, sensitivity })
      .select("id")
      .single();
    if (docErr || !doc) {
      return NextResponse.json({ error: `Failed to create document: ${docErr?.message}` }, { status: 500 });
    }
    docId = doc.id;
  }

  // Get next version number.
  const { count } = await sb
    .from("document_versions")
    .select("id", { count: "exact", head: true })
    .eq("document_id", docId);
  const versionNo = (count ?? 0) + 1;

  // Upload to Supabase Storage.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${department}/${docId}/v${versionNo}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await sb.storage
    .from("documents")
    .upload(storagePath, buf, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: `Storage upload failed: ${upErr.message}` }, { status: 500 });
  }

  // Create version row.
  const { data: version, error: verErr } = await sb
    .from("document_versions")
    .insert({
      document_id:  docId,
      version_no:   versionNo,
      storage_path: storagePath,
      mime_type:    file.type,
      byte_size:    buf.length,
      status:       "pending",
    })
    .select("id")
    .single();
  if (verErr || !version) {
    return NextResponse.json({ error: `Failed to create version: ${verErr?.message}` }, { status: 500 });
  }

  // Enqueue ingest job.
  const queue = getQueue();
  const jobData: IngestJobData = {
    versionId:   version.id,
    docId:       docId!,
    storagePath,
    mimeType:    file.type,
    title,
    department,
    sensitivity,
    versionNo,
    isCurrent,
  };
  const job = await queue.add(`ingest:${version.id}`, jobData);
  await queue.close();

  return NextResponse.json({ jobId: job.id, versionId: version.id, docId }, { status: 202 });
}
