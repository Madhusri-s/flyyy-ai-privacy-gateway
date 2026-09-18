import React, { useState, useEffect } from "react";
import { Users, Search, Download, RefreshCw, Shield, Eye } from "lucide-react";
import PageShell from "../components/PageShell";
import api from "../services/api";

export default function ProtectedCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [reveal, setReveal]       = useState({});
  const searchTimer = React.useRef();

  const load = async (q = "") => {
    setLoading(true);
    try { const r = await api.listCustomers(100, 0, q); setCustomers(r.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    const q = e.target.value; setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(q), 400);
  };

  const toggleMask = (id) => setReveal(p => ({ ...p, [id]: !p[id] }));

  const segColor = (s) => ({
    Premium:"#7c3aed", Enterprise:"#06b6d4", Growth:"#10b981", Standard:"#6366f1"
  })[s] || "#6366f1";

  return (
    <PageShell title="Protected Customers" subtitle="Downstream view — zero plaintext PII. All identifiers are FPE-encrypted or tokenized." icon={Shield} accentColor="#06b6d4"
      actions={
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ position:"relative" }}>
            <Search size={12} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#4b5563" }} />
            <input className="nx-input" placeholder="Search…" value={search} onChange={handleSearch}
              style={{ paddingLeft:32, width:200, fontSize:12, padding:"8px 12px 8px 32px" }} />
          </div>
          <a href={api.exportProtectedCsvUrl()} download className="btn-ghost" style={{ textDecoration:"none", fontSize:12, padding:"8px 14px" }}>
            <Download size={12} /> Export CSV
          </a>
          <button onClick={() => load(search)} className="btn-ghost" style={{ padding:"8px 12px", fontSize:12 }} disabled={loading}>
            <RefreshCw size={12} style={loading ? { animation:"spin-slow 1s linear infinite" } : {}} />
          </button>
        </div>
      }
    >
      {/* Zero-plaintext banner */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
        borderRadius:12, background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)",
        marginBottom:20
      }}>
        <Shield size={14} style={{ color:"#10b981", flexShrink:0 }} />
        <span style={{ fontSize:11, fontFamily:"'JetBrains Mono', monospace", color:"#6b7280", flex:1 }}>
          <span style={{ color:"#10b981", fontWeight:600 }}>ZERO PLAINTEXT GUARANTEE: </span>
          This database contains only FPE-encrypted mobile numbers and opaque EMAIL_ tokens. No raw PII is stored.
        </span>
        <span className="badge" style={{ background:"rgba(16,185,129,0.15)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.3)" }}>
          {customers.length} records
        </span>
      </div>

      <div className="nx-glass" style={{ overflow:"hidden" }}>
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:64, gap:12, color:"#4b5563" }}>
            <RefreshCw size={14} style={{ animation:"spin-slow 1s linear infinite" }} />
            <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:13 }}>Loading protected records…</span>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table className="nx-table">
              <thead>
                <tr>{["Customer ID","Name Token","Email Token","Mobile FPE","City","Segment","Status","View"].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.customer_id}>
                    <td><span className="badge badge-indigo" style={{ fontFamily:"monospace" }}>{c.customer_id}</span></td>
                    <td style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:11, color:"#94a3b8" }}>
                      {reveal[c.customer_id] ? c.name_token : c.masked_name}
                    </td>
                    <td>
                      <span className="badge badge-violet" style={{ fontFamily:"monospace", fontSize:10 }}>
                        {reveal[c.customer_id] ? c.email_token : c.masked_email}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-cyan" style={{ fontFamily:"monospace" }}>
                        {reveal[c.customer_id] ? c.mobile_fpe : c.masked_mobile}
                      </span>
                    </td>
                    <td style={{ color:"#6b7280" }}>{c.city || "—"}</td>
                    <td>
                      <span className="badge" style={{ background:`${segColor(c.segment)}20`, color:segColor(c.segment), border:`1px solid ${segColor(c.segment)}35` }}>
                        {c.segment}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={c.protection_status==="PROTECTED"
                        ? { background:"rgba(16,185,129,0.12)", color:"#6ee7b7", border:"1px solid rgba(16,185,129,0.25)" }
                        : { background:"rgba(245,158,11,0.12)", color:"#fcd34d", border:"1px solid rgba(245,158,11,0.25)" }
                      }>{c.protection_status}</span>
                    </td>
                    <td>
                      <button onClick={() => toggleMask(c.customer_id)} className="btn-ghost"
                        style={{ fontSize:10, padding:"4px 10px", display:"flex", alignItems:"center", gap:4 }}>
                        <Eye size={10} />{reveal[c.customer_id] ? "Mask" : "Token"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
