import { useState, useRef, useEffect } from "react";

// ── Responsive hook ────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Data ───────────────────────────────────────────────────────
const COMPANIES = [
  { id: 1, name: "Syarikat Maju Sdn Bhd",    short: "SM", color: "#1a6fbd" },
  { id: 2, name: "Perdana Holdings Sdn Bhd", short: "PH", color: "#2e7d32" },
  { id: 3, name: "Riang Ria Enterprise",      short: "RR", color: "#b45309" },
];

const ACCOUNT_CODES = [
  { code: "2100", label: "Accounts payable",      type: "supplier" },
  { code: "2110", label: "Creditor adjustments",  type: "supplier" },
  { code: "5100", label: "Purchases – general",   type: "supplier" },
  { code: "6210", label: "Transport / petrol",    type: "claim"    },
  { code: "6220", label: "Medical expenses",      type: "claim"    },
  { code: "6230", label: "Telephone & utilities", type: "claim"    },
  { code: "6240", label: "Entertainment expenses",type: "claim"    },
];

const INITIAL_DOCS = [
  { id:1,  type:"supplier", subtype:"Invoice",      ref:"INV-2024-0892", party:"Pemasok Berjaya Sdn Bhd",   amount:12500, code:"5100", status:"pending",  date:"2024-10-18", uploader:"Ahmad Razak",  notes:"" },
  { id:2,  type:"claim",    subtype:"Petrol",       ref:"CLM-0041",      party:"Ahmad bin Razak",           amount:320,   code:"6210", status:"approved", date:"2024-10-17", uploader:"Ahmad Razak",  notes:"Penang trip" },
  { id:3,  type:"supplier", subtype:"Credit Note",  ref:"CN-2024-0034",  party:"Teknologi Utama Sdn Bhd",  amount:1800,  code:"2110", status:"review",   date:"2024-10-16", uploader:"Siti Noor",    notes:"" },
  { id:4,  type:"claim",    subtype:"Medical",      ref:"CLM-0040",      party:"Siti Noor bt Azman",       amount:180,   code:"6220", status:"synced",   date:"2024-10-15", uploader:"Siti Noor",    notes:"Panel clinic" },
  { id:5,  type:"supplier", subtype:"Invoice",      ref:"INV-2024-0889", party:"Bekalan Maju Enterprise",  amount:6750,  code:"5100", status:"rejected", date:"2024-10-14", uploader:"Lim Wei",      notes:"Wrong GST" },
  { id:6,  type:"claim",    subtype:"Entertainment",ref:"CLM-0039",      party:"Lim Wei Shen",             amount:850,   code:"6240", status:"pending",  date:"2024-10-13", uploader:"Lim Wei",      notes:"Client dinner" },
  { id:7,  type:"supplier", subtype:"Invoice",      ref:"INV-2024-0901", party:"Global Supply Sdn Bhd",   amount:22000, code:"5100", status:"approved", date:"2024-10-19", uploader:"Ahmad Razak",  notes:"" },
  { id:8,  type:"claim",    subtype:"Telephone",    ref:"CLM-0042",      party:"Nurul Ain bt Hashim",      amount:150,   code:"6230", status:"pending",  date:"2024-10-19", uploader:"Nurul Ain",    notes:"Oct bill" },
  { id:9,  type:"supplier", subtype:"Debit Note",   ref:"DN-2024-0012",  party:"Pemasok Berjaya Sdn Bhd", amount:430,   code:"2110", status:"review",   date:"2024-10-18", uploader:"Lim Wei",      notes:"" },
  { id:10, type:"claim",    subtype:"Medical",      ref:"CLM-0043",      party:"Faizal bin Omar",          amount:240,   code:"6220", status:"approved", date:"2024-10-20", uploader:"Faizal Omar",  notes:"Hospital KL" },
];

const STATUS_META = {
  pending:  { label:"Pending",   bg:"#FEF3C7", color:"#92400E" },
  review:   { label:"In review", bg:"#DBEAFE", color:"#1E40AF" },
  approved: { label:"Approved",  bg:"#D1FAE5", color:"#065F46" },
  rejected: { label:"Rejected",  bg:"#FEE2E2", color:"#991B1B" },
  synced:   { label:"Synced",    bg:"#D1FAE5", color:"#065F46" },
};

const SUBTYPE_ICON = {
  Invoice:"📄", "Credit Note":"📋", "Debit Note":"📑",
  Petrol:"⛽", Medical:"🏥", Telephone:"📱", Entertainment:"🍽️",
};

