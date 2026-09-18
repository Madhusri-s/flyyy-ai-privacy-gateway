import React, { useState } from "react";
import { Eye, Lock, RefreshCw, CheckCircle, XCircle, ShieldOff, AlertTriangle, Key, ShieldCheck } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

const PURPOSES = [
  "CUSTOMER_SUPPORT",
  "FRAUD_INVESTIGATION",
  "LEGAL_COMPLIANCE",
  "BILLING_DISPUTE",
  "IDENTITY_VERIFICATION"
];
const FIELDS = ["EMAIL", "MOBILE", "NAME", "ADDRESS"];

const ROLE_PERMS = {
  ADMIN:            { allowed: true,  title: "Admin / Security Lead", color: "#7c3aed" },
  CUSTOMER_SUPPORT: { allowed: true,  title: "Customer Support",      color: "#06b6d4" },
  MARKETING:        { allowed: false, title: "Marketing Operator",    color: "#f59e0b" },
  AUDITOR:          { allowed: false, title: "Compliance Auditor",    color: "#10b981" },
};

export default function ControlledRevealPage({ activeRole }) {
  const [subjectId, setSubjectId] = useState("C001");
  const [field, setField]         = useState("EMAIL");
  const [purpose, setPurpose]     = useState("CUSTOMER_SUPPORT");
  const [reference, setReference] = useState("TICK-4921");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);

  const perm = ROLE_PERMS[activeRole] || ROLE_PERMS.ADMIN;

  const handleReveal = async () => {
    if (!reference.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await api.controlledReveal(subjectId.trim(), field, purpose, reference.trim());
      setResult({ ok: true, data: r.data });
    } catch(e) {
      setResult({
        ok: false,
        data: e.response?.data,
        status: e.response?.status,
        msg: e.response?.data?.detail || e.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Controlled Reveal Enclave"
      subtitle="Justified, audited, role-gated decryption of sensitive customer PII. Every attempt creates an immutable audit trace."
      icon={Eye}
      accentColor="#f59e0b"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Role Authorization Status Banner */}
        <div className="cyber-card" style={{
          padding: "16px 22px",
          background: perm.allowed ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
          borderColor: perm.allowed ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)",
          display: "flex",
          alignItems: "center",
          gap: 16
        }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: perm.allowed ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
            border: `1px solid ${perm.allowed ? "rgba(16, 185, 129, 0.5)" : "rgba(244, 63, 94, 0.5)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            {perm.allowed ? <Key size={18} style={{ color: "#10b981" }} /> : <ShieldOff size={18} style={{ color: "#f43f5e" }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: perm.allowed ? "#6ee7b7" : "#fda4af",
              marginBottom: 2
            }}>
              Active Role: {activeRole} — {perm.allowed ? "Controlled Decryption Permitted" : "Decryption Access Restricted"}
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
              {perm.allowed
                ? "You may request controlled reveal of specific customer fields with a valid purpose and ticket reference."
                : "Your active role does not possess decryption clearance. Any reveal request will be logged as ACCESS_DENIED in Audit Ledger."}
            </div>
          </div>
          <span className={`badge ${perm.allowed ? "badge-emerald" : "badge-rose"}`}>
            {perm.allowed ? "AUTHORIZED" : "RBAC BLOCKED"}
          </span>
        </div>

        {/* 2-Column Grid: Reveal Request Terminal & Live Inspection Enclave */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20
        }}>
          {/* Form Box */}
          <div className="cyber-card" style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Lock size={16} style={{ color: "#f59e0b" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Decryption Request Parameters
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="nx-label">Target Customer ID *</label>
                  <input
                    className="nx-input"
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    placeholder="e.g. C001"
                  />
                </div>
                <div>
                  <label className="nx-label">Target Field *</label>
                  <select className="nx-select" value={field} onChange={e => setField(e.target.value)}>
                    {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="nx-label">Operational Purpose *</label>
                <select className="nx-select" value={purpose} onChange={e => setPurpose(e.target.value)}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="nx-label">Reference / Ticket ID (Mandatory for Audit) *</label>
                <input
                  className="nx-input"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. TICK-4921 or JIRA-102"
                />
              </div>

              <button
                onClick={handleReveal}
                disabled={loading || !reference.trim()}
                className="btn-primary"
                style={{
                  marginTop: 10,
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #f59e0b 0%, #7c3aed 100%)"
                }}
              >
                <Eye size={14} />
                {loading ? "Decrypting Enclave Token..." : "Request Controlled Reveal"}
              </button>
            </div>
          </div>

          {/* Reveal Result Enclave Box */}
          <div className="cyber-card" style={{ padding: 26, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <ShieldCheck size={16} style={{ color: "#06b6d4" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Enclave Decryption Inspection Result
              </h3>
            </div>

            {!result ? (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 200,
                color: "#64748b",
                textAlign: "center"
              }}>
                <Lock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                  Decryption Enclave Sealed
                </div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", maxWidth: 280, marginTop: 4 }}>
                  Submit a valid customer ID and reference ticket to trigger enclave decryption.
                </div>
              </div>
            ) : result.ok ? (
              <div style={{
                padding: 20,
                borderRadius: 14,
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={18} style={{ color: "#10b981" }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#6ee7b7" }}>
                    DECRYPTION ALLOWED & AUDITED
                  </span>
                  <span className="badge badge-emerald" style={{ marginLeft: "auto" }}>
                    HTTP 200
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                    Revealed Plaintext ({field})
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#f8fafc",
                    background: "rgba(4, 7, 20, 0.9)",
                    padding: "10px 14px",
                    borderRadius: 8,
                    marginTop: 6,
                    border: "1px solid rgba(16, 185, 129, 0.4)"
                  }}>
                    {result.data.plaintext_value || result.data.value || JSON.stringify(result.data)}
                  </div>
                </div>

                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div>Audit Event ID: <span style={{ color: "#a5b4fc" }}>{result.data.audit_event_id || "EVT-LOGGED"}</span></div>
                  <div>Justification Stamped: <span style={{ color: "#67e8f9" }}>{purpose} • {reference}</span></div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 20,
                borderRadius: 14,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 16
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <XCircle size={18} style={{ color: "#f43f5e" }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#fda4af" }}>
                    ACCESS DENIED — ENCLAVE LOCKED
                  </span>
                  <span className="badge badge-rose" style={{ marginLeft: "auto" }}>
                    HTTP {result.status || 403}
                  </span>
                </div>

                <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#fda4af" }}>
                  {result.msg || "The requested operation was blocked by RBAC policy. This access attempt was recorded in the immutable audit ledger."}
                </p>

                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8" }}>
                  Recorded Actor: <span style={{ color: "#f8fafc" }}>{activeRole}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
