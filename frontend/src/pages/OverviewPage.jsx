import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Database, Lock, Send, Eye, AlertOctagon,
  RefreshCw, ArrowRight, Terminal, ShieldCheck,
  FileText, Activity, Layers, Users
} from "lucide-react";
import api from "../services/api";
import PrivacyTopology from "../components/PrivacyTopology";

/* ── Animated counter ──────────────────────── */
function Counter({ value, suffix = "" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    let start = 0; const dur = 1000; const step = value / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= value) { setN(value); clearInterval(t); }
      else setN(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{n.toLocaleString()}{suffix}</>;
}

/* ── Shield orbit animation ────────────────── */
function ShieldOrbit() {
  return (
    <div style={{ position:"relative", width:180, height:180, flexShrink:0 }}>
      {/* Outer ripple */}
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        border:"1px solid rgba(124,58,237,0.15)",
        animation:"ripple-out 2.5s ease-out infinite"
      }} />
      <div style={{
        position:"absolute", inset:10, borderRadius:"50%",
        border:"1px solid rgba(6,182,212,0.1)",
        animation:"ripple-out 2.5s ease-out 0.8s infinite"
      }} />

      {/* Ring 1 */}
      <div className="anim-spin-slow" style={{
        position:"absolute", inset:10, borderRadius:"50%",
        border:"1px solid rgba(124,58,237,0.25)"
      }}>
        <div className="anim-orbit1" style={{
          position:"absolute", top:"50%", left:"50%",
          width:8, height:8, borderRadius:"50%",
          background:"#a78bfa", boxShadow:"0 0 12px #7c3aed",
          transform:"translate(-50%,-50%)"
        }} />
      </div>

      {/* Ring 2 — dashed reverse */}
      <div className="anim-spin-rev" style={{
        position:"absolute", inset:25, borderRadius:"50%",
        border:"1px dashed rgba(6,182,212,0.2)"
      }}>
        <div className="anim-orbit2" style={{
          position:"absolute", top:"50%", left:"50%",
          width:6, height:6, borderRadius:"50%",
          background:"#67e8f9", boxShadow:"0 0 10px #06b6d4",
          transform:"translate(-50%,-50%)"
        }} />
      </div>

      {/* Ring 3 */}
      <div style={{
        position:"absolute", inset:42, borderRadius:"50%",
        border:"1px solid rgba(124,58,237,0.35)"
      }} />

      {/* Core */}
      <div style={{
        position:"absolute", inset:0,
        display:"flex", alignItems:"center", justifyContent:"center"
      }}>
        <div className="anim-float" style={{
          width:72, height:72, borderRadius:18,
          background:"linear-gradient(135deg, rgba(124,58,237,0.25), rgba(6,182,212,0.1))",
          border:"1px solid rgba(124,58,237,0.4)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 0 30px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.07)"
        }}>
          <Shield size={32} style={{
            filter:"drop-shadow(0 0 8px rgba(124,58,237,0.8))"
          }} color="#a78bfa" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

/* ── Metric card ───────────────────────────── */
function Metric({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="metric-tile anim-fade-up" style={{ textAlign:"left" }}>
      <div style={{
        position:"absolute", top:0, left:"20%", right:"20%", height:1,
        background:`linear-gradient(90deg, transparent, ${color}, transparent)`
      }} />
      <div style={{
        width:36, height:36, borderRadius:10, marginBottom:12,
        background:`${color}18`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center"
      }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div style={{
        fontSize:28, fontFamily:"'Space Grotesk', sans-serif",
        fontWeight:700, color, lineHeight:1, marginBottom:4,
        textShadow:`0 0 20px ${color}60`
      }}>
        {value !== undefined ? <Counter value={value} /> : "—"}
      </div>
      <div style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#4b5563", textTransform:"uppercase", letterSpacing:"0.08em" }}>
        {label}
      </div>
      {sub && <div style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#374151", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

const QUICK_ACTIONS = [
  { to:"/marketing",    title:"Marketing Gateway",  desc:"Dispatch via EMAIL_ tokens. Zero plaintext.",   icon:Send,        color:"#06b6d4", tag:"OPERATIONAL" },
  { to:"/reveal",       title:"Controlled Reveal",  desc:"RBAC-gated with mandatory audit trail.",         icon:Eye,         color:"#f59e0b", tag:"RESTRICTED" },
  { to:"/leakage-check",title:"Leakage Scanner",    desc:"Verify 0% plaintext in downstream DB.",          icon:AlertOctagon,color:"#f43f5e", tag:"LIVE SCAN" },
  { to:"/audit",        title:"Audit Log",          desc:"Immutable event trail. Every access logged.",    icon:FileText,    color:"#6366f1", tag:"IMMUTABLE" },
];

export default function OverviewPage({ activeRole }) {
  const [stats, setStats]       = useState(null);
  const [posture, setPosture]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [s, p] = await Promise.all([api.getOverviewStats(), api.getSecurityPosture()]);
      setStats(s.data); setPosture(p.data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch(e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const metrics = [
    { label:"Source Records",    value:stats?.source_records,            icon:Database,    color:"#7c3aed" },
    { label:"Protected Records", value:stats?.protected_records,         icon:ShieldCheck, color:"#10b981", sub:"Zero plaintext" },
    { label:"Vault Mappings",    value:stats?.vault_mappings,            icon:Lock,        color:"#06b6d4", sub:"AES-256-GCM" },
    { label:"Active Policies",   value:stats?.active_policies,           icon:Layers,      color:"#6366f1" },
    { label:"Audit Events",      value:stats?.audit_events,              icon:FileText,    color:"#f59e0b" },
    { label:"Batch Runs",        value:stats?.batch_runs,                icon:Terminal,    color:"#f43f5e", sub:"Idempotent" },
  ];

  return (
    <div style={{ minHeight:"100vh" }}>
      {/* Page body */}
      <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:24 }}>

        {/* ── Hero card ──────────────────────── */}
        <div className="nx-glow-card">
          <div className="nx-glow-card-inner" style={{ padding:32 }}>
            {/* HUD corners */}
            {[
              { top:0,left:0,borderTop:"2px solid rgba(124,58,237,0.6)",borderLeft:"2px solid rgba(124,58,237,0.6)",borderRadius:"18px 0 0 0" },
              { top:0,right:0,borderTop:"2px solid rgba(6,182,212,0.5)",borderRight:"2px solid rgba(6,182,212,0.5)",borderRadius:"0 18px 0 0" },
              { bottom:0,left:0,borderBottom:"2px solid rgba(124,58,237,0.3)",borderLeft:"2px solid rgba(124,58,237,0.3)",borderRadius:"0 0 0 18px" },
              { bottom:0,right:0,borderBottom:"2px solid rgba(6,182,212,0.2)",borderRight:"2px solid rgba(6,182,212,0.2)",borderRadius:"0 0 18px 0" },
            ].map((s,i)=>(
              <div key={i} style={{ position:"absolute", width:20, height:20, ...s, pointerEvents:"none" }} />
            ))}

            <div style={{ display:"flex", alignItems:"center", gap:40, flexWrap:"wrap" }}>
              <ShieldOrbit />

              <div style={{ flex:1, minWidth:260 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 10px #10b981", display:"inline-block" }} className="anim-pulse" />
                  <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#10b981", textTransform:"uppercase", letterSpacing:"0.1em" }}>
                    Privacy Gateway • Operational
                  </span>
                </div>
                <h1 style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:700, fontSize:34, lineHeight:1.15, marginBottom:10 }}>
                  Privacy{" "}
                  <span className="gradient-text">Operations</span>{" "}
                  Nexus
                </h1>
                <p style={{ fontSize:13, color:"#6b7280", lineHeight:1.7, maxWidth:520, marginBottom:20 }}>
                  End-to-end privacy-preserving customer data platform. Format-preserving
                  encryption, tokenization, RBAC-gated reveal, and immutable audit — all live, all real.
                </p>

                {/* Principle banner */}
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:10,
                  padding:"10px 16px", borderRadius:10,
                  background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.25)",
                  marginBottom:20
                }}>
                  <Shield size={13} style={{ color:"#a78bfa", flexShrink:0 }} />
                  <span style={{ fontSize:11, fontFamily:"'JetBrains Mono', monospace" }}>
                    <span style={{ color:"#a78bfa", fontWeight:600 }}>PROTECTED BY DEFAULT.</span>
                    <span style={{ color:"#4b5563", marginLeft:6 }}>Reveal or use plaintext only by exception.</span>
                  </span>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <Link to="/source-batches" className="btn-primary" style={{ textDecoration:"none" }}>
                    <Terminal size={13} />
                    Run Ingestion Batch
                  </Link>
                  <button onClick={fetchData} disabled={refreshing} className="btn-ghost">
                    <RefreshCw size={13} style={refreshing ? { animation:"spin-slow 1s linear infinite" } : {}} />
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </button>
                  {lastRefresh && (
                    <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#374151" }}>
                      {lastRefresh}
                    </span>
                  )}
                </div>
              </div>

              {/* Posture badge */}
              {posture && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{
                    width:72, height:72, borderRadius:18,
                    background: posture.overall_status==="SECURE" ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)",
                    border:`2px solid ${posture.overall_status==="SECURE" ? "#10b98180" : "#f43f5e80"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow: posture.overall_status==="SECURE" ? "0 0 30px rgba(16,185,129,0.35)" : "0 0 30px rgba(244,63,94,0.35)"
                  }}>
                    <ShieldCheck size={30} style={{ color: posture.overall_status==="SECURE" ? "#10b981" : "#f43f5e" }} strokeWidth={1.5} />
                  </div>
                  <span className="badge" style={posture.overall_status==="SECURE"
                    ? { background:"rgba(16,185,129,0.15)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.3)" }
                    : { background:"rgba(244,63,94,0.15)",  color:"#fda4af", border:"1px solid rgba(244,63,94,0.3)" }
                  }>{posture.overall_status}</span>
                  <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#4b5563" }}>
                    {posture.passed_count}/{posture.total_checks} checks
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Metric grid ──────────────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:14 }} className="stagger">
          {metrics.map(m => <Metric key={m.label} {...m} />)}
        </div>

        {/* ── Interactive 7-Stage Privacy Topology ─────────── */}
        <PrivacyTopology stats={stats} />

        {/* ── Quick actions ────────────────────── */}
        <div>
          <div style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:"#374151", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:14 }}>
            Quick Operations
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {QUICK_ACTIONS.map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.to} to={a.to} style={{ textDecoration:"none" }}>
                  <div className="nx-glass" style={{
                    padding:20, cursor:"pointer", transition:"all 0.2s",
                    borderColor:`${a.color}25`
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${a.color}50`;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 40px rgba(0,0,0,0.5),0 0 20px ${a.color}20`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=`${a.color}25`;e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";}}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div style={{
                        width:34, height:34, borderRadius:9,
                        background:`${a.color}18`, border:`1px solid ${a.color}35`,
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>
                        <Icon size={14} style={{ color:a.color }} />
                      </div>
                      <span className="badge" style={{
                        background:`${a.color}15`, color:a.color, border:`1px solid ${a.color}30`, fontSize:9
                      }}>{a.tag}</span>
                    </div>
                    <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:600, fontSize:13, color:"#f1f5f9", marginBottom:6 }}>
                      {a.title}
                    </div>
                    <p style={{ fontSize:11, color:"#4b5563", lineHeight:1.6, marginBottom:12 }}>{a.desc}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontFamily:"'JetBrains Mono', monospace", color:a.color }}>
                      Open <ArrowRight size={11} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Role context bar ─────────────────── */}
        <div className="nx-glass" style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#a78bfa", boxShadow:"0 0 8px #7c3aed", display:"inline-block" }} />
            <span style={{ fontSize:11, fontFamily:"'JetBrains Mono', monospace", color:"#6b7280" }}>
              Viewing as: <span style={{ color:"#a78bfa", fontWeight:600 }}>{activeRole}</span>
            </span>
          </div>
          <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:"#374151" }}>
            FLYYY.AI Student Engineering Challenge • Privacy-Preserving Customer Data Platform
          </span>
        </div>
      </div>
    </div>
  );
}
