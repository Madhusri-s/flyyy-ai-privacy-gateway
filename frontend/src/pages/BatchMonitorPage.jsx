import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, CheckCircle, XCircle, Clock, Layers, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import api from "../services/api";

function StatusBadge({ status }) {
  if (status === "COMPLETED") {
    return (
      <span className="badge badge-emerald">
        <CheckCircle size={10} /> COMPLETED
      </span>
    );
  }
  if (status === "RUNNING") {
    return (
      <span className="badge badge-cyan">
        <RefreshCw size={10} style={{ animation: "spin-slow 1s linear infinite" }} /> RUNNING
      </span>
    );
  }
  return (
    <span className="badge badge-rose">
      <XCircle size={10} /> {status || "FAILED"}
    </span>
  );
}

export default function BatchMonitorPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const r = await api.listBatches(20);
      setBatches(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    const t = setInterval(loadBatches, 10000);
    return () => clearInterval(t);
  }, []);

  const totalSuccess = batches.reduce((acc, b) => acc + (b.success_count || 0), 0);
  const totalErrors  = batches.reduce((acc, b) => acc + (b.error_count || 0), 0);

  return (
    <PageShell
      title="Batch Ingestion Telemetry"
      subtitle="Real-time telemetry and execution history of chunked protection batches. Auto-refreshes every 10 seconds."
      icon={Terminal}
      accentColor="#10b981"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={loadBatches} className="btn-ghost" disabled={loading} style={{ fontSize: 12 }}>
            <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
            Refresh Telemetry
          </button>
          <Link to="/source-batches" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ fontSize: 12 }}>
              <Zap size={12} /> Trigger Ingestion Batch
            </button>
          </Link>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Metric Summary Tiles */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16
        }}>
          <div className="cyber-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 6 }}>
              TOTAL BATCH RUNS
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#f8fafc" }}>
              {batches.length}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Idempotent Ingestion Jobs
            </div>
          </div>

          <div className="cyber-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 6 }}>
              SUCCESSFULLY TRANSFORMED
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#10b981" }}>
              {totalSuccess}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Customer Records Encrypted
            </div>
          </div>

          <div className="cyber-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 6 }}>
              BATCH ERRORS
            </div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 26,
              color: totalErrors === 0 ? "#10b981" : "#f43f5e"
            }}>
              {totalErrors}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Zero Failure Target
            </div>
          </div>
        </div>

        {/* Historical Batch Runs Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
              Batch Execution History ({batches.length} runs)
            </span>
            <span className="badge badge-emerald">BATCH_DB • TELEMETRY</span>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Status</th>
                  <th>Success Count</th>
                  <th>Error Count</th>
                  <th>Mode</th>
                  <th>Started Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                      No batch runs found. Go to "Source & Ingestion" to run a protection batch.
                    </td>
                  </tr>
                ) : (
                  batches.map((b, idx) => (
                    <tr key={b.batch_id || idx}>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#67e8f9" }}>
                          {b.batch_id}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#10b981" }}>
                          {b.success_count ?? 0}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          color: (b.error_count || 0) > 0 ? "#f43f5e" : "#64748b"
                        }}>
                          {b.error_count ?? 0}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-indigo">
                          {b.mode || "UPSERT"}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
                        {b.started_at ? new Date(b.started_at).toLocaleString() : "Recently"}
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
