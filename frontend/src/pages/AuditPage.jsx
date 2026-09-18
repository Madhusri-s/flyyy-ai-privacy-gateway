import React, { useState, useEffect } from "react";
import { FileText, RefreshCw, Filter, X, CheckCircle, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function AuditPage() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ actor: "", action: "", role: "", result: "", limit: "100" });
  const [expanded, setExpanded] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const r = await api.getAuditLogs(filters);
      setLogs(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, []);

  const deniedCount  = logs.filter(l => l.result === "ACCESS_DENIED" || l.result === "FAILED").length;
  const allowedCount = logs.filter(l => l.result === "ALLOWED" || l.result === "SUCCESS").length;

  return (
    <PageShell
      title="Immutable Audit Ledger"
      subtitle="Cryptographically verified forensic audit trail of all sensitive operations. Zero plaintext customer PII is ever stored in audit events."
      icon={FileText}
      accentColor="#6366f1"
      actions={
        <button onClick={loadLogs} className="btn-ghost" disabled={loading} style={{ fontSize: 12 }}>
          <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
          Refresh Audit Trail
        </button>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>TOTAL AUDITED EVENTS</span>
              <FileText size={15} style={{ color: "#6366f1" }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#f8fafc" }}>
              {logs.length}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Immutable Append-Only Log
            </div>
          </div>

          <div className="cyber-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>PERMITTED ACTIONS</span>
              <ShieldCheck size={15} style={{ color: "#10b981" }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#10b981" }}>
              {allowedCount}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Authorized via RBAC & Policy
            </div>
          </div>

          <div className="cyber-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>SECURITY VIOLATIONS / BLOCKS</span>
              <ShieldAlert size={15} style={{ color: "#f43f5e" }} />
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 26, color: "#f43f5e" }}>
              {deniedCount}
            </div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 4 }}>
              Blocked by Perimeter Gates
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="cyber-card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#a5b4fc", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            <Filter size={14} /> FILTERS:
          </div>

          <input
            className="nx-input"
            style={{ width: 140, padding: "6px 10px", fontSize: 11 }}
            placeholder="Filter Actor..."
            value={filters.actor}
            onChange={e => setFilters(f => ({ ...f, actor: e.target.value }))}
          />

          <input
            className="nx-input"
            style={{ width: 160, padding: "6px 10px", fontSize: 11 }}
            placeholder="Filter Action..."
            value={filters.action}
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          />

          <select
            className="nx-select"
            style={{ width: 140, padding: "6px 10px", fontSize: 11 }}
            value={filters.result}
            onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}
          >
            <option value="">All Results</option>
            <option value="ALLOWED">ALLOWED</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button onClick={loadLogs} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 11 }}>
            Apply Filter
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
              Forensic Event Stream ({logs.length} entries)
            </span>
            <span className="badge badge-indigo">AUDIT_DB • PHYSICAL ENCLAVE</span>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Timestamp</th>
                  <th>Actor / User ID</th>
                  <th>Role</th>
                  <th>Action Executed</th>
                  <th>Result</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                      No audit logs match criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((l, i) => {
                    const isDenied = l.result === "ACCESS_DENIED" || l.result === "FAILED";
                    return (
                      <React.Fragment key={l.id || i}>
                        <tr
                          onClick={() => setExpanded(expanded === i ? null : i)}
                          style={{ cursor: "pointer" }}
                        >
                          <td><span className="badge badge-indigo">#{l.id || i + 1}</span></td>
                          <td style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
                            {l.timestamp ? new Date(l.timestamp).toLocaleString() : "Just now"}
                          </td>
                          <td style={{ fontWeight: 600, color: "#f8fafc", fontFamily: "'JetBrains Mono', monospace" }}>
                            {l.actor || "system_operator"}
                          </td>
                          <td>
                            <span className="badge badge-violet">{l.role || "ADMIN"}</span>
                          </td>
                          <td>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#67e8f9", fontSize: 11 }}>
                              {l.action}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${isDenied ? "badge-rose" : "badge-emerald"}`}>
                              {isDenied ? <XCircle size={10} /> : <CheckCircle size={10} />}
                              {l.result}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 11, color: "#6366f1", textDecoration: "underline" }}>
                              {expanded === i ? "Hide" : "Inspect"}
                            </span>
                          </td>
                        </tr>
                        {expanded === i && (
                          <tr>
                            <td colSpan={7} style={{ background: "rgba(4, 7, 20, 0.95)", padding: 18 }}>
                              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 6 }}>
                                RAW AUDIT PAYLOAD (IMMUTABLE LOG ENTRY):
                              </div>
                              <pre style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: "#a5b4fc",
                                background: "rgba(0,0,0,0.5)",
                                padding: 12,
                                borderRadius: 8,
                                overflowX: "auto"
                              }}>
                                {JSON.stringify(l, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
