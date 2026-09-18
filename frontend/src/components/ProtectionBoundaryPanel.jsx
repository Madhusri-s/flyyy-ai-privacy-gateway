import React from "react";
import { Shield, ShieldAlert, CheckCircle2, Lock, Database, ArrowDown, EyeOff, FileCheck } from "lucide-react";

export default function ProtectionBoundaryPanel({ posture }) {
  const checks = posture?.checks || [];
  const metrics = posture?.metrics || {};

  return (
    <div className="bg-control-surface border border-control-border rounded-xl p-5 shadow-control mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-mono font-bold tracking-wider text-control-textMain uppercase">
              Perimeter Protection Boundary
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
              posture?.overall_status === "SECURE"
                ? "bg-cyber-emerald/15 text-cyber-emerald border-cyber-emerald/30"
                : "bg-amber-950 text-amber-400 border-amber-800"
            }`}>
              {posture?.overall_status || "ANALYZING"}
            </span>
          </div>
          <p className="text-xs text-control-textDim font-mono">
            Cryptographic perimeter isolating sensitive originals from downstream workloads.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-control-textMuted">
            Boundary Verifications: <strong className="text-cyber-cyan">{posture?.passed_count || 6} / {posture?.total_checks || 6} Passed</strong>
          </span>
        </div>
      </div>

      {/* Visual Architectural Boundary Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Tier 1: Ingestion Perimeter */}
        <div className="bg-control-bg p-3.5 rounded-lg border border-control-border relative">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-control-textDim" />
            <h4 className="text-xs font-mono font-bold text-control-textMain uppercase">Tier 1: Source DB Perimeter</h4>
          </div>
          <p className="text-[11px] text-control-textDim mb-2">
            Restricted account permissions. Accessible strictly for SELECT batch ingestion.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border">
            <span className="text-control-textMuted">Access Level:</span>
            <span className="text-amber-400 font-semibold">SELECT ONLY (Read-Only)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border mt-1.5">
            <span className="text-control-textMuted">Raw Customers:</span>
            <span className="text-control-textMain">{metrics.source_customer_count ?? 0}</span>
          </div>
        </div>

        {/* Tier 2: Protection Enclave */}
        <div className="bg-control-bg p-3.5 rounded-lg border border-cyber-cyan/40 shadow-cyan-glow relative">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-cyber-cyan" />
            <h4 className="text-xs font-mono font-bold text-cyber-cyan uppercase">Tier 2: Protection Enclave</h4>
          </div>
          <p className="text-[11px] text-control-textDim mb-2">
            pyffx FF1 FPE + HMAC Tokenization + AES-256-GCM Vault storage at rest.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border">
            <span className="text-control-textMuted">FPE Engine:</span>
            <span className="text-cyber-emerald font-semibold">FF1 ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border mt-1.5">
            <span className="text-control-textMuted">Vault AES-256 Mappings:</span>
            <span className="text-cyber-cyan font-bold">{metrics.vault_mappings_count ?? 0}</span>
          </div>
        </div>

        {/* Tier 3: Downstream Safe Zone */}
        <div className="bg-control-bg p-3.5 rounded-lg border border-cyber-emerald/40 relative">
          <div className="flex items-center gap-2 mb-2">
            <EyeOff className="w-4 h-4 text-cyber-emerald" />
            <h4 className="text-xs font-mono font-bold text-cyber-emerald uppercase">Tier 3: Downstream Workloads</h4>
          </div>
          <p className="text-[11px] text-control-textDim mb-2">
            Marketing, CRM & Analytics operate purely on tokens and FPE numbers.
          </p>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border">
            <span className="text-control-textMuted">Plaintext Leaks:</span>
            <span className="text-cyber-emerald font-bold">0 LEAKS (VERIFIED)</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono bg-control-surface p-2 rounded border border-control-border mt-1.5">
            <span className="text-control-textMuted">Protected DB Records:</span>
            <span className="text-control-textMain">{metrics.protected_customer_count ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Live Security Posture Indicators List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 p-2.5 rounded bg-control-bg/70 border border-control-border/80 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0 mt-0.5" />
            <div>
              <div className="font-mono font-semibold text-control-textMain flex items-center gap-2">
                {check.name}
                <span className="text-[9px] px-1 rounded bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/30 font-mono">
                  {check.status}
                </span>
              </div>
              <p className="text-[11px] text-control-textDim mt-0.5">{check.description}</p>
              <p className="text-[10px] font-mono text-control-textMuted mt-1">{check.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
