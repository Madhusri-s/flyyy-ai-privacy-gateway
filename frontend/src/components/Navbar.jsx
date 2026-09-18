import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Shield,
  Layers,
  Database,
  Send,
  Lock,
  FileText,
  Activity,
  UserCheck,
  Mail,
  AlertTriangle,
  Terminal,
  Cpu
} from "lucide-react";

export default function Navbar({ activeRole, setActiveRole }) {
  const location = useLocation();

  const roles = [
    { id: "ADMIN", label: "Admin / Security Lead", desc: "Full permissions: Batches, Policies, Discovery" },
    { id: "CUSTOMER_SUPPORT", label: "Customer Support Rep", desc: "Permitted for authorized reveals with ticket ref" },
    { id: "MARKETING", label: "Marketing Operator", desc: "Uses protected tokens only; reveal access blocked" },
    { id: "AUDITOR", label: "Compliance Auditor", desc: "Read-only access to audit logs and security posture" },
  ];

  const navGroups = [
    {
      title: "CONTROL PLANE",
      items: [
        { path: "/", label: "Topology Overview", icon: Activity },
        { path: "/source-batches", label: "Source & Ingestion", icon: Database },
        { path: "/discovery", label: "PII Discovery", icon: Cpu },
        { path: "/policies", label: "Protection Policies", icon: Layers },
      ],
    },
    {
      title: "DATA PLANE",
      items: [
        { path: "/customers", label: "Protected Customers", icon: Shield },
        { path: "/leakage-check", label: "Leakage Scanner", icon: AlertTriangle },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        { path: "/batch-monitor", label: "Batch Monitor", icon: Terminal },
        { path: "/marketing", label: "Marketing Gateway", icon: Send },
        { path: "/bounces", label: "Bounce Webhook", icon: Mail },
        { path: "/mailbox", label: "Local Mailbox", icon: Mail },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        { path: "/reveal", label: "Controlled Reveal", icon: Lock },
        { path: "/audit", label: "Audit Investigation", icon: FileText },
        { path: "/posture", label: "Security Posture", icon: UserCheck },
      ],
    },
  ];

  return (
    <header className="border-b border-control-border bg-control-surface sticky top-0 z-50 shadow-control">
      {/* Top Banner: Core Product Principle */}
      <div className="bg-gradient-to-r from-control-surface via-control-surfaceHover to-control-surface px-4 py-1 border-b border-control-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyber-emerald animate-pulse"></span>
          <span className="text-control-textDim uppercase tracking-wider font-mono text-[11px]">System Status:</span>
          <span className="text-cyber-cyan font-mono font-medium">PRIVACY GATEWAY ACTIVE</span>
        </div>
        <div className="font-mono text-control-textMuted tracking-wider font-medium text-[11px] flex items-center gap-2">
          <span className="text-cyber-emerald font-semibold">PROTECTED BY DEFAULT.</span>
          <span className="text-control-textDim">REVEAL OR USE PLAINTEXT ONLY BY EXCEPTION.</span>
        </div>
        <div className="text-control-textDim text-[11px] font-mono">
          FLYYY.AI ENCLAVE v1.0
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand & Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan group-hover:border-cyber-cyan group-hover:shadow-cyan-glow transition-all">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base text-control-textMain font-mono">FLYYY.AI</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[10px] text-control-textDim font-mono">Privacy-Preserving Customer Data Platform</p>
          </div>
        </Link>

        {/* Global Role Switcher */}
        <div className="flex items-center gap-3 bg-control-bg px-3 py-1.5 rounded-lg border border-control-border">
          <div className="flex items-center gap-2 text-xs">
            <UserCheck className="w-4 h-4 text-cyber-cyan" />
            <span className="text-control-textDim font-mono text-[11px] uppercase">Active Role:</span>
          </div>
          <div className="relative">
            <select
              id="global-role-select"
              value={activeRole}
              onChange={(e) => {
                setActiveRole(e.target.value);
                localStorage.setItem("flyyy_active_role", e.target.value);
              }}
              className="bg-control-surface border border-control-borderBright text-xs font-mono text-control-textMain rounded px-2.5 py-1 focus:outline-none focus:border-cyber-cyan cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} ({r.label})
                </option>
              ))}
            </select>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
              activeRole === "ADMIN"
                ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                : activeRole === "CUSTOMER_SUPPORT"
                ? "bg-blue-950/80 text-blue-300 border border-blue-800/60"
                : activeRole === "MARKETING"
                ? "bg-amber-950/80 text-amber-300 border border-amber-800/60"
                : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
            }`}
          >
            {activeRole}
          </span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-control-bg/60 border-t border-control-border/40 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto py-1 text-xs scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.title} className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-control-textDim uppercase tracking-wider pr-1">
                {group.title}:
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isActive
                        ? "bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 shadow-cyan-glow"
                        : "text-control-textMuted hover:text-control-textMain hover:bg-control-surfaceHover"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <span className="text-control-borderBright px-1">|</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