const NAV_ITEMS = [
  { key:"dashboard",  label:"Dashboard", icon:"📊" },
  { key:"documents",  label:"Documents", icon:"📁" },
  { key:"upload",     label:"Upload",    icon:"⬆️" },
  { key:"approvals",  label:"Approvals", icon:"✅" },
  { key:"finance",    label:"Finance",   icon:"🏦" },
  { key:"accounting", label:"Sync",      icon:"🔄" },
  { key:"pricing",    label:"Pricing",   icon:"💳" },
  { key:"settings",   label:"Settings",  icon:"⚙️" },
];

function fmt(n) { return "RM " + Number(n).toLocaleString("en-MY", { minimumFractionDigits:2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" }); }

// ── Shared components ──────────────────────────────────────────
function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return <span style={{ background:m.bg, color:m.color, fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:20, whiteSpace:"nowrap" }}>{m.label}</span>;
}

function Avatar({ name, color, size=32 }) {
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{ width:size, height:size, borderRadius:"50%", background:color+"22", color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:600, flexShrink:0, border:`1.5px solid ${color}44` }}>{initials}</div>;
}

function Card({ children, style={} }) {
  return <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, overflow:"hidden", ...style }}>{children}</div>;
}

function CardHeader({ title, action, onAction }) {
  return (
    <div style={{ padding:"12px 16px", borderBottom:"1px solid #f0f0f5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontWeight:600, fontSize:14, color:"#111827" }}>{title}</span>
      {action && <span onClick={onAction} style={{ fontSize:12, color:"#185FA5", cursor:"pointer" }}>{action}</span>}
    </div>
  );
}

// ── Top bar (mobile) ───────────────────────────────────────────
function MobileTopBar({ company, companies, onCompanyChange, screen, pendingCount }) {
  const [open, setOpen] = useState(false);
  const title = NAV_ITEMS.find(n => n.key === screen)?.label || "Aprova";

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"#fff", borderBottom:"1px solid #e8eaf0", padding:"0 16px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#111827" }}>A<span style={{ color:"#185FA5" }}>prova</span></div>
        <div style={{ width:1, height:16, background:"#e8eaf0" }} />
        <span style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{title}</span>
      </div>
      <div style={{ position:"relative" }}>
        <div onClick={() => setOpen(!open)} style={{ display:"flex", alignItems:"center", gap:6, background:"#f5f6fa", border:"1px solid #e8eaf0", borderRadius:20, padding:"5px 10px", cursor:"pointer" }}>
          <div style={{ width:18, height:18, borderRadius:"50%", background:company.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff" }}>{company.short}</div>
          <span style={{ fontSize:11, fontWeight:600, color:"#374151", maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company.name.split(" ")[0]}</span>
          <span style={{ fontSize:10, color:"#9ca3af" }}>▾</span>
        </div>
        {open && (
          <div style={{ position:"absolute", right:0, top:"110%", background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", zIndex:200, minWidth:200, overflow:"hidden" }}>
            {companies.map(co => (
              <div key={co.id} onClick={() => { onCompanyChange(co); setOpen(false); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", background: company.id===co.id ? "#eff6ff":"#fff" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:co.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff" }}>{co.short}</div>
                <span style={{ fontSize:13, color:"#111827", fontWeight: company.id===co.id ? 600:400 }}>{co.name}</span>
                {company.id===co.id && <span style={{ marginLeft:"auto", color:"#185FA5", fontSize:12 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bottom nav (mobile) ────────────────────────────────────────
function BottomNav({ screen, setScreen, pendingCount }) {
  const main = NAV_ITEMS.slice(0, 5);
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100, background:"#fff", borderTop:"1px solid #e8eaf0", display:"flex", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {main.map(n => (
        <div key={n.key} onClick={() => setScreen(n.key)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0", cursor:"pointer", position:"relative" }}>
          <div style={{ fontSize:20, lineHeight:1, marginBottom:3 }}>{n.icon}</div>
          <div style={{ fontSize:10, color: screen===n.key ? "#185FA5":"#9ca3af", fontWeight: screen===n.key ? 700:400 }}>{n.label}</div>
          {n.key==="approvals" && pendingCount > 0 && (
            <div style={{ position:"absolute", top:6, right:"50%", marginRight:-18, background:"#ef4444", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:10, minWidth:16, textAlign:"center" }}>{pendingCount}</div>
          )}
          {screen===n.key && <div style={{ position:"absolute", bottom:0, left:"25%", right:"25%", height:2, background:"#185FA5", borderRadius:2 }} />}
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
function Dashboard({ docs, company, isMobile, setScreen }) {
  const pending  = docs.filter(d => d.status==="pending").length;
  const approved = docs.filter(d => d.status==="approved").length;
  const total    = docs.reduce((s,d) => s+d.amount, 0);
  const bankers  = docs.filter(d => d.status==="approved" && d.type==="supplier").length;

  const pipeline = [
    { label:"Uploaded",   count:docs.length,                                              color:"#6366f1" },
    { label:"In review",  count:docs.filter(d=>d.status==="review").length,               color:"#3b82f6" },
    { label:"Approved",   count:approved,                                                  color:"#10b981" },
    { label:"Bank maker", count:bankers,                                                   color:"#f59e0b" },
    { label:"Synced",     count:docs.filter(d=>d.status==="synced").length,               color:"#14b8a6" },
  ];

  const recent = [...docs].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0, isMobile ? 5 : 7);

  return (
    <div style={{ padding: isMobile ? "16px" : "28px 32px", maxWidth:1100 }}>
      {!isMobile && (
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Dashboard</h1>
          <p style={{ fontSize:13, color:"#6b7280", margin:"4px 0 0" }}>{company.name} · October 2024</p>
        </div>
      )}
      {isMobile && (
        <p style={{ fontSize:12, color:"#6b7280", marginBottom:16, marginTop:4 }}>{company.name}</p>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 20 }}>
        {[
          { label:"Pending approval",    value:pending,    sub:"↑ 3 new today",         subColor:"#b45309" },
          { label:"Processed (MTD)",     value:docs.length,sub:"↑ 12% vs last month",   subColor:"#065F46" },
          { label:"Total (MTD)",         value:fmt(total), sub:"Supplier + Claims",      subColor:"#6b7280", small:true },
          { label:"Awaiting payment",    value:bankers,    sub:"Finance action needed",  subColor:"#b45309" },
        ].map(s => (
          <div key={s.label} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, padding: isMobile ? "12px" : "16px 20px" }}>
            <div style={{ fontSize:10, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? (s.small ? 14 : 20) : (s.small ? 17 : 24), fontWeight:700, color:"#111827", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:11, color:s.subColor, marginTop:5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap:14 }}>
        {/* Recent docs */}
        <Card>
          <CardHeader title="Recent documents" action="View all →" onAction={() => setScreen("documents")} />
          {recent.map(doc => (
            <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:10, padding: isMobile ? "10px 14px" : "10px 20px", borderBottom:"1px solid #f9fafb" }}>
              <div style={{ fontSize:20 }}>{SUBTYPE_ICON[doc.subtype] || "📄"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doc.ref}</div>
                <div style={{ fontSize:11, color:"#6b7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doc.party}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#111827" }}>{fmt(doc.amount)}</div>
                <Badge status={doc.status} />
              </div>
            </div>
          ))}
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader title="Approval pipeline" />
          <div style={{ padding:"14px 16px" }}>
            {pipeline.map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:11, color:"#6b7280", width:80, flexShrink:0 }}>{p.label}</span>
                <div style={{ flex:1, height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${Math.round((p.count/docs.length)*100)}%`, height:"100%", background:p.color, borderRadius:3 }} />
                </div>
                <span style={{ fontSize:12, fontWeight:600, color:"#374151", width:20, textAlign:"right" }}>{p.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Documents ──────────────────────────────────────────────────
function Documents({ docs, setDocs, isMobile }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = docs.filter(d => {
    if (filter==="supplier" && d.type!=="supplier") return false;
    if (filter==="claims"   && d.type!=="claim")    return false;
    if (filter==="pending"  && d.status!=="pending") return false;
    if (search && !d.ref.toLowerCase().includes(search.toLowerCase()) && !d.party.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function approve(id) { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"approved"} : d)); setSelected(null); }
  function reject(id)  { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"rejected"} : d)); setSelected(null); }

  const TABS = [{ key:"all",label:"All" },{ key:"supplier",label:"Supplier" },{ key:"claims",label:"Claims" },{ key:"pending",label:"Pending" }];

  // Mobile: card list view
  if (isMobile) return (
    <div style={{ padding:"16px" }}>
      <input placeholder="Search ref or party…" value={search} onChange={e=>setSearch(e.target.value)}
        style={{ width:"100%", padding:"10px 14px", border:"1px solid #e8eaf0", borderRadius:10, fontSize:14, outline:"none", color:"#111827", background:"#fff", boxSizing:"border-box", marginBottom:12 }} />

      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setFilter(t.key)} style={{ padding:"6px 14px", border:"none", borderRadius:20, fontSize:12, fontWeight: filter===t.key ? 700:400, background: filter===t.key ? "#185FA5":"#f3f4f6", color: filter===t.key ? "#fff":"#374151", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{t.label}</button>
        ))}
      </div>

      {filtered.map(doc => (
        <div key={doc.id} onClick={() => setSelected(selected?.id===doc.id ? null : doc)}
          style={{ background:"#fff", border:`1.5px solid ${selected?.id===doc.id ? "#185FA5":"#e8eaf0"}`, borderRadius:12, padding:"14px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>{SUBTYPE_ICON[doc.subtype] || "📄"}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{doc.ref}</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>{doc.subtype}</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{fmt(doc.amount)}</div>
              <Badge status={doc.status} />
            </div>
          </div>
          <div style={{ fontSize:12, color:"#374151", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.party}</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:11, background:"#f3f4f6", padding:"2px 7px", borderRadius:5, color:"#374151" }}>{doc.code}</span>
            <span style={{ fontSize:11, color:"#9ca3af" }}>{fmtDate(doc.date)}</span>
          </div>

          {selected?.id===doc.id && doc.status==="pending" && (
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>approve(doc.id)} style={{ flex:1, padding:"9px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
              <button onClick={()=>reject(doc.id)}  style={{ flex:1, padding:"9px 0", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✗ Reject</button>
            </div>
          )}
        </div>
      ))}
      {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>No documents found</div>}
    </div>
  );

  // Desktop: table view
  return (
    <div style={{ padding:"28px 32px", maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Documents</h1>
        <input placeholder="Search ref or supplier…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ padding:"7px 12px", fontSize:13, border:"1px solid #e8eaf0", borderRadius:8, outline:"none", width:220, color:"#111827" }} />
      </div>
      <div style={{ display:"flex", gap:0, borderBottom:"2px solid #f0f0f5", marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setFilter(t.key)} style={{ padding:"8px 16px", fontSize:13, border:"none", background:"none", cursor:"pointer", fontWeight:filter===t.key?600:400, color:filter===t.key?"#185FA5":"#6b7280", borderBottom:filter===t.key?"2px solid #185FA5":"2px solid transparent", marginBottom:-2 }}>{t.label}</button>
        ))}
      </div>
      <Card>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"#f9fafb" }}>
              {["Type","Reference","Party","Amount","Account","Status","Date"].map(h => (
                <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #e8eaf0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} onClick={()=>setSelected(selected?.id===doc.id?null:doc)}
                style={{ borderBottom:"1px solid #f3f4f6", cursor:"pointer", background:selected?.id===doc.id?"#eff6ff":"transparent" }}>
                <td style={{ padding:"10px 14px" }}><span style={{ fontSize:18 }}>{SUBTYPE_ICON[doc.subtype]}</span></td>
                <td style={{ padding:"10px 14px", fontWeight:600, color:"#111827", fontFamily:"monospace", fontSize:12 }}>{doc.ref}</td>
                <td style={{ padding:"10px 14px", color:"#374151", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.party}</td>
                <td style={{ padding:"10px 14px", fontWeight:600, color:"#111827", whiteSpace:"nowrap" }}>{fmt(doc.amount)}</td>
                <td style={{ padding:"10px 14px" }}><span style={{ fontFamily:"monospace", fontSize:11, background:"#f3f4f6", padding:"2px 7px", borderRadius:5 }}>{doc.code}</span></td>
                <td style={{ padding:"10px 14px" }}><Badge status={doc.status} /></td>
                <td style={{ padding:"10px 14px", color:"#6b7280", whiteSpace:"nowrap" }}>{fmtDate(doc.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>No documents found</div>}
      </Card>
    </div>
  );
}

// ── Upload ─────────────────────────────────────────────────────
function Upload({ docs, setDocs, isMobile }) {
  const [step, setStep]       = useState(1);
  const [docType, setDocType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [party, setParty]     = useState("");
  const [amount, setAmount]   = useState("");
  const [code, setCode]       = useState("");
  const [notes, setNotes]     = useState("");
  const [file, setFile]       = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone]       = useState(false);
  const fileRef = useRef();

  const supplierSubs = ["Invoice","Credit Note","Debit Note"];
  const claimSubs    = ["Petrol","Medical","Telephone","Entertainment"];
  const availSubs    = docType==="supplier" ? supplierSubs : docType==="claim" ? claimSubs : [];
  const filteredCodes= ACCOUNT_CODES.filter(a => !docType || a.type===docType);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setProcessing(true);
    setTimeout(() => { setParty("Pemasok Berjaya Sdn Bhd"); setAmount("1250"); setProcessing(false); setStep(2); }, 1600);
  }

  function submit() {
    const newDoc = { id:docs.length+1, type:docType, subtype, ref:docType==="supplier"?`INV-2024-${900+docs.length}`:`CLM-00${50+docs.length}`, party_name:party, party, amount:parseFloat(amount)||0, code, status:"uploaded", date:new Date().toISOString().slice(0,10), uploader:"Current User", notes };
    setDocs(d => [newDoc, ...d]);
    setDone(true);
  }

  function reset() { setStep(1); setDocType(""); setSubtype(""); setParty(""); setAmount(""); setCode(""); setNotes(""); setFile(null); setDone(false); setProcessing(false); }

  const p = isMobile ? "16px" : "28px 32px";

  if (done) return (
    <div style={{ padding:p, maxWidth:600 }}>
      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding:48, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8 }}>Document submitted!</h2>
        <p style={{ color:"#6b7280", fontSize:14, marginBottom:24 }}>Queued for approval. The approver will be notified.</p>
        <button onClick={reset} style={{ padding:"10px 28px", background:"#185FA5", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>Upload another</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:p, maxWidth:680 }}>
      {!isMobile && <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:20 }}>Upload document</h1>}

      {/* Progress */}
      <div style={{ display:"flex", marginBottom:24 }}>
        {["Select","Details","Review"].map((s,i) => (
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center" }}>
              {i>0 && <div style={{ flex:1, height:2, background:step>i?"#185FA5":"#e8eaf0" }} />}
              <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0, background:step>i+1?"#10b981":step===i+1?"#185FA5":"#e8eaf0", color:step>=i+1?"#fff":"#9ca3af" }}>{step>i+1?"✓":i+1}</div>
              {i<2 && <div style={{ flex:1, height:2, background:step>i+1?"#185FA5":"#e8eaf0" }} />}
            </div>
            <div style={{ fontSize:11, color:step===i+1?"#185FA5":"#9ca3af", marginTop:5, fontWeight:step===i+1?600:400 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding: isMobile ? 16 : 28 }}>
        {step===1 && (
          <>
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Category</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[{k:"supplier",label:"Supplier doc",icon:"🏢",desc:"Invoice, CN, DN"},{k:"claim",label:"Staff claim",icon:"👤",desc:"Petrol, medical…"}].map(opt => (
                  <div key={opt.k} onClick={()=>{setDocType(opt.k);setSubtype("");setCode("");}}
                    style={{ border:`2px solid ${docType===opt.k?"#185FA5":"#e8eaf0"}`, borderRadius:10, padding:12, cursor:"pointer", background:docType===opt.k?"#eff6ff":"#fff" }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{opt.icon}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {docType && (
              <div style={{ marginBottom:18 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Type</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {availSubs.map(s => (
                    <button key={s} onClick={()=>setSubtype(s)} style={{ padding:"7px 14px", border:`1.5px solid ${subtype===s?"#185FA5":"#e8eaf0"}`, borderRadius:20, background:subtype===s?"#eff6ff":"#fff", color:subtype===s?"#185FA5":"#374151", fontSize:13, cursor:"pointer", fontWeight:subtype===s?600:400 }}>{SUBTYPE_ICON[s]} {s}</button>
                  ))}
                </div>
              </div>
            )}
            <div onClick={()=>docType&&subtype&&fileRef.current.click()}
              style={{ border:`2px dashed ${docType&&subtype?"#185FA5":"#e8eaf0"}`, borderRadius:12, padding: isMobile ? 28 : 36, textAlign:"center", background:docType&&subtype?"#f0f7ff":"#f9fafb", cursor:docType&&subtype?"pointer":"not-allowed" }}>
              {processing ? <><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{fontSize:14,color:"#185FA5",fontWeight:600}}>Processing…</div></> :
               file ? <><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{fontSize:13,color:"#065F46",fontWeight:600}}>{file.name}</div></> :
               <><div style={{fontSize:36,marginBottom:8}}>☁️</div><div style={{fontSize:14,fontWeight:600,color:docType&&subtype?"#185FA5":"#9ca3af"}}>{docType&&subtype?"Tap to upload":"Select category first"}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>PDF · JPG · PNG</div></>}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} style={{display:"none"}} />
            </div>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#065F46" }}>✨ Fields auto-extracted. Please verify.</div>
            {[{label:"Supplier / Staff name",val:party,set:setParty,placeholder:"Name"},{label:"Amount (RM)",val:amount,set:setAmount,placeholder:"0.00",type:"number"}].map(f => (
              <div key={f.label} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{f.label}</label>
                <input type={f.type||"text"} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width:"100%", padding:"11px 12px", border:"1px solid #e8eaf0", borderRadius:8, fontSize:14, outline:"none", color:"#111827", boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Account code</label>
              <select value={code} onChange={e=>setCode(e.target.value)} style={{ width:"100%", padding:"11px 12px", border:"1px solid #e8eaf0", borderRadius:8, fontSize:14, outline:"none", color:"#111827", background:"#fff" }}>
                <option value="">Select code…</option>
                {filteredCodes.map(a => <option key={a.code} value={a.code}>{a.code} — {a.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Notes (optional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any remarks…" rows={2}
                style={{ width:"100%", padding:"11px 12px", border:"1px solid #e8eaf0", borderRadius:8, fontSize:14, outline:"none", color:"#111827", boxSizing:"border-box", resize:"vertical" }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, padding:"11px 0", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>← Back</button>
              <button onClick={()=>party&&amount&&code&&setStep(3)} style={{ flex:2, padding:"11px 0", background:"#185FA5", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer", opacity:party&&amount&&code?1:0.5 }}>Continue →</button>
            </div>
          </>
        )}

        {step===3 && (
          <>
            <div style={{ fontWeight:700, fontSize:16, color:"#111827", marginBottom:14 }}>Review & submit</div>
            {[["Type",subtype],["Party",party],["Amount",fmt(parseFloat(amount)||0)],["Code",code+" · "+(ACCOUNT_CODES.find(a=>a.code===code)?.label||"")],["Notes",notes||"—"]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:"1px solid #f3f4f6", fontSize:14 }}>
                <span style={{ color:"#6b7280" }}>{k}</span>
                <span style={{ color:"#111827", fontWeight:500, textAlign:"right", maxWidth:"60%" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={()=>setStep(2)} style={{ flex:1, padding:"12px 0", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>← Back</button>
              <button onClick={submit} style={{ flex:2, padding:"12px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>✓ Submit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Approvals ──────────────────────────────────────────────────
function Approvals({ docs, setDocs, isMobile }) {
  const pending = docs.filter(d => d.status==="pending"||d.status==="review");
  function approve(id) { setDocs(ds => ds.map(d => d.id===id?{...d,status:"approved"}:d)); }
  function reject(id)  { setDocs(ds => ds.map(d => d.id===id?{...d,status:"rejected"}:d)); }
  const p = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:p, maxWidth:900 }}>
      {!isMobile && <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:4 }}>Approval queue</h1>}
      <p style={{ fontSize:13, color:"#6b7280", marginBottom:16, marginTop:isMobile?4:0 }}>{pending.length} document{pending.length!==1?"s":""} awaiting action</p>
      {pending.length===0 ? (
        <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding:60, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#111827" }}>All caught up!</div>
        </div>
      ) : pending.map(doc => (
        <div key={doc.id} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, padding: isMobile ? 14 : 20, marginBottom:12 }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ fontSize:32, flexShrink:0 }}>{SUBTYPE_ICON[doc.subtype]}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{doc.ref}</span>
                <span style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{fmt(doc.amount)}</span>
              </div>
              <div style={{ fontSize:13, color:"#374151", marginBottom:2 }}>{doc.party}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{doc.subtype} · {doc.uploader} · {fmtDate(doc.date)}</div>
              {doc.notes && <div style={{ fontSize:11, color:"#6b7280" }}>Note: {doc.notes}</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>approve(doc.id)} style={{ flex:1, padding:"10px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
            <button onClick={()=>reject(doc.id)}  style={{ flex:1, padding:"10px 0", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✗ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Finance ────────────────────────────────────────────────────
function Finance({ docs, setDocs, isMobile }) {
  const ready = docs.filter(d => d.status==="approved" && d.type==="supplier");
  const [paid, setPaid] = useState([]);
  function markPaid(id) { setPaid(p=>[...p,id]); setDocs(ds=>ds.map(d=>d.id===id?{...d,status:"synced"}:d)); }
  const p = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:p, maxWidth:900 }}>
      {!isMobile && <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:16 }}>Finance / Bank maker</h1>}
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[{label:"Ready for payment",value:ready.length},{label:"Total payable",value:fmt(ready.reduce((s,d)=>s+d.amount,0))},{label:"Processed today",value:paid.length}].map(s => (
          <div key={s.label} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#111827" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader title="Payment queue" />
        {ready.length===0 ? <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>No approved supplier documents pending.</div> :
          ready.map(doc => (
            <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #f9fafb", flexWrap: isMobile?"wrap":"nowrap" }}>
              <div style={{ fontSize:22 }}>{SUBTYPE_ICON[doc.subtype]}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.party}</div>
                <div style={{ fontSize:11, color:"#6b7280" }}>{doc.ref} · {fmtDate(doc.date)}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"#111827", flexShrink:0 }}>{fmt(doc.amount)}</div>
              {paid.includes(doc.id) ?
                <span style={{ background:"#d1fae5", color:"#065F46", fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:8, flexShrink:0 }}>✓ Done</span> :
                <button onClick={()=>markPaid(doc.id)} style={{ padding:"7px 14px", background:"#f0fdf4", color:"#065F46", border:"1.5px solid #bbf7d0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", flexShrink:0 }}>Mark paid</button>
              }
            </div>
          ))
        }
      </Card>
    </div>
  );
}

// ── Accounting sync ────────────────────────────────────────────
function AccountingSync({ docs, isMobile }) {
  const [software, setSoftware] = useState("autocount");
  const [exported, setExported] = useState(false);
  const syncable = docs.filter(d => d.status==="approved"||d.status==="synced");
  const p = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:p, maxWidth:900 }}>
      {!isMobile && <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:16 }}>Accounting sync</h1>}
      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, padding: isMobile?14:24, marginBottom:14 }}>
        <div style={{ fontWeight:600, fontSize:14, color:"#111827", marginBottom:12 }}>Select software</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {[{k:"autocount",label:"AutoCount",icon:"🔵"},{k:"sql",label:"SQL Account",icon:"🟠"}].map(opt => (
            <div key={opt.k} onClick={()=>{setSoftware(opt.k);setExported(false);}}
              style={{ border:`2px solid ${software===opt.k?"#185FA5":"#e8eaf0"}`, borderRadius:10, padding:12, cursor:"pointer", background:software===opt.k?"#eff6ff":"#fff" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{opt.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{opt.label}</div>
            </div>
          ))}
        </div>
        {exported ?
          <div style={{ background:"#d1fae5", border:"1px solid #bbf7d0", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#065F46", fontWeight:600 }}>✅ Export file generated — {syncable.length} documents · share with accounts team.</div> :
          <button onClick={()=>setExported(true)} style={{ width:"100%", padding:"12px 0", background:"#185FA5", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>Generate {software==="autocount"?"XML":"CSV"} export</button>
        }
      </div>
    </div>
  );
}

// ── Pricing ────────────────────────────────────────────────────
function Pricing({ isMobile }) {
  const plans = [
    { name:"Starter", price:"RM 99", desc:"Small businesses, 1 entity", highlight:false, features:["1 company","10 users","100 docs/month","2-step approval","Email notifications","CSV export"] },
    { name:"Growth",  price:"RM 249",desc:"Growing SMEs, multi-entity", highlight:true,  features:["5 companies","30 users","500 docs/month","Multi-level approval","WhatsApp + Email","AutoCount & SQL templates","Finance module","2-year archive"] },
    { name:"Enterprise",price:"RM 599",desc:"Groups & larger businesses",highlight:false, features:["Unlimited companies","Unlimited users","Unlimited docs","Custom approval chains","API access","Dedicated support","White-label option"] },
  ];
  const p = isMobile ? "16px" : "28px 32px";

  return (
    <div style={{ padding:p, maxWidth:980 }}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <h1 style={{ fontSize: isMobile?20:26, fontWeight:800, color:"#111827", margin:0 }}>Simple pricing</h1>
        <p style={{ fontSize:13, color:"#6b7280", margin:"8px 0 0" }}>14-day free trial · No credit card required</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"repeat(3,1fr)", gap:14 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{ background:"#fff", border:plan.highlight?"2px solid #185FA5":"1px solid #e8eaf0", borderRadius:16, padding:20, position:"relative", boxShadow:plan.highlight?"0 4px 24px #1a6fbd18":"none" }}>
            {plan.highlight && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#185FA5", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 14px", borderRadius:20, whiteSpace:"nowrap" }}>Most popular</div>}
            <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:2 }}>{plan.name}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:12 }}>{plan.desc}</div>
            <div style={{ fontSize:26, fontWeight:800, color:"#111827", marginBottom:16 }}>{plan.price}<span style={{ fontSize:12, fontWeight:400, color:"#6b7280" }}>/month</span></div>
            <button style={{ width:"100%", padding:"10px 0", background:plan.highlight?"#185FA5":"#f3f4f6", color:plan.highlight?"#fff":"#374151", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:16 }}>Get started</button>
            {plan.features.map(f => <div key={f} style={{ display:"flex", gap:8, marginBottom:7, fontSize:13, color:"#374151" }}><span style={{ color:"#10b981" }}>✓</span>{f}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings ───────────────────────────────────────────────────
function Settings({ companies, company, setCompany, isMobile }) {
  const p = isMobile ? "16px" : "28px 32px";
  return (
    <div style={{ padding:p, maxWidth:680 }}>
      {!isMobile && <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:20 }}>Settings</h1>}
      <Card style={{ marginBottom:14 }}>
        <CardHeader title="Company entities" />
        {companies.map(co => (
          <div key={co.id} onClick={()=>setCompany(co)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #f9fafb", cursor:"pointer", background:company.id===co.id?"#eff6ff":"transparent" }}>
            <Avatar name={co.short} color={co.color} size={36} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{co.name}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>Growth plan · Active</div>
            </div>
            {company.id===co.id && <span style={{ fontSize:12, color:"#185FA5", fontWeight:600 }}>Active ✓</span>}
          </div>
        ))}
      </Card>
      <Card>
        <CardHeader title="Account code mapping" />
        {ACCOUNT_CODES.map(ac => (
          <div key={ac.code} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid #f9fafb" }}>
            <span style={{ fontFamily:"monospace", fontSize:12, background:"#f3f4f6", padding:"2px 8px", borderRadius:5, color:"#374151", flexShrink:0 }}>{ac.code}</span>
            <span style={{ flex:1, fontSize:13, color:"#374151" }}>{ac.label}</span>
            <span style={{ fontSize:11, background:ac.type==="supplier"?"#dbeafe":"#d1fae5", color:ac.type==="supplier"?"#1e40af":"#065F46", padding:"2px 8px", borderRadius:10, fontWeight:600 }}>{ac.type}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── APP SHELL ──────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [screen, setScreen]   = useState("dashboard");
  const [company, setCompany] = useState(COMPANIES[0]);
  const [docs, setDocs]       = useState(INITIAL_DOCS);
  const [coOpen, setCoOpen]   = useState(false);

  const pendingCount = docs.filter(d => d.status==="pending").length;

  const screenProps = { docs, setDocs, isMobile, company, setScreen };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', system-ui, sans-serif", background:"#f5f6fa" }}>

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile && (
        <div style={{ width:220, background:"#fff", borderRight:"1px solid #e8eaf0", display:"flex", flexDirection:"column", flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
          <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #f0f0f5" }}>
            <div style={{ fontSize:17, fontWeight:800, color:"#111827" }}>A<span style={{ color:"#185FA5" }}>prova</span></div>
            <div style={{ fontSize:10, color:"#9ca3af", marginTop:1, letterSpacing:"0.05em" }}>DOCUMENT APPROVALS</div>
          </div>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #f0f0f5", position:"relative" }}>
            <div onClick={()=>setCoOpen(!coOpen)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#f5f6fa", borderRadius:10, cursor:"pointer", border:"1px solid #e8eaf0" }}>
              <Avatar name={company.short} color={company.color} size={26} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{company.name}</div>
                <div style={{ fontSize:10, color:"#6b7280" }}>Switch company ▾</div>
              </div>
            </div>
            {coOpen && (
              <div style={{ position:"absolute", top:"100%", left:14, right:14, background:"#fff", border:"1px solid #e8eaf0", borderRadius:10, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", zIndex:50, overflow:"hidden" }}>
                {COMPANIES.map(co => (
                  <div key={co.id} onClick={()=>{setCompany(co);setCoOpen(false);}} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", cursor:"pointer", background:company.id===co.id?"#eff6ff":"#fff" }}>
                    <Avatar name={co.short} color={co.color} size={22} />
                    <span style={{ fontSize:12, color:"#111827", fontWeight:company.id===co.id?600:400 }}>{co.name}</span>
                    {company.id===co.id && <span style={{ marginLeft:"auto", fontSize:12, color:"#185FA5" }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <nav style={{ flex:1, padding:"10px", overflowY:"auto" }}>
            {NAV_ITEMS.map(n => (
              <div key={n.key} onClick={()=>setScreen(n.key)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9, cursor:"pointer", marginBottom:2, background:screen===n.key?"#eff6ff":"transparent", color:screen===n.key?"#185FA5":"#374151", fontWeight:screen===n.key?600:400, fontSize:13, position:"relative" }}>
                <span style={{ fontSize:15 }}>{n.icon}</span>{n.label}
                {n.key==="approvals" && pendingCount>0 && <span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10 }}>{pendingCount}</span>}
              </div>
            ))}
          </nav>
          <div style={{ padding:"12px 14px", borderTop:"1px solid #f0f0f5", display:"flex", alignItems:"center", gap:10 }}>
            <Avatar name="LW" color="#185FA5" size={30} />
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#111827" }}>Lim Wei Shen</div>
              <div style={{ fontSize:10, color:"#6b7280" }}>Admin · Growth plan</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", paddingTop:isMobile?56:0, paddingBottom:isMobile?70:0 }} onClick={()=>coOpen&&setCoOpen(false)}>
        {isMobile && <MobileTopBar company={company} companies={COMPANIES} onCompanyChange={setCompany} screen={screen} pendingCount={pendingCount} />}

        {screen==="dashboard"  && <Dashboard  {...screenProps} />}
        {screen==="documents"  && <Documents  {...screenProps} />}
        {screen==="upload"     && <Upload     {...screenProps} />}
        {screen==="approvals"  && <Approvals  {...screenProps} />}
        {screen==="finance"    && <Finance    {...screenProps} />}
        {screen==="accounting" && <AccountingSync {...screenProps} />}
        {screen==="pricing"    && <Pricing    isMobile={isMobile} />}
        {screen==="settings"   && <Settings   companies={COMPANIES} company={company} setCompany={setCompany} isMobile={isMobile} />}

        {isMobile && <BottomNav screen={screen} setScreen={setScreen} pendingCount={pendingCount} />}
      </div>
    </div>
  );
}
