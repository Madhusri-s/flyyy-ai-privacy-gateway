import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import {
  Shield, Database, Cpu, Layers, Users, Activity,
  Send, Zap, Lock, FileText, ShieldCheck, Mail,
  AlertOctagon, Terminal, Eye, ExternalLink, ChevronRight
} from "lucide-react";

import OverviewPage          from "./pages/OverviewPage";
import SourceBatchPage       from "./pages/SourceBatchPage";
import DiscoveryPage         from "./pages/DiscoveryPage";
import PolicyPage            from "./pages/PolicyPage";
import ProtectedCustomersPage from "./pages/ProtectedCustomersPage";
import BatchMonitorPage      from "./pages/BatchMonitorPage";
import MarketingPage         from "./pages/MarketingPage";
import BouncePage            from "./pages/BouncePage";
import ControlledRevealPage  from "./pages/ControlledRevealPage";
import AuditPage             from "./pages/AuditPage";
import PosturePage           from "./pages/PosturePage";
import MailboxPage           from "./pages/MailboxPage";
import LeakageScannerPage    from "./pages/LeakageScannerPage";

/* ─── Navigation Config ─────────────────────────────────────────── */
const NAV = [
  {
    group: "CONTROL",
    items: [
      { path: "/",               label: "Nexus Overview",      icon: Activity,    accent: "#7c3aed" },
      { path: "/source-batches", label: "Source & Ingestion",  icon: Database,    accent: "#06b6d4" },
      { path: "/discovery",      label: "PII Discovery",       icon: Cpu,         accent: "#6366f1" },
      { path: "/policies",       label: "Protection Policies", icon: Layers,      accent: "#a855f7" },
    ]
  },
  {
    group: "DATA VAULT",
    items: [
      { path: "/customers",      label: "Protected Customers", icon: Users,       accent: "#06b6d4" },
      { path: "/leakage-check",  label: "Leakage Scanner",     icon: AlertOctagon,accent: "#f43f5e" },
    ]
  },
  {
    group: "OPERATIONS",
    items: [
      { path: "/batch-monitor",  label: "Batch Telemetry",     icon: Terminal,    accent: "#10b981" },
      { path: "/marketing",      label: "Marketing Gateway",   icon: Send,        accent: "#06b6d4" },
      { path: "/bounces",        label: "Bounce Webhook",      icon: Zap,         accent: "#f59e0b" },
      { path: "/mailbox",        label: "Local Mailbox",       icon: Mail,        accent: "#7c3aed" },
    ]
  },
  {
    group: "GOVERNANCE",
    items: [
      { path: "/reveal",         label: "Controlled Reveal",   icon: Eye,         accent: "#f59e0b" },
      { path: "/audit",          label: "Audit Investigation", icon: FileText,    accent: "#6366f1" },
      { path: "/posture",        label: "Security Posture",    icon: ShieldCheck, accent: "#10b981" },
    ]
  },
];

const ROLES = [
  { id: "ADMIN",            label: "Admin / Security Lead",   color: "#7c3aed", desc: "Full Enclave Decryption & Audit" },
  { id: "CUSTOMER_SUPPORT", label: "Customer Support",        color: "#06b6d4", desc: "Masked Queries & Justified Reveal" },
  { id: "MARKETING",        label: "Marketing Operator",      color: "#f59e0b", desc: "Tokenized Outreach Only" },
  { id: "AUDITOR",          label: "Compliance Auditor",      color: "#10b981", desc: "Read-Only Forensics & Verification" },
];

