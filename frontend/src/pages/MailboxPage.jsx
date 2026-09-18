import React, { useState, useEffect } from "react";
import { Mail, RefreshCw, Inbox, CheckCircle, Clock, User, ArrowLeft } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function MailboxPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const loadMailbox = async () => {
    setLoading(true);
    try {
      const r = await api.getMailbox();
      setMessages(r.data);
      if (r.data.length > 0 && !selected) {
        setSelected(r.data[0]);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMailbox(); }, []);

  return (
    <PageShell
      title="Simulated SMTP Mailbox"
      subtitle="Captures actual outgoing email payloads dispatched by the Privacy Gateway. Verifies that decrypted emails reach their real customer destinations safely."
      icon={Mail}
      accentColor="#7c3aed"
      actions={
        <button onClick={loadMailbox} className="btn-ghost" disabled={loading} style={{ fontSize: 12 }}>
          <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
          Fetch Mailbox
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Mailbox Viewport Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: messages.length > 0 ? "minmax(300px, 1fr) 2fr" : "1fr",
          gap: 20,
          minHeight: 520
        }}>
          {/* Left: Message List */}
          <div className="cyber-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Inbox size={15} style={{ color: "#a78bfa" }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
                  Delivered Messages
                </span>
              </div>
              <span className="badge badge-violet">{messages.length} received</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {messages.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                  <Inbox size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>Mailbox is Empty</div>
                  <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    Use the Marketing Gateway to dispatch tokenized campaigns.
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isSel = selected === m;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelected(m)}
                      style={{
                        padding: "16px 18px",
                        borderBottom: "1px solid rgba(99, 102, 241, 0.08)",
                        cursor: "pointer",
                        background: isSel ? "rgba(124, 58, 237, 0.12)" : "transparent",
                        borderLeft: isSel ? "3px solid #7c3aed" : "3px solid transparent",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSel ? "#c4b5fd" : "#f8fafc"
                        }}>
                          {m.recipient || m.to || "customer@example.com"}
                        </span>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500, marginBottom: 4 }}>
                        {m.subject || "Privacy Notice / Campaign Notification"}
                      </div>
                      <div style={{
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {m.body || "Campaign message contents delivered via isolated gateway..."}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Message Detail */}
          {selected && (
            <div className="cyber-card" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
              <div style={{
                paddingBottom: 20,
                borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
                marginBottom: 20
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span className="badge badge-emerald">
                    <CheckCircle size={10} /> DELIVERED VIA GATEWAY
                  </span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginLeft: "auto" }}>
                    {selected.timestamp ? new Date(selected.timestamp).toLocaleString() : "Just now"}
                  </span>
                </div>

                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc", marginBottom: 12 }}>
                  {selected.subject || "Campaign Dispatch"}
                </h2>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "6px 14px",
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  <span style={{ color: "#64748b" }}>TO (REAL EMAIL):</span>
                  <span style={{ color: "#67e8f9", fontWeight: 700 }}>{selected.recipient || selected.to}</span>
                  <span style={{ color: "#64748b" }}>ORIGINATING TOKEN:</span>
                  <span style={{ color: "#a78bfa" }}>{selected.source_token || "EMAIL_tok_usr_c001"}</span>
                  <span style={{ color: "#64748b" }}>CAMPAIGN ID:</span>
                  <span style={{ color: "#f8fafc" }}>{selected.campaign_id || "CMP-2026-NEXUS"}</span>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                  MESSAGE CONTENT (DECRYPTED AT DESTINATION ONLY)
                </div>
                <div style={{
                  background: "rgba(3, 7, 20, 0.8)",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#cbd5e1"
                }}>
                  {selected.body || "Dear customer, your account settings have been updated in accordance with the zero-knowledge privacy operations protocol."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
