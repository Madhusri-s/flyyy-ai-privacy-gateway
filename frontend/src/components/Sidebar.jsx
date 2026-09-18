import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield, Database, Cpu, Layers, Users, Activity,
  Send, Webhook, Lock, FileText, ShieldCheck, Mail,
  AlertOctagon, Terminal, ChevronLeft, ChevronRight,
  Eye, Zap
} from "lucide-react";

const NAV = [
  {
    group: "CONTROL",
    items: [
      { path: "/",               label: "Nexus Overview",      short: "Overview",   icon: Activity,    color: "violet" },
      { path: "/source-batches", label: "Source & Ingestion",  short: "Ingestion",  icon: Database,    color: "cyan" },
      { path: "/discovery",      label: "PII Discovery",       short: "Discovery",  icon: Cpu,         color: "indigo" },
      { path: "/policies",       label: "Protection Policies", short: "Policies",   icon: Layers,      color: "violet" },
    ]
  },
  {
    group: "DATA",
    items: [
      { path: "/customers",      label: "Protected Customers", short: "Customers",  icon: Users,       color: "cyan" },
      { path: "/leakage-check",  label: "Leakage Scanner",     short: "Leakage",    icon: AlertOctagon,color: "rose" },
    ]
  },
  {
    group: "OPS",
    items: [
      { path: "/batch-monitor",  label: "Batch Monitor",       short: "Batches",    icon: Terminal,    color: "emerald" },
      { path: "/marketing",      label: "Marketing Gateway",   short: "Marketing",  icon: Send,        color: "cyan" },
      { path: "/bounces",        label: "Bounce Webhook",      short: "Bounces",    icon: Zap,         color: "amber" },
      { path: "/mailbox",        label: "Local Mailbox",       short: "Mailbox",    icon: Mail,        color: "violet" },
    ]
  },
  {
    group: "GOV",
    items: [
      { path: "/reveal",         label: "Controlled Reveal",   short: "Reveal",     icon: Eye,         color: "amber" },
      { path: "/audit",          label: "Audit Investigation", short: "Audit",      icon: FileText,    color: "indigo" },
      { path: "/posture",        label: "Security Posture",    short: "Posture",    icon: ShieldCheck, color: "emerald" },
    ]
  },
];

const COLOR_MAP = {
  violet:  { icon: "text-nx-violetLt", bg: "bg-nx-violet/10",  border: "border-nx-violet/25",  glow: "shadow-violet" },
  cyan:    { icon: "text-nx-cyanLt",   bg: "bg-nx-cyan/10",    border: "border-nx-cyan/25",    glow: "shadow-cyan" },
  indigo:  { icon: "text-indigo-400",  bg: "bg-indigo-500/10", border: "border-indigo-500/25", glow: "" },
  emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/25",glow: "shadow-emerald" },
  amber:   { icon: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/25",  glow: "" },
  rose:    { icon: "text-rose-400",    bg: "bg-rose-500/10",   border: "border-rose-500/25",   glow: "shadow-rose" },
};

export default function Sidebar({ activeRole, setActiveRole }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const roles = [
    { id: "ADMIN",            label: "Admin / Security Lead",  color: "violet" },
    { id: "CUSTOMER_SUPPORT", label: "Customer Support",       color: "cyan" },
    { id: "MARKETING",        label: "Marketing Operator",     color: "amber" },
    { id: "AUDITOR",          label: "Compliance Auditor",     color: "emerald" },
  ];

  const roleColors = {
    ADMIN:            { dot: "bg-nx-violetLt",  tag: "nx-tag-violet" },
    CUSTOMER_SUPPORT: { dot: "bg-nx-cyanLt",    tag: "nx-tag-cyan" },
    MARKETING:        { dot: "bg-amber-400",     tag: "nx-tag-amber" },
    AUDITOR:          { dot: "bg-emerald-400",   tag: "nx-tag-emerald" },
  };

  const rc = roleColors[activeRole] || roleColors.ADMIN;

  return (
    <aside
      className={`
        relative flex flex-col shrink-0 transition-all duration-300 ease-in-out
        border-r border-nx-border bg-nx-bgDeep
        ${collapsed ? "w-[64px]" : "w-[220px]"}
      `}
      style={{ minHeight: "100vh" }}
    >
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-nx-violet/60 via-nx-cyan/30 to-transparent pointer-events-none z-10" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-nx-border">
        <div className="relative w-9 h-9 shrink-0">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-nx-violet to-nx-cyan opacity-20 animate-pulse-slow" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nx-violet/30 to-nx-cyan/20 border border-nx-violet/40 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-nx-violetLt" size={18} />
          </div>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-bold text-sm tracking-tight text-nx-text leading-none">FLYYY.AI</div>
            <div className="text-[9px] font-mono text-nx-dim tracking-widest mt-0.5 uppercase">Privacy Nexus</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`
            ml-auto w-6 h-6 rounded-lg flex items-center justify-center
            text-nx-dim hover:text-nx-violetLt hover:bg-nx-violet/10
            border border-transparent hover:border-nx-violet/20
            transition-all duration-200 shrink-0
            ${collapsed ? "mx-auto" : ""}
          `}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft size={13} />
          }
        </button>
      </div>

      {/* Role Badge */}
      <div className={`px-3 py-3 border-b border-nx-border ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <div className={`w-2 h-2 rounded-full ${rc.dot} animate-pulse-slow`} />
        ) : (
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-nx-dim uppercase tracking-widest">Active Role</div>
            <select
              id="global-role-select"
              value={activeRole}
              onChange={e => {
                setActiveRole(e.target.value);
                localStorage.setItem("flyyy_active_role", e.target.value);
              }}
              className="nx-select text-[11px] py-1.5"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <div className={`nx-badge ${rc.tag} w-fit`}>
              <span className={`nx-dot ${rc.dot} animate-pulse-slow`} />
              {activeRole}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3">
        {NAV.map(group => (
          <div key={group.group} className="mb-1">
            {!collapsed && (
              <div className="px-4 pt-3 pb-1 text-[9px] font-mono font-semibold text-nx-dim tracking-[0.2em] uppercase">
                {group.group}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const c = COLOR_MAP[item.color];
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`
                    relative flex items-center gap-3 mx-2 my-0.5 px-2.5 py-2 rounded-xl
                    transition-all duration-200 group
                    ${isActive
                      ? `${c.bg} ${c.border} border`
                      : "border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
                    }
                  `}
                >
                  {isActive && <span className="sidebar-active-indicator" />}
                  <div className={`
                    w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                    transition-all duration-200
                    ${isActive ? `${c.bg} ${c.border} border ${c.icon}` : `text-nx-dim group-hover:${c.icon}`}
                  `}>
                    <Icon size={14} />
                  </div>
                  {!collapsed && (
                    <span className={`
                      text-[11.5px] font-medium leading-none truncate
                      ${isActive ? "text-nx-text" : "text-nx-muted group-hover:text-nx-text"}
                    `}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-nx-border px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-wider">Gateway Active</span>
          </div>
          <div className="text-[9px] font-mono text-nx-dim">
            Protected by default.<br />
            <span className="text-nx-violet/70">Reveal only by exception.</span>
          </div>
        </div>
      )}
    </aside>
  );
}
