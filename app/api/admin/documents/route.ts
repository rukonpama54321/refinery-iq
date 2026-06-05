// GET /api/admin/documents — list all documents with version + chunk stats.
// Admin only.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEsClient, INDEX_NAME } from "@/lib/elasticsearch/client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: appUser } = await supabase.from("app_users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch documents + all their versions.
  const { data: docs, error } = await supabase
    .from("documents")
    .select(`
      id, title, department, sensitivity, created_at, current_version_id,
      document_versions(id, version_no, status, byte_size, created_at, mime_type)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get chunk counts per doc_id from ES.
  let chunkCounts: Record<string, number> = {};
  try {
    const es = getEsClient();
    const agg = await es.search({
      index: INDEX_NAME,
      body: {
        size: 0,
        query: { term: { is_current: true } },
        aggs: { by_doc: { terms: { field: "doc_id", size: 200 } } },
      },
    });
    for (const b of (agg.aggregations?.by_doc as any)?.buckets ?? []) {
      chunkCounts[b.key] = b.doc_count;
    }
  } catch {
    // ES might not be reachable — degrade gracefully.
  }

  const result = (docs ?? []).map((d) => ({
    ...d,
    chunks: chunkCounts[d.id] ?? 0,
  }));

  return NextResponse.json(result);
}
