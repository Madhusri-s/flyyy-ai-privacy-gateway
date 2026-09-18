import React, { useState, useEffect } from "react";
import { Zap, RefreshCw, AlertCircle, CheckCircle, ArrowRight, ShieldCheck } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function BouncePage() {
  const [bounces, setBounces]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState("alice.johnson@example.com");
  const [event, setEvent]       = useState("BOUNCE");
  const [reason, setReason]     = useState("MAILBOX_NOT_FOUND");
  const [sending, setSending]   = useState(false);
  const [result, setResult]     = useState(null);

  const loadBounces = async () => {
    setLoading(true);
    try {
      const r = await api.listBounces();
      setBounces(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBounces(); }, []);

  const handleSendWebhook = async () => {
    if (!email.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const r = await api.sendBounceWebhook(email.trim(), event, reason);
      setResult({ ok: true, data: r.data });
      await loadBounces();
    } catch(e) {
      setResult({ ok: false, msg: e.response?.data?.detail || e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell
      title="Bounce Webhook & Reverse Resolution"
      subtitle="External mail provider sends bounce callback with raw email. Gateway reverse-resolves email to token via Vault HMAC — plaintext is never stored."
      icon={Zap}
      accentColor="#f59e0b"
      actions={
        <button onClick={loadBounces} className="btn-ghost" disabled={loading} style={{ fontSize: 12 }}>
          <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
          Refresh Bounces
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Architecture Explanation Card */}
        <div className="cyber-card" style={{
          padding: 24,
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(124, 58, 237, 0.05))",
          borderColor: "rgba(245, 158, 11, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ShieldCheck size={18} style={{ color: "#f59e0b" }} />
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
              How Reverse Resolution Protects Inbound Webhooks
            </h3>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 14
          }}>
            {[
              { step: "1", title: "Inbound Plaintext Email", desc: "ESP webhook sends raw recipient email in callback payload." },
              { step: "2", title: "Vault Reverse Lookup", desc: "Gateway computes deterministic HMAC to locate matching customer token." },
              { step: "3", title: "Zero-Plaintext Storage", desc: "Bounce event is saved with token only. Raw email discarded immediately." },
            ].map(s => (
              <div key={s.step} style={{
                background: "rgba(4, 7, 20, 0.6)",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid rgba(245, 158, 11, 0.2)"
              }}>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>
                  STEP {s.step}
                </div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: "#f8fafc", marginBottom: 2 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", lineHeight: 1.4 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column: Webhook Simulator Form & Delivery Receipt */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20
        }}>
          {/* Webhook Form */}
          <div className="cyber-card" style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Zap size={16} style={{ color: "#f59e0b" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Simulate ESP Bounce Webhook Callback
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="nx-label">Incoming Recipient Email (Plaintext from ESP)</label>
                <input
                  className="nx-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. alice.johnson@example.com"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="nx-label">Event Type</label>
                  <select className="nx-select" value={event} onChange={e => setEvent(e.target.value)}>
                    <option value="BOUNCE">BOUNCE</option>
                    <option value="COMPLAINT">COMPLAINT</option>
                    <option value="UNSUBSCRIBE">UNSUBSCRIBE</option>
                  </select>
                </div>
                <div>
                  <label className="nx-label">Bounce Reason</label>
                  <select className="nx-select" value={reason} onChange={e => setReason(e.target.value)}>
                    <option value="MAILBOX_NOT_FOUND">MAILBOX_NOT_FOUND</option>
                    <option value="SPAM_REJECTED">SPAM_REJECTED</option>
                    <option value="DOMAIN_UNREACHABLE">DOMAIN_UNREACHABLE</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSendWebhook}
                disabled={sending || !email.trim()}
                className="btn-primary"
                style={{
                  marginTop: 8,
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #f59e0b 0%, #7c3aed 100%)"
                }}
              >
                <Zap size={14} style={sending ? { animation: "spin-slow 1s linear infinite" } : {}} />
                {sending ? "Reverse Resolving..." : "Post Bounce Webhook"}
              </button>
            </div>
          </div>

          {/* Webhook Resolution Receipt */}
          <div className="cyber-card" style={{ padding: 26, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <ShieldCheck size={16} style={{ color: "#10b981" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Reverse Resolution Receipt
              </h3>
            </div>

            {!result ? (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
                color: "#64748b",
                textAlign: "center"
              }}>
                <Zap size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                  Webhook Simulator Idle
                </div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", maxWidth: 280, marginTop: 4 }}>
                  Post an inbound bounce to observe the vault reverse token lookup.
                </div>
              </div>
            ) : result.ok ? (
              <div style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} style={{ color: "#10b981" }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#6ee7b7" }}>
                    REVERSE RESOLUTION SUCCESSFUL
                  </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", lineHeight: 1.6 }}>
                  <div>Raw Input: <span style={{ color: "#fda4af" }}>{email}</span></div>
                  <div>Resolved Token: <span style={{ color: "#67e8f9", fontWeight: 700 }}>{result.data.token || "EMAIL_tok_usr_c001"}</span></div>
                  <div>Storage Guarantee: <span style={{ color: "#6ee7b7" }}>Only Token Stored in DB</span></div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: 18,
                borderRadius: 12,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.3)"
              }}>
                <div style={{ color: "#fda4af", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  {result.msg || "Reverse resolution failed."}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bounces Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
              Logged Bounce Events ({bounces.length}) — Zero-Plaintext Stored
            </span>
            <span className="badge badge-emerald">TOKENIZED STORAGE</span>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Protected Token</th>
                  <th>Event Type</th>
                  <th>Reason</th>
                  <th>Recorded Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {bounces.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 36, color: "#64748b" }}>
                      No bounce events recorded yet. Post a simulation above.
                    </td>
                  </tr>
                ) : (
                  bounces.map((b, i) => (
                    <tr key={b.id || i}>
                      <td><span className="badge badge-indigo">#{b.id || i + 1}</span></td>
                      <td>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#67e8f9" }}>
                          {b.email_token || b.token || "EMAIL_tok_usr_c001"}
                        </span>
                      </td>
                      <td><span className="badge badge-amber">{b.event || "BOUNCE"}</span></td>
                      <td style={{ color: "#94a3b8" }}>{b.reason || "MAILBOX_NOT_FOUND"}</td>
                      <td style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>
                        {b.timestamp ? new Date(b.timestamp).toLocaleString() : "Just now"}
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
