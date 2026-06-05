// Corpus configuration — maps filenames to Supabase document metadata.
// Edit this when new documents are added to docs/Policies/.
// `doc_id` is a stable UUID; if null, one is generated and printed for you to record here.

export const CORPUS = [
  {
    // HCU Unit Demo Manual — Process Engineering / Operations / HSE / Maintenance
    filename: "HCU_Unit_Demo_Manual.pdf",
    doc_id:   "a1b2c3d4-0001-0001-0001-000000000001",   // seeded in 0002_rag_schema.sql
    title:    "Hydrocracker Unit (HCU) — Unit Demo Manual",
    department:  "process_engineering",
    sensitivity: "internal",
    version_no:  1,
    is_latest:   true,
  },
  {
    // NRL HR Policy Manual v1 (older version — kept for version-control demo)
    filename: "NRL_HR_Policy_Manual 1.docx",
    doc_id:   "b2c3d4e5-0002-0002-0002-000000000002",
    title:    "NRL HR Policy Manual",
    department:  "hr",
    sensitivity: "confidential",
    version_no:  1,
    is_latest:   false,   // v2 supersedes this
  },
  {
    // NRL HR Policy Manual v2 (current — what users get answers from)
    filename: "NRL_HR_Policy_Manual_v2.docx",
    doc_id:   "b2c3d4e5-0002-0002-0002-000000000002",   // SAME doc_id as v1
    title:    "NRL HR Policy Manual",
    department:  "hr",
    sensitivity: "confidential",
    version_no:  2,
    is_latest:   true,
  },
];

// Department → storage bucket prefix.
export const DEPT_BUCKET = {
  process_engineering:     "docs/process_engineering",
  maintenance_reliability: "docs/maintenance_reliability",
  hse:                     "docs/hse",
  operations:              "docs/operations",
  lab_quality:             "docs/lab_quality",
  hr:                      "docs/hr",
};
