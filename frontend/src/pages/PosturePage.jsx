import React, { useState, useEffect } from "react";
import { ShieldCheck, RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

function CheckRow({ check, index }) {
  const ok = check.status === "PASS";
  const name = check.check_name || check.name || check.title || `Check ${index+1}`;
  const detail = check.detail || check.description || check.message || "";
  return (
    <div className="anim-fade-up" style={{
      display:"flex", alignItems:"flex-start", gap:16, padding:18,
      borderRadius:14, marginBottom:10,
      background: ok ? "rgba(16,185,129,0.06)" : "rgba(244,63,94,0.06)",
      border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`,
      animationDelay:`${index * 80}ms`
    }}>
      <div style={{
        width:36, height:36, borderRadius:"50%", flexShrink:0,
        background: ok ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: ok ? "0 0 16px rgba(16,185,129,0.25)" : "0 0 16px rgba(244,63,94,0.25)"
      }}>
        {ok
          ? <CheckCircle size={16} style={{ color:"#10b981" }} />
          : <XCircle size={16} style={{ color:"#f43f5e" }} />
        }
      </div>
      <div style={{ flex:1 }}>
        <div style={{
          fontFamily:"'Space Grotesk', sans-serif", fontWeight:600, fontSize:14,
          color: ok ? "#6ee7b7" : "#fda4af", marginBottom:4
        }}>{name}</div>
        <div style={{ fontSize:12, fontFamily:"'JetBrains Mono', monospace", color:"#6b7280", lineHeight:1.6 }}>
          {detail}
        </div>
        {check.metric !== undefined && (
          <div style={{ marginTop:6, fontSize:11, fontFamily:"'JetBrains Mono', monospace", color:"#374151" }}>
            Metric: <span style={{ color:"#94a3b8" }}>{JSON.stringify(check.metric)}</span>
          </div>
        )}
      </div>
      <span className="badge" style={ok
        ? { background:"rgba(16,185,129,0.15)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.3)" }
        : { background:"rgba(244,63,94,0.15)",  color:"#fda4af", border:"1px solid rgba(244,63,94,0.3)" }
      }>{check.status}</span>
    </div>
  );
}

export default function PosturePage() {
  const [posture, setPosture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [raw, setRaw]         = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.getSecurityPosture();
      setPosture(r.data);
      setRaw(r.data);
      console.log("Posture data:", JSON.stringify(r.data, null, 2));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const isSecure = posture?.overall_status === "SECURE";
  const score = posture ? Math.round((posture.passed_count / posture.total_checks) * 100) : 0;
  const checks = posture?.checks || posture?.results || posture?.security_checks || [];

  return (
    <PageShell
      title="Security Posture"
      subtitle="Real-time automated verification of all privacy controls. Scans actual database state — not simulated."
      icon={ShieldCheck}
      accentColor="#10b981"
      actions={
        <button onClick={load} className="btn-ghost" disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
          <RefreshCw size={12} style={loading ? { animation:"spin-slow 1s linear infinite" } : {}} />
          Re-evaluate
        </button>
      }
    >
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:320, gap:20 }}>
          <div style={{ position:"relative", width:64, height:64 }}>
            <div className="anim-spin-slow" style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(16,185,129,0.2)" }} />
            <div className="anim-spin-rev" style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px dashed rgba(124,58,237,0.3)" }} />
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ShieldCheck size={22} style={{ color:"#10b981" }} className="anim-pulse" />
            </div>
          </div>
          <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13, color:"#4b5563" }}
            className="anim-blink">Evaluating security posture</div>
        </div>
      ) : posture && (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          {/* Overall card */}
          <div className="nx-glass" style={{
            padding:32, display:"flex", alignItems:"center", gap:40, flexWrap:"wrap",
            borderColor: isSecure ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"
          }}>
            {/* SVG score ring */}
            <div style={{ position:"relative", width:130, height:130, flexShrink:0 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform:"rotate(-90deg)" }}>
                <circle cx="65" cy="65" r="56" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="9" />
                <circle cx="65" cy="65" r="56" fill="none"
                  stroke={isSecure ? "#10b981" : "#f43f5e"}
                  strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(score/100)*351.9} 351.9`}
                  style={{ filter:`drop-shadow(0 0 8px ${isSecure ? "#10b981" : "#f43f5e"})`, transition:"stroke-dasharray 1s ease" }}
                />
              </svg>
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                <span style={{
                  fontSize:28, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700,
                  color: isSecure ? "#10b981" : "#f43f5e",
                  textShadow:`0 0 20px ${isSecure ? "rgba(16,185,129,0.6)" : "rgba(244,63,94,0.6)"}`
                }}>{score}%</span>
                <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#374151" }}>score</span>
              </div>
            </div>

            <div style={{ flex:1, minWidth:220 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                {isSecure ? <CheckCircle size={22} style={{ color:"#10b981" }} /> : <AlertTriangle size={22} style={{ color:"#f43f5e" }} />}
                <span style={{
                  fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:28,
                  color: isSecure ? "#10b981" : "#f43f5e",
                  textShadow:`0 0 30px ${isSecure ? "rgba(16,185,129,0.5)" : "rgba(244,63,94,0.5)"}`
                }}>{posture.overall_status}</span>
                <span className="badge" style={isSecure
                  ? { background:"rgba(16,185,129,0.15)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.3)" }
                  : { background:"rgba(244,63,94,0.15)",  color:"#fda4af", border:"1px solid rgba(244,63,94,0.3)" }
                }>{posture.passed_count}/{posture.total_checks} checks passed</span>
              </div>
              <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.7, maxWidth:480 }}>
                {isSecure
                  ? "All privacy controls verified. Zero plaintext leakage detected. FPE integrity confirmed. Vault isolation active."
                  : "One or more security controls have failed. Review individual checks below and remediate immediately."
                }
              </p>

              {/* Metrics */}
              {posture.metrics && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:20, marginTop:16 }}>
                  {Object.entries(posture.metrics).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:"#374151", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>
                        {k.replace(/_/g," ")}
                      </div>
                      <div style={{
                        fontSize:18, fontFamily:"'Space Grotesk', sans-serif", fontWeight:700,
                        color: (k.includes("leak") && v > 0) ? "#f43f5e" : k.includes("leak") ? "#10b981" : "#f1f5f9"
                      }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Individual checks */}
          <div>
            <div style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:"#374151", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:16 }}>
              Security Control Checks ({checks.length})
            </div>
            {checks.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"#374151", fontFamily:"'JetBrains Mono', monospace", fontSize:12 }}>
                No checks data available. Raw: {JSON.stringify(Object.keys(posture))}
              </div>
            ) : (
              checks.map((c, i) => <CheckRow key={i} check={c} index={i} />)
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
