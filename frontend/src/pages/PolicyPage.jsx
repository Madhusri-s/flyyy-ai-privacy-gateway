import React, { useState, useEffect } from "react";
import { Layers, Save, RefreshCw, Lock, Shield, CheckCircle, Play, Sparkles, Terminal } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

const ACTION_OPTIONS = ["FPE", "TOKENIZE", "ENCRYPT", "KEEP", "PSEUDONYMIZE"];
const SENSITIVITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function PolicyPage({ activeRole }) {
  const [policies, setPolicies]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState(null);

  // Live Testing Sandbox state
  const [testValue, setTestValue]   = useState("9876543210");
  const [testField, setTestField]   = useState("phone");
  const [testAction, setTestAction] = useState("FPE");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting]       = useState(false);

  const canEdit = activeRole === "ADMIN";

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const r = await api.getPolicies();
      setPolicies(r.data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPolicies(); }, []);

  const handlePolicyChange = (index, key, val) => {
    const updated = [...policies];
    updated[index] = { ...updated[index], [key]: val };
    setPolicies(updated);
  };

  const handleSavePolicies = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.updatePolicies(policies);
      setSaveMsg({ ok: true, text: "Protection policies updated & synchronized with vault engine." });
    } catch(e) {
      setSaveMsg({ ok: false, text: e.response?.data?.detail || "Failed to update policies." });
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    if (!testValue.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const r = await api.testProtectValue(testValue.trim(), testField, testAction);
      setTestResult(r.data);
    } catch(e) {
      setTestResult({ error: e.response?.data?.detail || e.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageShell
      title="Field Protection Policies"
      subtitle="Declarative field-level cryptographic rules. Governs FF1 length-preserving encryption, HMAC tokenization, and physical vault isolation."
      icon={Layers}
      accentColor="#a855f7"
      actions={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={loadPolicies} className="btn-ghost" disabled={loading} style={{ fontSize: 12 }}>
            <RefreshCw size={12} style={loading ? { animation: "spin-slow 1s linear infinite" } : {}} />
            Reload Rules
          </button>
          {canEdit && (
            <button onClick={handleSavePolicies} className="btn-primary" disabled={saving} style={{ fontSize: 12 }}>
              <Save size={12} />
              {saving ? "Saving..." : "Save Policy Changes"}
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {saveMsg && (
          <div style={{
            padding: "12px 18px",
            borderRadius: 10,
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            background: saveMsg.ok ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
            border: `1px solid ${saveMsg.ok ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"}`,
            color: saveMsg.ok ? "#6ee7b7" : "#fda4af"
          }}>
            {saveMsg.text}
          </div>
        )}

        {/* Live Cryptography Interactive Sandbox */}
        <div className="cyber-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Sparkles size={18} style={{ color: "#06b6d4" }} />
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>
              Interactive Cryptography Laboratory (Live Verification)
            </h3>
            <span className="badge badge-cyan" style={{ marginLeft: "auto" }}>
              REAL BACKEND ENGINE
            </span>
          </div>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 18 }}>
            Type any sample value to watch real-time Format-Preserving Encryption (FF1 via pyffx) or Vault HMAC tokenization execute directly on the backend.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
            alignItems: "flex-end"
          }}>
            <div>
              <label className="nx-label">Sample Input Value</label>
              <input
                className="nx-input"
                value={testValue}
                onChange={e => setTestValue(e.target.value)}
                placeholder="e.g. 9876543210 or user@company.com"
              />
            </div>
            <div>
              <label className="nx-label">Field Type</label>
              <select className="nx-select" value={testField} onChange={e => {
                setTestField(e.target.value);
                if (e.target.value === "phone") { setTestAction("FPE"); setTestValue("9876543210"); }
                else if (e.target.value === "email") { setTestAction("TOKENIZE"); setTestValue("alice@enterprise.com"); }
              }}>
                <option value="phone">Phone / Mobile (Numeric FPE)</option>
                <option value="email">Email Address (Vault Token)</option>
                <option value="national_id">National ID / SSN (Tokenize)</option>
                <option value="name">Full Name (Mask / Keep)</option>
              </select>
            </div>
            <div>
              <label className="nx-label">Target Protection Action</label>
              <select className="nx-select" value={testAction} onChange={e => setTestAction(e.target.value)}>
                <option value="FPE">FPE (Format-Preserving Encryption)</option>
                <option value="TOKENIZE">TOKENIZE (Vault HMAC)</option>
                <option value="KEEP">KEEP (Plaintext Pass-through)</option>
              </select>
            </div>
            <button
              onClick={handleRunTest}
              disabled={testing}
              className="btn-primary"
              style={{ height: 42, justifyContent: "center" }}
            >
              <Play size={13} style={testing ? { animation: "spin-slow 1s linear infinite" } : {}} />
              {testing ? "Simulating..." : "Test Cryptographic Transform"}
            </button>
          </div>

          {testResult && (
            <div style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 12,
              background: "rgba(4, 7, 20, 0.9)",
              border: "1px solid rgba(6, 182, 212, 0.3)"
            }}>
              {testResult.error ? (
                <div style={{ color: "#fda4af", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                  Error: {testResult.error}
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16
                }}>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                      Raw Input (Plaintext)
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#fda4af", marginTop: 4 }}>
                      {testResult.original_value || testValue}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                      Transformed Protected Value
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#6ee7b7", fontWeight: 700, marginTop: 4 }}>
                      {testResult.protected_value || testResult.result}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", textTransform: "uppercase" }}>
                      Method & Integrity Verification
                    </div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#a5b4fc", marginTop: 4 }}>
                      {testResult.method || testAction} • Length: {testResult.length || (testResult.protected_value ? testResult.protected_value.length : "N/A")} chars
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Protection Policies Table */}
        <div className="cyber-card" style={{ overflow: "hidden", width: "100%" }}>
          <div style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgba(99, 102, 241, 0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "#f8fafc" }}>
              Active Field Protection Configuration ({policies.length} rules)
            </span>
            <span className="badge badge-indigo">
              POLICY_DB • VERSION 1.4
            </span>
          </div>

          <div style={{ overflowX: "auto", width: "100%" }}>
            <table className="nx-table">
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Detected Entity</th>
                  <th>Sensitivity</th>
                  <th>Applied Action</th>
                  <th>Format / Algorithm Rule</th>
                  <th>Deterministic</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, idx) => (
                  <tr key={p.field_name || idx}>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#f8fafc" }}>
                        {p.field_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-violet">
                        {p.detected_entity || "TEXT"}
                      </span>
                    </td>
                    <td>
                      {canEdit ? (
                        <select
                          className="nx-select"
                          value={p.sensitivity}
                          onChange={e => handlePolicyChange(idx, "sensitivity", e.target.value)}
                          style={{ fontSize: 11, padding: "4px 8px", width: 110 }}
                        >
                          {SENSITIVITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`badge ${p.sensitivity === "CRITICAL" ? "badge-rose" : "badge-amber"}`}>
                          {p.sensitivity}
                        </span>
                      )}
                    </td>
                    <td>
                      {canEdit ? (
                        <select
                          className="nx-select"
                          value={p.action}
                          onChange={e => handlePolicyChange(idx, "action", e.target.value)}
                          style={{ fontSize: 11, padding: "4px 8px", width: 130 }}
                        >
                          {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      ) : (
                        <span className={`badge ${p.action === "FPE" ? "badge-cyan" : p.action === "TOKENIZE" ? "badge-violet" : "badge-emerald"}`}>
                          {p.action}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94a3b8" }}>
                        {p.format_rule || (p.action === "FPE" ? "FF1 Length-Preserving" : "HMAC-SHA256 Token")}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.is_deterministic ? "badge-emerald" : "badge-amber"}`}>
                        {p.is_deterministic ? "YES" : "NO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
