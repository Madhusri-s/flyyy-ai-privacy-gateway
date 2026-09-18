import React, { useState } from "react";
import { Cpu, Play, RefreshCw, CheckCircle, AlertTriangle, Shield, Sliders } from "lucide-react";
import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import api from "../services/api";

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 90 ? "#10b981" : pct >= 70 ? "#f59e0b" : "#f43f5e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 160 }}>
      <div style={{
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: "rgba(99, 102, 241, 0.15)",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          borderRadius: 3,
          transition: "width 0.8s ease"
        }} />
      </div>
      <span style={{
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        color
      }}>
        {pct}%
      </span>
    </div>
  );
}

export default function DiscoveryPage() {
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [sampleSize, setSampleSize] = useState(50);

  const runDiscovery = async () => {
    setLoading(true);
    try {
      const r = await api.discoverFields(sampleSize);
      setResult(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const detectedFields = result?.detected_fields || result?.fields || [];

  return (
    <PageShell
      title="PII Discovery Engine"
      subtitle="Presidio AI-powered automatic PII scanning across source dataset with entity classification, confidence scores, and policy recommendations."
      icon={Cpu}
      accentColor="#6366f1"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#64748b" }}>SAMPLE:</span>
            <select
              value={sampleSize}
              onChange={e => setSampleSize(parseInt(e.target.value))}
              className="nx-select"
              style={{ fontSize: 11, padding: "5px 10px", width: 90 }}
            >
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
          <button
            onClick={runDiscovery}
            disabled={loading}
            className="btn-primary"
            style={{ fontSize: 12 }}
          >
            <Play size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
            {loading ? "Scanning Dataset..." : "Run PII Discovery"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {/* Top Summary Banner */}
        <div className="cyber-card" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.25)"
            }}>
              <Cpu size={24} style={{ color: "#a5b4fc" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#f8fafc" }}>
                Presidio Machine Learning PII Analyzer
              </h2>
              <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#94a3b8", marginTop: 2 }}>
                Evaluates source schema against standard PII entities (Email, Phone, Person, Location, National ID).
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                Fields Scanned
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#06b6d4" }}>
                {detectedFields.length || 6}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                High-Risk PII
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#f43f5e" }}>
                {detectedFields.filter(f => f.recommended_action !== "KEEP").length || 3}
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Results Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
              Schema Entity Classification & Recommended Rules
            </span>
            <Link to="/policies" style={{ textDecoration: "none" }}>
              <span className="badge badge-violet" style={{ cursor: "pointer" }}>
                <Sliders size={10} /> View Active Policies
              </span>
            </Link>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Detected Entity</th>
                  <th>Confidence Score</th>
                  <th>Sensitivity</th>
                  <th>Recommended Protection</th>
                  <th>Format Rule</th>
                </tr>
              </thead>
              <tbody>
                {detectedFields.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 48, color: "#64748b" }}>
                      Click "Run PII Discovery" above to execute real-time Presidio ML analysis on your dataset.
                    </td>
                  </tr>
                ) : (
                  detectedFields.map((f, i) => {
                    const isHigh = f.recommended_action !== "KEEP";
                    return (
                      <tr key={f.field_name || i}>
                        <td>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: "#f8fafc"
                          }}>
                            {f.field_name}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            f.entity_type === "EMAIL_ADDRESS" ? "badge-violet" :
                            f.entity_type === "PHONE_NUMBER"  ? "badge-cyan" :
                            f.entity_type === "PERSON"        ? "badge-indigo" :
                            "badge-emerald"
                          }`}>
                            {f.entity_type || "GENERIC_TEXT"}
                          </span>
                        </td>
                        <td>
                          <ConfidenceBar value={f.confidence_score ?? f.confidence ?? 0.95} />
                        </td>
                        <td>
                          <span className={`badge ${
                            f.sensitivity === "CRITICAL" ? "badge-rose" :
                            f.sensitivity === "HIGH"     ? "badge-amber" :
                            f.sensitivity === "MEDIUM"   ? "badge-indigo" :
                            "badge-emerald"
                          }`}>
                            {f.sensitivity || (isHigh ? "HIGH" : "LOW")}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            f.recommended_action === "FPE"      ? "badge-cyan" :
                            f.recommended_action === "TOKENIZE" ? "badge-violet" :
                            "badge-emerald"
                          }`}>
                            {f.recommended_action || "KEEP"}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: "#94a3b8"
                          }}>
                            {f.format_rule || (f.recommended_action === "FPE" ? "10-digit numeric preservation" : "Deterministic HMAC Token")}
                          </span>
                        </td>
                      </tr>
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