/* ─── Cyber Sidebar Component ───────────────────────────────────── */
function Sidebar({ activeRole, setActiveRole }) {
  const location = useLocation();
  const currentRoleObj = ROLES.find(r => r.id === activeRole) || ROLES[0];

  return (
    <aside className="sidebar">
      <div className="sidebar-grad-line" />

      {/* Brand Header */}
      <div style={{
        padding: "20px 18px 16px",
        borderBottom: "1px solid rgba(99, 102, 241, 0.14)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            flexShrink: 0,
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(6, 182, 212, 0.2))",
            border: "1px solid rgba(6, 182, 212, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(124, 58, 237, 0.4)"
          }}>
            <Shield size={20} style={{ color: "#67e8f9" }} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.01em",
              background: "linear-gradient(135deg, #f8fafc 0%, #a78bfa 50%, #67e8f9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              FLYYY.AI
            </div>
            <div style={{
              fontSize: 9,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#64748b",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginTop: 2
            }}>
              Privacy Enclave OS
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher HUD */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid rgba(99, 102, 241, 0.12)",
        background: "rgba(99, 102, 241, 0.04)"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6
        }}>
          <span style={{
            fontSize: 9,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700
          }}>
            Simulated Role (RBAC)
          </span>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: currentRoleObj.color,
            boxShadow: `0 0 8px ${currentRoleObj.color}`
          }} />
        </div>

        <select
          id="global-role-select"
          value={activeRole}
          onChange={e => {
            setActiveRole(e.target.value);
            localStorage.setItem("flyyy_active_role", e.target.value);
          }}
          className="nx-select"
          style={{
            fontSize: 11,
            padding: "6px 10px",
            borderColor: `${currentRoleObj.color}60`
          }}
        >
          {ROLES.map(r => (
            <option key={r.id} value={r.id} style={{ background: "#060919", color: "#f8fafc" }}>
              {r.label}
            </option>
          ))}
        </select>

        <div style={{
          marginTop: 6,
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#94a3b8",
          lineHeight: 1.4
        }}>
          {currentRoleObj.desc}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }} className="no-scroll">
        {NAV.map(group => (
          <div key={group.group}>
            <div className="nav-group-label">{group.group}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon
                    size={14}
                    style={{
                      color: isActive ? item.accent : "#64748b",
                      transition: "color 0.2s ease"
                    }}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div style={{
                      marginLeft: "auto",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: item.accent,
                      boxShadow: `0 0 8px ${item.accent}`
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer System Diagnostics */}
      <div style={{
        padding: "14px 18px",
        borderTop: "1px solid rgba(99, 102, 241, 0.12)",
        background: "rgba(2, 4, 12, 0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 10px #10b981",
            animation: "pulse-glow 2s ease-in-out infinite"
          }} />
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: "#10b981",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}>
            Boundary Active
          </span>
        </div>
        <div style={{
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          color: "#475569",
          lineHeight: 1.5
        }}>
          AES-256-GCM Vault • FF1 Engine<br />
          Zero Plaintext Storage Standard
        </div>
      </div>
    </aside>
  );
}

/* ─── Top Mission Control HUD Bar ───────────────────────────────── */
function TopHudBar({ activeRole }) {
  const currentRoleObj = ROLES.find(r => r.id === activeRole) || ROLES[0];

  return (
    <header className="top-hud-bar">
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 8,
          background: "rgba(6, 182, 212, 0.1)",
          border: "1px solid rgba(6, 182, 212, 0.3)"
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#06b6d4",
            boxShadow: "0 0 8px #06b6d4"
          }} />
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: "#67e8f9",
            letterSpacing: "0.08em"
          }}>
            6 PHYSICAL DBS ISOLATED
          </span>
        </div>

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 8,
          background: "rgba(124, 58, 237, 0.1)",
          border: "1px solid rgba(124, 58, 237, 0.3)"
        }}>
          <Lock size={11} style={{ color: "#a78bfa" }} />
          <span style={{
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            color: "#c4b5fd",
            letterSpacing: "0.08em"
          }}>
            FF1 CIPHER OPERATIONAL
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: 8,
          background: `${currentRoleObj.color}15`,
          border: `1px solid ${currentRoleObj.color}45`,
          color: currentRoleObj.color,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: currentRoleObj.color,
            boxShadow: `0 0 8px ${currentRoleObj.color}`
          }} />
          {activeRole}
        </div>

        <Link
          to="/posture"
          className="cyber-btn-ghost"
          style={{
            fontSize: 11,
            padding: "5px 12px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <ShieldCheck size={13} style={{ color: "#10b981" }} />
          <span>Security Score: 100%</span>
        </Link>
      </div>
    </header>
  );
}

/* ─── Root App Component ────────────────────────────────────────── */
export default function App() {
  const [activeRole, setActiveRole] = useState(
    localStorage.getItem("flyyy_active_role") || "ADMIN"
  );

  useEffect(() => {
    localStorage.setItem("flyyy_active_role", activeRole);
  }, [activeRole]);

  return (
    <Router>
      {/* Background Ambience */}
      <div className="aurora-bg">
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="grid-overlay" />

      {/* 100% Full-Width Guaranteed Flex Container */}
      <div className="app-layout">
        <Sidebar activeRole={activeRole} setActiveRole={setActiveRole} />

        <div className="main-viewport">
          <TopHudBar activeRole={activeRole} />

          <Routes>
            <Route path="/"               element={<OverviewPage activeRole={activeRole} />} />
            <Route path="/source-batches" element={<SourceBatchPage activeRole={activeRole} />} />
            <Route path="/discovery"      element={<DiscoveryPage />} />
            <Route path="/policies"       element={<PolicyPage activeRole={activeRole} />} />
            <Route path="/customers"      element={<ProtectedCustomersPage />} />
            <Route path="/batch-monitor"  element={<BatchMonitorPage />} />
            <Route path="/marketing"      element={<MarketingPage activeRole={activeRole} />} />
            <Route path="/bounces"        element={<BouncePage />} />
            <Route path="/reveal"         element={<ControlledRevealPage activeRole={activeRole} />} />
            <Route path="/audit"          element={<AuditPage />} />
            <Route path="/posture"        element={<PosturePage />} />
            <Route path="/mailbox"        element={<MailboxPage />} />
            <Route path="/leakage-check"  element={<LeakageScannerPage />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
