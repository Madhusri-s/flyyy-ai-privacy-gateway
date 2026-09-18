import React from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Search,
  Sliders,
  ShieldCheck,
  Server,
  Lock,
  Send,
  ArrowRight,
  Cpu,
  FileText,
  Zap
} from "lucide-react";

export default function PrivacyTopology({ stats }) {
  const nodes = [
    {
      id: "source",
      step: "01",
      title: "SOURCE DB",
      subtitle: "Raw Ingestion",
      count: stats?.source_records ?? 0,
      unit: "records",
      badge: "RESTRICTED",
      color: "#06b6d4",
      icon: Database,
      link: "/source-batches",
      desc: "Raw customer PII ingested from CSV. Isolated access."
    },
    {
      id: "discovery",
      step: "02",
      title: "PII DISCOVERY",
      subtitle: "Presidio Engine",
      count: stats?.sensitive_fields_detected ?? 3,
      unit: "entities",
      badge: "AI SCANNER",
      color: "#6366f1",
      icon: Cpu,
      link: "/discovery",
      desc: "Automated entity & confidence scoring across schema."
    },
    {
      id: "policy",
      step: "03",
      title: "POLICY MATRIX",
      subtitle: "Field Rules",
      count: stats?.active_policies ?? 6,
      unit: "rules active",
      badge: "DYNAMIC",
      color: "#a855f7",
      icon: Sliders,
      link: "/policies",
      desc: "FF1 preservation, Vault tokenization, pass-through rules."
    },
    {
      id: "vault",
      step: "04",
      title: "CRYPTO VAULT",
      subtitle: "AES-256-GCM + FF1",
      count: stats?.vault_mappings ?? 0,
      unit: "key mappings",
      badge: "ENCLAVE",
      color: "#7c3aed",
      icon: Lock,
      link: "/policies",
      desc: "Isolated key management & format-preserving encryption engine."
    },
    {
      id: "protected",
      step: "05",
      title: "PROTECTED DB",
      subtitle: "Downstream Store",
      count: stats?.protected_records ?? 0,
      unit: "safe records",
      badge: "ZERO PLAINTEXT",
      color: "#10b981",
      icon: Server,
      link: "/customers",
      desc: "100% tokenized & encrypted database accessible to analytics."
    },
    {
      id: "gateway",
      step: "06",
      title: "PRIVACY GATEWAY",
      subtitle: "Action Broker",
      count: stats?.gateway_status || "ACTIVE",
      unit: "boundary",
      badge: "REVEAL GATE",
      color: "#f59e0b",
      icon: ShieldCheck,
      link: "/marketing",
      desc: "In-memory token resolution without leaking plaintext to operators."
    },
    {
      id: "audit",
      step: "07",
      title: "AUDIT LEDGER",
      subtitle: "Immutable Log",
      count: stats?.audit_events ?? 0,
      unit: "events logged",
      badge: "ZERO PII",
      color: "#06b6d4",
      icon: FileText,
      link: "/audit",
      desc: "Cryptographically stamped forensic log with zero raw PII."
    }
  ];

  return (
    <div className="cyber-card" style={{ padding: "26px 28px", width: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(6, 182, 212, 0.15)",
            border: "1px solid rgba(6, 182, 212, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Zap size={18} style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <h2 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: "#f8fafc"
            }}>
              Zero-Knowledge Privacy Architecture Topology
            </h2>
            <p style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#64748b"
            }}>
              Live data lifecycle from Raw Source ingestion to Enclave tokenization and Governance.
            </p>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#94a3b8"
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px #10b981",
            animation: "pulse-glow 2s ease-in-out infinite"
          }} />
          <span>REAL-TIME TELEMETRY CONNECTED</span>
        </div>
      </div>

      {/* Grid of Topology Nodes */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 14,
        position: "relative"
      }}>
        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <Link
              key={node.id}
              to={node.link}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                background: "rgba(4, 8, 22, 0.7)",
                border: `1px solid ${node.color}35`,
                borderRadius: 14,
                padding: "16px 14px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: `0 4px 20px rgba(0,0,0,0.3)`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = node.color;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 30px ${node.color}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = `${node.color}35`;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3)`;
              }}
              >
                {/* Node Step & Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10
                }}>
                  <span style={{
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    color: node.color
                  }}>
                    {node.step}
                  </span>
                  <span style={{
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: `${node.color}15`,
                    color: node.color,
                    border: `1px solid ${node.color}40`,
                    letterSpacing: "0.08em"
                  }}>
                    {node.badge}
                  </span>
                </div>

                {/* Icon & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${node.color}15`,
                    border: `1px solid ${node.color}35`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Icon size={14} style={{ color: node.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      color: "#f8fafc",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {node.title}
                    </div>
                    <div style={{
                      fontSize: 9,
                      fontFamily: "'JetBrains Mono', monospace",
                      color: "#64748b"
                    }}>
                      {node.subtitle}
                    </div>
                  </div>
                </div>

                {/* Metric Value */}
                <div style={{ marginTop: "auto", paddingTop: 10 }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: "#ffffff"
                  }}>
                    {node.count}
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#94a3b8"
                  }}>
                    {node.unit}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
