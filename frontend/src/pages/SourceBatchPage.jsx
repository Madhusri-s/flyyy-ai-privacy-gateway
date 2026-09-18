import React, { useState, useEffect } from "react";
import {
  Database,
  Upload,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function SourceBatchPage({ activeRole }) {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [batching, setBatching]     = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchSize, setBatchSize]   = useState(100);
  const [mode, setMode]             = useState("upsert");
  const [uploading, setUploading]   = useState(false);
  const [uploadMsg, setUploadMsg]   = useState(null);

  const loadSource = async () => {
    setLoading(true);
    try {
      const r = await api.listSourceCustomers(50);
      setRecords(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSource(); }, []);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await api.seedSourceData();
      await loadSource();
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatch = async () => {
    setBatching(true);
    setBatchResult(null);
    try {
      const r = await api.runBatch(batchSize, mode);
      setBatchResult(r.data);
    } catch(e) {
      setBatchResult({
        status: "FAILED",
        error_count: 1,
        detail: e.response?.data?.detail || e.message
      });
    } finally {
      setBatching(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.uploadSourceCsv(fd);
      setUploadMsg({ ok: true, msg: `Uploaded ${r.data.rows_inserted || "records"} successfully.` });
      await loadSource();
    } catch(err) {
      setUploadMsg({ ok: false, msg: err.response?.data?.detail || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      title="Source Data & Ingestion Pipeline"
      subtitle="Restricted raw PII storage. Ingest raw CSV data and trigger deterministic format-preserving batch encryption."
      icon={Database}
      accentColor="#06b6d4"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={loadSource}
            className="btn-ghost"
            disabled={loading}
            style={{ fontSize: 12 }}
          >
            <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
            Refresh Data
          </button>
          <button
            onClick={handleSeed}
            className="btn-ghost"
            disabled={loading}
            style={{ fontSize: 12, borderColor: "rgba(6,182,212,0.4)", color: "#67e8f9" }}
          >
            <Database size={12} />
            Seed Sample Data
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Warning Banner: Raw PII Isolation Notice */}
        <div className="cyber-card" style={{
          padding: "16px 20px",
          background: "rgba(244, 63, 94, 0.08)",
          borderColor: "rgba(244, 63, 94, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: 14
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "rgba(244, 63, 94, 0.2)",
            border: "1px solid rgba(244, 63, 94, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <ShieldAlert size={18} style={{ color: "#f43f5e" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: "#fda4af",
              marginBottom: 2
            }}>
              CONFIDENTIAL RAW PII ENCLAVE — RESTRICTED ACCESS
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
              Data stored in this source table contains plaintext customer PII. Downstream applications (Analytics, Marketing, Customer Support)
              are cryptographically blocked from querying this table directly.
            </div>
          </div>
          <span className="badge badge-rose">RAW UNENCRYPTED</span>
        </div>

        {/* Ingestion & Batch Control Panel */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 20
        }}>
          {/* Ingestion Control Box */}
          <div className="cyber-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Upload size={16} style={{ color: "#06b6d4" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                1. Ingest Customer Records
              </h3>
            </div>
            <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
              Upload a standard customer CSV (customer_id, name, email, mobile, city, segment) or seed verified test vectors into source database.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="cyber-btn-ghost" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 18px",
                borderStyle: "dashed",
                borderColor: "rgba(6, 182, 212, 0.4)",
                cursor: "pointer"
              }}>
                <FileSpreadsheet size={16} style={{ color: "#06b6d4" }} />
                <span>{uploading ? "Uploading CSV..." : "Select CSV to Ingest"}</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>

              {uploadMsg && (
                <div style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: uploadMsg.ok ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
                  color: uploadMsg.ok ? "#6ee7b7" : "#fda4af",
                  border: `1px solid ${uploadMsg.ok ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`
                }}>
                  {uploadMsg.msg}
                </div>
              )}
            </div>
          </div>

          {/* Batch Protection Runner */}
          <div className="cyber-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Zap size={16} style={{ color: "#7c3aed" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                2. Execute Cryptographic Protection Batch
              </h3>
            </div>
            <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
              Executes Presidio entity tagging, FF1 length-preserving mobile encryption, email tokenization, and writes safe ciphertexts to protected database.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="nx-label">Batch Size</label>
                <input
                  type="number"
                  className="nx-input"
                  value={batchSize}
                  onChange={e => setBatchSize(parseInt(e.target.value) || 50)}
                />
              </div>
              <div>
                <label className="nx-label">Ingest Mode</label>
                <select className="nx-select" value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="upsert">Upsert (Idempotent)</option>
                  <option value="insert">Insert Only</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRunBatch}
              disabled={batching}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Play size={14} style={batching ? { animation: "spin-slow 1s linear infinite" } : {}} />
              {batching ? "Processing Batch..." : "Trigger Protection Batch"}
            </button>
          </div>
        </div>

        {/* Batch Result Notification */}
        {batchResult && (
          <div className="cyber-card" style={{
            padding: 20,
            background: batchResult.status === "COMPLETED" ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
            borderColor: batchResult.status === "COMPLETED" ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {batchResult.status === "COMPLETED"
                ? <CheckCircle size={18} style={{ color: "#10b981" }} />
                : <AlertCircle size={18} style={{ color: "#f43f5e" }} />
              }
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: batchResult.status === "COMPLETED" ? "#6ee7b7" : "#fda4af"
              }}>
                Batch Ingestion {batchResult.status} — ID: {batchResult.batch_id || "N/A"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
              <div>Success Count: <span style={{ color: "#6ee7b7", fontWeight: 700 }}>{batchResult.success_count ?? 0}</span></div>
              <div>Error Count: <span style={{ color: "#fda4af", fontWeight: 700 }}>{batchResult.error_count ?? 0}</span></div>
              {batchResult.started_at && <div>Started: {new Date(batchResult.started_at).toLocaleTimeString()}</div>}
            </div>
          </div>
        )}

        {/* Source Customer Plaintext Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={15} style={{ color: "#06b6d4" }} />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
                Source Database Records ({records.length})
              </span>
            </div>
            <span className="badge badge-amber">CONFIDENTIAL • SOURCE_CUSTOMERS.DB</span>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Raw Email (PII)</th>
                  <th>Raw Mobile (PII)</th>
                  <th>City</th>
                  <th>Segment</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                      No records found in source DB. Click "Seed Sample Data" or upload a CSV above.
                    </td>
                  </tr>
                ) : (
                  records.map((r, i) => (
                    <tr key={r.customer_id || i}>
                      <td>
                        <span className="badge badge-indigo">{r.customer_id}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#f8fafc" }}>
                        {r.name}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "#f43f5e",
                          background: "rgba(244, 63, 94, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4
                        }}>
                          {r.email}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "#f59e0b",
                          background: "rgba(245, 158, 11, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 4
                        }}>
                          {r.mobile}
                        </span>
                      </td>
                      <td style={{ color: "#94a3b8" }}>
                        {r.city}
                      </td>
                      <td>
                        <span className="badge badge-cyan">
                          {r.segment || "Standard"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
