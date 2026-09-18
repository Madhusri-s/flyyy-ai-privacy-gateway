import React, { useState } from "react";
import { Send, RefreshCw, Shield, CheckCircle, AlertCircle, Lock, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function MarketingPage({ activeRole }) {
  const [recipient, setRecipient]   = useState("EMAIL_tok_usr_c001");
  const [campaignId, setCampaignId] = useState("CMP-2026-NEXUS");
  const [template, setTemplate]     = useState("WELCOME_OFFER");
  const [sending, setSending]       = useState(false);
  const [result, setResult]         = useState(null);

  const canSend = ["MARKETING", "ADMIN"].includes(activeRole);

  const handleSend = async () => {
    if (!recipient.trim() || !canSend) return;
    setSending(true);
    setResult(null);
    try {
      const r = await api.sendMarketingEmail(recipient.trim(), campaignId, template);
      setResult({ ok: true, data: r.data });
    } catch(e) {
      setResult({ ok: false, data: e.response?.data, msg: e.response?.data?.detail || e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell
      title="Marketing Privacy Gateway"
      subtitle="Downstream campaign dispatcher. Marketing operators only touch protected tokens — never plaintext. Token resolution occurs strictly in-memory inside the gateway."
      icon={Send}
      accentColor="#06b6d4"
      actions={
        <Link to="/mailbox" style={{ textDecoration: "none" }}>
          <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={12} style={{ color: "#a78bfa" }} />
            View Local Mailbox Deliveries
          </button>
        </Link>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Architecture Notice Banner */}
        <div className="cyber-card" style={{
          padding: 24,
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(124, 58, 237, 0.05))",
          borderColor: "rgba(6, 182, 212, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Shield size={18} style={{ color: "#06b6d4" }} />
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
              Zero-Plaintext Outreach Isolation Standard
            </h3>
          </div>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", lineHeight: 1.6, maxWidth: 840 }}>
            Notice that marketing personnel enter or select a protected token (e.g. <span style={{ color: "#67e8f9" }}>EMAIL_tok_usr_c001</span>).
            The Gateway verifies caller permissions, reverse-resolves the token inside an ephemeral in-memory enclave, and directly transmits to the mail server.
            The operator is NEVER shown the unmasked email address!
          </p>
        </div>

        {/* 2-Column Layout: Dispatch Form & Gateway Telemetry Trace */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20
        }}>
          {/* Dispatch Form */}
          <div className="cyber-card" style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Send size={16} style={{ color: "#06b6d4" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Dispatch Tokenized Campaign
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label className="nx-label">Recipient Email Token (Zero Plaintext)</label>
                <input
                  className="nx-input"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="e.g. EMAIL_tok_usr_c001"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="nx-label">Campaign ID</label>
                  <input
                    className="nx-input"
                    value={campaignId}
                    onChange={e => setCampaignId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="nx-label">Template ID</label>
                  <select className="nx-select" value={template} onChange={e => setTemplate(e.target.value)}>
                    <option value="WELCOME_OFFER">WELCOME_OFFER</option>
                    <option value="SECURITY_NOTICE">SECURITY_NOTICE</option>
                    <option value="MONTHLY_SUMMARY">MONTHLY_SUMMARY</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !recipient.trim() || !canSend}
                className="btn-primary"
                style={{ marginTop: 10, justifyContent: "center" }}
              >
                <Send size={14} style={sending ? { animation: "spin-slow 1s linear infinite" } : {}} />
                {sending ? "Routing via Gateway..." : "Dispatch Through Privacy Gateway"}
              </button>

              {!canSend && (
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#fda4af" }}>
                  * Current role ({activeRole}) is not permitted to dispatch marketing campaigns. Switch to MARKETING or ADMIN in the sidebar.
                </div>
              )}
            </div>
          </div>

          {/* Gateway Trace & Delivery Receipt */}
          <div className="cyber-card" style={{ padding: 26, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Lock size={16} style={{ color: "#a855f7" }} />
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
                Gateway Execution Receipt
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
                <Send size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                  Gateway Awaiting Dispatch
                </div>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", maxWidth: 280, marginTop: 4 }}>
                  Enter token parameters and submit to execute verified gateway delivery.
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
                gap: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle size={18} style={{ color: "#10b981" }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#6ee7b7" }}>
                    DISPATCHED SAFELY [SUCCESS]
                  </span>
                  <span className="badge badge-emerald" style={{ marginLeft: "auto" }}>
                    DELIVERED
                  </span>
                </div>

                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", lineHeight: 1.6 }}>
                  <div>Target Token: <span style={{ color: "#67e8f9" }}>{recipient}</span></div>
                  <div>Gateway Resolution: <span style={{ color: "#6ee7b7" }}>Ephemeral In-Memory [RESOLVED]</span></div>
                  <div>Delivery Mailbox: <span style={{ color: "#a5b4fc" }}>Delivered to local SMTP inbox</span></div>
                  <div>Operator Visibility: <span style={{ color: "#fda4af" }}>Plaintext Never Displayed</span></div>
                </div>

                <Link to="/mailbox" style={{ textDecoration: "none", marginTop: 4 }}>
                  <button className="cyber-btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 11 }}>
                    <Mail size={12} /> Verify Delivery in Test Mailbox
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{
                padding: 20,
                borderRadius: 14,
                background: "rgba(244, 63, 94, 0.08)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <AlertCircle size={18} style={{ color: "#f43f5e" }} />
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#fda4af" }}>
                    DISPATCH BLOCKED
                  </span>
                </div>
                <p style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#fda4af" }}>
                  {result.msg || "Failed to dispatch email via gateway."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
