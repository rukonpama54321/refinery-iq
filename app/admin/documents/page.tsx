"use client";

import { useEffect, useRef, useState } from "react";

const DEPARTMENTS = [
  { value: "process_engineering",     label: "Process Engineering" },
  { value: "maintenance_reliability", label: "Maintenance & Reliability" },
  { value: "hse",                     label: "HSE" },
  { value: "operations",              label: "Operations" },
  { value: "lab_quality",             label: "Lab & Quality" },
  { value: "hr",                      label: "HR" },
];

const SENSITIVITIES = [
  { value: "public",        label: "Public" },
  { value: "internal",      label: "Internal" },
  { value: "confidential",  label: "Confidential" },
  { value: "restricted",    label: "Restricted" },
];

interface DocVersion {
  id: string; version_no: number; status: string;
  byte_size: number; created_at: string; mime_type: string;
}
interface Doc {
  id: string; title: string; department: string; sensitivity: string;
  created_at: string; chunks: number;
  document_versions: DocVersion[];
}

interface IngestProgress {
  step: string; pct: number; message: string;
}

function statusColor(s: string) {
  if (s === "indexed") return "var(--green, #22c55e)";
  if (s === "processing") return "var(--accent)";
  if (s === "pending") return "var(--text-dim)";
  return "var(--red, #ef4444)";
}

function fmtBytes(b: number) {
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
  return (b / 1024).toFixed(0) + " KB";
}

function fmtDept(d: string) {
  return DEPARTMENTS.find((x) => x.value === d)?.label ?? d;
}

export default function DocumentsPage() {
  const [docs, setDocs]           = useState<Doc[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState<IngestProgress | null>(null);
  const [jobId, setJobId]         = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title,       setTitle]       = useState("");
  const [dept,        setDept]        = useState("operations");
  const [sensitivity, setSensitivity] = useState("internal");
  const [isCurrent,   setIsCurrent]   = useState(true);
  const [file,        setFile]        = useState<File | null>(null);

  async function loadDocs() {
    setLoading(true);
    const r = await fetch("/api/admin/documents");
    if (r.ok) setDocs(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadDocs(); }, []);

  // Poll job progress.
  useEffect(() => {
    if (!jobId) return;
    const id = setInterval(async () => {
      const r = await fetch(`/api/ingest/${jobId}`);
      if (!r.ok) return;
      const data = await r.json();
      if (data.progress) setProgress(data.progress);
      if (data.state === "completed") {
        clearInterval(id);
        setJobId(null);
        setUploading(false);
        setSuccess("Document indexed successfully!");
        setProgress(null);
        loadDocs();
      } else if (data.state === "failed") {
        clearInterval(id);
        setJobId(null);
        setUploading(false);
        setError(`Indexing failed: ${data.failedReason}`);
        setProgress(null);
      }
    }, 1500);
    return () => clearInterval(id);
  }, [jobId]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    setError(null); setSuccess(null); setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("title", title || file.name);
    form.append("department", dept);
    form.append("sensitivity", sensitivity);
    form.append("isCurrent", String(isCurrent));
    const r = await fetch("/api/upload", { method: "POST", body: form });
    const data = await r.json();
    if (!r.ok) { setError(data.error ?? "Upload failed"); setUploading(false); return; }
    setJobId(data.jobId);
    setFile(null); setTitle("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Documents</h1>
      <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 28 }}>
        Upload and manage indexed policy documents.
      </p>

      {/* Upload card */}
      <div className="glass" style={{ padding: 24, borderRadius: "var(--r-xl)", marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Upload new document</h2>
        <form onSubmit={handleUpload}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "var(--accent)" : "var(--border-2)"}`,
              borderRadius: "var(--r-md)", padding: "28px 20px", textAlign: "center",
              cursor: "pointer", marginBottom: 16, transition: "border-color 0.15s",
              background: dragging ? "rgba(99,102,241,0.06)" : "transparent",
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.docx" hidden
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>📄</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmtBytes(file.size)}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 28, marginBottom: 6 }}>⬆️</div>
                <div style={{ fontSize: 14, color: "var(--text-dim)" }}>
                  Drop a PDF or DOCX here, or <span style={{ color: "var(--accent)" }}>browse</span>
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Title</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HCU Operating Manual"
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}>
                {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Sensitivity</label>
              <select value={sensitivity} onChange={(e) => setSensitivity(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}>
                {SENSITIVITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="isCurrent" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
              <label htmlFor="isCurrent" style={{ fontSize: 13, color: "var(--text-dim)", cursor: "pointer" }}>
                Mark as current version
              </label>
            </div>
          </div>

          {/* Progress bar */}
          {uploading && progress && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)", marginBottom: 5 }}>
                <span>{progress.message}</span>
                <span>{progress.pct}%</span>
              </div>
              <div style={{ height: 5, background: "var(--glass-2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${progress.pct}%`, height: "100%", background: "var(--accent-grad)", transition: "width 0.4s ease", borderRadius: 4 }} />
              </div>
            </div>
          )}
          {uploading && !progress && (
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>Uploading…</div>
          )}

          {error   && <div style={{ fontSize: 13, color: "var(--red,#ef4444)", marginBottom: 10 }}>{error}</div>}
          {success && <div style={{ fontSize: 13, color: "var(--green,#22c55e)", marginBottom: 10 }}>{success}</div>}

          <button type="submit" disabled={uploading || !file}
            style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--accent-grad)", border: "none", borderRadius: "var(--r-md)", cursor: uploading || !file ? "default" : "pointer", opacity: uploading || !file ? 0.6 : 1 }}>
            {uploading ? "Processing…" : "Upload & Index"}
          </button>
        </form>
      </div>

      {/* Documents table */}
      <div className="glass" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>Indexed documents</h2>
          <button onClick={loadDocs} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>Loading…</div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>No documents yet. Upload one above.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--glass-2)" }}>
                {["Title", "Department", "Versions", "Chunks", "Status", "Added"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const latest = doc.document_versions?.sort((a, b) => b.version_no - a.version_no)[0];
                return (
                  <tr key={doc.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500 }}>
                      {doc.title}
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{doc.sensitivity}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-dim)" }}>{fmtDept(doc.department)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-dim)" }}>{doc.document_versions?.length ?? 0}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{ color: doc.chunks > 0 ? "var(--text)" : "var(--text-dim)" }}>{doc.chunks}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: statusColor(latest?.status ?? "") }}>
                        {latest?.status ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
