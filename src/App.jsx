import { useState, useRef, useEffect } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────────
const COMPANIES = [
  { id: 1, name: "Syarikat Maju Sdn Bhd",     short: "SM", color: "#1a6fbd" },
  { id: 2, name: "Perdana Holdings Sdn Bhd",  short: "PH", color: "#2e7d32" },
  { id: 3, name: "Riang Ria Enterprise",       short: "RR", color: "#b45309" },
];

const ACCOUNT_CODES = [
  // Creditor codes (400-XXX) - Supplier accounts
  { code: "400-M001", label: "Meta Solutions Sdn Bhd", type: "supplier", category: "creditor" },
  { code: "400-P001", label: "Pemasok Berjaya Sdn Bhd", type: "supplier", category: "creditor" },
  { code: "400-T001", label: "Teknologi Utama Sdn Bhd", type: "supplier", category: "creditor" },
  { code: "400-B001", label: "Bekalan Maju Enterprise", type: "supplier", category: "creditor" },
  { code: "400-G001", label: "Global Supply Sdn Bhd", type: "supplier", category: "creditor" },
  // Expense codes (900-XXX) - Claim accounts
  { code: "900-A001", label: "Audit Fee", type: "claim", category: "expense" },
  { code: "900-M001", label: "Medical Fee", type: "claim", category: "expense" },
  { code: "900-P001", label: "Petrol & Transport", type: "claim", category: "expense" },
  { code: "900-T001", label: "Telephone & Utilities", type: "claim", category: "expense" },
  { code: "900-E001", label: "Entertainment", type: "claim", category: "expense" },
  { code: "900-R001", label: "Rental", type: "claim", category: "expense" },
];

const INITIAL_DOCS = [
  { id:1,  type:"supplier", subtype:"Invoice",     ref:"INV-2024-0892", party:"Pemasok Berjaya Sdn Bhd",    amount:12500, code:"400-P001", status:"pending",  date:"2024-10-18", uploader:"Ahmad Razak",   notes:"" },
  { id:2,  type:"claim",    subtype:"Petrol",      ref:"CLM-0041",      party:"Ahmad bin Razak",            amount:320,   code:"900-P001", status:"approved",  date:"2024-10-17", uploader:"Ahmad Razak",   notes:"Penang trip" },
  { id:3,  type:"supplier", subtype:"Credit Note", ref:"CN-2024-0034",  party:"Teknologi Utama Sdn Bhd",   amount:1800,  code:"400-T001", status:"review",    date:"2024-10-16", uploader:"Siti Noor",     notes:"" },
  { id:4,  type:"claim",    subtype:"Medical",     ref:"CLM-0040",      party:"Siti Noor bt Azman",        amount:180,   code:"900-M001", status:"synced",    date:"2024-10-15", uploader:"Siti Noor",     notes:"Panel clinic" },
  { id:5,  type:"supplier", subtype:"Invoice",     ref:"INV-2024-0889", party:"Bekalan Maju Enterprise",   amount:6750,  code:"400-B001", status:"rejected",  date:"2024-10-14", uploader:"Lim Wei",       notes:"Wrong GST" },
  { id:6,  type:"claim",    subtype:"Entertainment",ref:"CLM-0039",     party:"Lim Wei Shen",              amount:850,   code:"900-E001", status:"pending",   date:"2024-10-13", uploader:"Lim Wei",       notes:"Client dinner" },
  { id:7,  type:"supplier", subtype:"Invoice",     ref:"INV-2024-0901", party:"Global Supply Sdn Bhd",    amount:22000, code:"400-G001", status:"approved",  date:"2024-10-19", uploader:"Ahmad Razak",   notes:"" },
  { id:8,  type:"claim",    subtype:"Telephone",   ref:"CLM-0042",      party:"Nurul Ain bt Hashim",       amount:150,   code:"900-T001", status:"pending",   date:"2024-10-19", uploader:"Nurul Ain",     notes:"Oct bill" },
  { id:9,  type:"supplier", subtype:"Debit Note",  ref:"DN-2024-0012",  party:"Pemasok Berjaya Sdn Bhd",  amount:430,   code:"400-P001", status:"review",    date:"2024-10-18", uploader:"Lim Wei",       notes:"" },
  { id:10, type:"claim",    subtype:"Medical",     ref:"CLM-0043",      party:"Faizal bin Omar",           amount:240,   code:"900-M001", status:"approved",  date:"2024-10-20", uploader:"Faizal Omar",   notes:"Hospital KL" },
];

const STATUS_META = {
  pending:  { label:"Pending",    bg:"#FEF3C7", color:"#92400E" },
  review:   { label:"In review",  bg:"#DBEAFE", color:"#1E40AF" },
  approved: { label:"Approved",   bg:"#D1FAE5", color:"#065F46" },
  rejected: { label:"Rejected",   bg:"#FEE2E2", color:"#991B1B" },
  synced:   { label:"Synced",     bg:"#D1FAE5", color:"#065F46" },
};

const SUBTYPE_ICON = {
  Invoice:      "📄", "Credit Note":"📋", "Debit Note":"📑",
  Petrol:       "⛽", Medical:"🏥", Telephone:"📱", Entertainment:"🍽️",
};

function fmt(n) { return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits:2 }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-MY", { day:"2-digit", month:"short", year:"numeric" }); }

const USER_PERMISSIONS = [
  { key: "upload_supplier", label: "Upload supplier" },
  { key: "upload_claims", label: "Upload claims" },
  { key: "view_all", label: "View all documents" },
  { key: "approve", label: "Approve documents" },
  { key: "payment", label: "Process payments" },
  { key: "sync", label: "Accounting sync" },
  { key: "manage_users", label: "Manage users" },
  { key: "reports", label: "Reports access" },
];

const NOTIFICATION_CHANNELS = [
  { key: "email", label: "Email" },
  { key: "telegram", label: "Telegram" },
  { key: "whatsapp", label: "WhatsApp" },
];

const ROLE_DEFAULTS = {
  Admin:    { upload_supplier:true, upload_claims:true, view_all:true, approve:true, payment:true, sync:true, manage_users:true, reports:true },
  Manager:  { upload_supplier:true, upload_claims:true, view_all:true, approve:true, payment:false, sync:false, manage_users:false, reports:true },
  Finance:  { upload_supplier:false, upload_claims:true, view_all:true, approve:false, payment:true, sync:false, manage_users:false, reports:true },
  Accounts: { upload_supplier:false, upload_claims:true, view_all:true, approve:false, payment:false, sync:true, manage_users:false, reports:true },
  Staff:    { upload_supplier:false, upload_claims:true, view_all:false, approve:false, payment:false, sync:false, manage_users:false, reports:false },
};

const ROLE_DESCRIPTIONS = {
  Admin: "Full access to all permissions and user management.",
  Manager: "Approval and workflow access with reporting.",
  Finance: "Payment handling and approvals for claims.",
  Accounts: "Sync access for accounting and reporting.",
  Staff: "Claim upload access only.",
};

const INITIAL_MEMBERS = [
  { id: 1, name: "Siti Noor", email: "siti.noor@aprova.com", role: "Admin", permissions: { ...ROLE_DEFAULTS.Admin }, notifications: { email:true, telegram:true, whatsapp:true } },
  { id: 2, name: "Ahmad Razak", email: "ahmad.razak@aprova.com", role: "Manager", permissions: { ...ROLE_DEFAULTS.Manager }, notifications: { email:true, telegram:false, whatsapp:false } },
  { id: 3, name: "Nurul Ain", email: "nurul.ain@aprova.com", role: "Finance", permissions: { ...ROLE_DEFAULTS.Finance }, notifications: { email:true, telegram:false, whatsapp:true } },
  { id: 4, name: "Lim Wei", email: "lim.wei@aprova.com", role: "Staff", permissions: { ...ROLE_DEFAULTS.Staff }, notifications: { email:false, telegram:false, whatsapp:true } },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, whiteSpace: "nowrap",
    }}>{m.label}</span>
  );
}

function Avatar({ name, color, size = 32 }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color || "#1a6fbd22", color: color || "#1a6fbd",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
      border: "1.5px solid " + (color || "#1a6fbd") + "44",
    }}>{initials}</div>
  );
}

function StatCard({ label, value, sub, subColor, isMobile }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaf0",
      borderRadius: isMobile ? 8 : 12, padding: isMobile ? "12px 10px" : "18px 20px", flex: 1,
    }}>
      <div style={{ fontSize: isMobile ? 9 : 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: isMobile ? 6 : 8 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: isMobile ? 10 : 12, color: subColor || "#6b7280", marginTop: isMobile ? 4 : 6, wordWrap: "break-word" }}>{sub}</div>}
    </div>
  );
}

// ── DOCUMENT VIEWER ────────────────────────────────────────────────────────────
function DocumentViewer({ docs, viewingDoc, setViewingDoc, setDocs, company, isMobile }) {
  if (!viewingDoc) return null;
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [mobileTab, setMobileTab] = useState("preview");

  const handleApprove = () => {
    setDocs(current => current.map(d => d.id === viewingDoc.id ? { ...d, status: "approved" } : d));
    setViewingDoc({ ...viewingDoc, status: "approved" });
  };

  const handleReject = () => {
    setDocs(current => current.map(d => d.id === viewingDoc.id ? { ...d, status: "rejected" } : d));
    setViewingDoc({ ...viewingDoc, status: "rejected" });
  };

  const handleSelectDoc = (id) => {
    const doc = docs.find(d => d.id === id);
    if (doc) setViewingDoc(doc);
  };

  // Helper: Detect if URL points to an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  };

  // Helper: Determine if file_url exists and is accessible
  const hasFileUrl = viewingDoc.file_url && viewingDoc.file_url.trim() !== '';

  const lifecycleSteps = ["Uploaded", "OCR", "Mapped", "Approval", "Finance", "Acct sync", "Done"];
  const stages = { pending: 3, review: 3, approved: 4, rejected: 3, synced: 6 };
  const progress = stages[viewingDoc.status] || 0;

  // ── MOBILE VIEW ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#fff", display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => setViewingDoc(null)} style={{ background: "none", border: "none", fontSize: 24, padding: "8px", cursor: "pointer", color: "#6b7280", minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{viewingDoc.ref}</div>
            <div style={{ marginTop: 2 }}><Badge status={viewingDoc.status} /></div>
          </div>
          <button onClick={() => setViewingDoc(null)} style={{ background: "none", border: "none", fontSize: 24, padding: "8px", cursor: "pointer", color: "#6b7280", minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Mobile tab strip (horizontal scroll) */}
        <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #f0f0f5", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
          {["preview", "details", "lifecycle"].map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)} style={{
              padding: "12px 16px", fontSize: 13, border: "none", background: "none",
              cursor: "pointer", fontWeight: mobileTab === tab ? 600 : 400,
              color: mobileTab === tab ? "#1a6fbd" : "#6b7280",
              borderBottom: mobileTab === tab ? "3px solid #1a6fbd" : "3px solid transparent",
              marginBottom: -2, whiteSpace: "nowrap", flexShrink: 0, minHeight: 44
            }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content - scrollable middle area */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "16px", paddingBottom: isMobile && (viewingDoc.status === "pending" || viewingDoc.status === "review") ? 100 : 16 }}>
          {mobileTab === "preview" && (
            <div style={{ background: "#f9fafb", borderRadius: 12, display: "flex", flexDirection: "column", minHeight: "100%", overflow: "hidden" }}>
              {/* Toolbar (simplified for mobile) */}
              {hasFileUrl && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom out" style={{
                      background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                      fontSize: 12, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s", minHeight: 44, minWidth: 44
                    }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>−</button>
                    <span style={{ fontSize: 11, color: "#6b7280", minWidth: 35, textAlign: "center", fontWeight: 500 }}>{zoom}%</span>
                    <button onClick={() => setZoom(Math.min(200, zoom + 10))} title="Zoom in" style={{
                      background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                      fontSize: 12, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s", minHeight: 44, minWidth: 44
                    }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>+</button>
                    <button onClick={() => setRotation((rotation + 90) % 360)} title="Rotate" style={{
                      background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                      fontSize: 12, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s", minHeight: 44, minWidth: 44
                    }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>↻</button>
                  </div>
                  <button
                    onClick={() => window.open(viewingDoc.file_url, '_blank')}
                    title="Download file"
                    style={{
                      background: "#1a6fbd", border: "1px solid #1a6fbd", borderRadius: 6, padding: "6px 10px",
                      fontSize: 12, cursor: "pointer", color: "#fff", fontWeight: 600, transition: "all 0.15s", minHeight: 44, minWidth: 44
                    }}
                    onMouseEnter={e => { e.target.style.background = "#1560a0"; }}
                    onMouseLeave={e => { e.target.style.background = "#1a6fbd"; }}
                  >
                    ⬇
                  </button>
                </div>
              )}

              {/* Preview content */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", overflow: "auto" }}>
                {hasFileUrl ? (
                  isImageUrl(viewingDoc.file_url) ? (
                    <img
                      src={viewingDoc.file_url}
                      alt={viewingDoc.ref}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        borderRadius: 8,
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                        transition: "transform 0.2s ease-out"
                      }}
                    />
                  ) : (
                    <iframe
                      src={viewingDoc.file_url}
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: 8,
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 0.2s ease-out"
                      }}
                    />
                  )
                ) : (
                  <div style={{ textAlign: "center", width: "100%", padding: "12px" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{SUBTYPE_ICON[viewingDoc.subtype] || "📄"}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#9ca3af", marginBottom: 16 }}>No file attached</div>
                    <button
                      onClick={() => document.getElementById('upload-file-input-mobile')?.click()}
                      style={{
                        background: "#1a6fbd",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "12px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        marginBottom: 24,
                        minHeight: 44,
                        transition: "all 0.15s"
                      }}
                      onMouseEnter={e => { e.target.style.background = "#1560a0"; }}
                      onMouseLeave={e => { e.target.style.background = "#1a6fbd"; }}
                    >
                      📤 Upload file
                    </button>
                    <input type="file" id="upload-file-input-mobile" style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.gif" />

                    <div style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "16px",
                      textAlign: "left"
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Summary</div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Reference</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{viewingDoc.ref}</div>
                        </div>
                        <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Date</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{fmtDate(viewingDoc.date)}</div>
                        </div>
                      </div>

                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Party</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{viewingDoc.party}</div>
                      </div>

                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Amount</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fmt(viewingDoc.amount)}</div>
                      </div>

                      {viewingDoc.notes && (
                        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 10, borderLeft: "3px solid #10b981" }}>
                          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>Notes</div>
                          <div style={{ fontSize: 12, color: "#111827" }}>{viewingDoc.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileTab === "details" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px" }}>
              {[
                ["Type", viewingDoc.subtype],
                ["Party / Staff", viewingDoc.party],
                ["Amount", fmt(viewingDoc.amount)],
                ["Account code", viewingDoc.code + " · " + (ACCOUNT_CODES.find(a => a.code === viewingDoc.code)?.label || "")],
                ["Uploaded by", viewingDoc.uploader],
                ["Date", fmtDate(viewingDoc.date)],
                ["Notes", viewingDoc.notes || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                  <span style={{ color: "#6b7280", fontWeight: 500 }}>{k}</span>
                  <span style={{ color: "#111827", fontWeight: 600, textAlign: "right", maxWidth: 160, wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {mobileTab === "lifecycle" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Steps</div>
              {lifecycleSteps.map((step, i) => {
                const done = i < progress;
                const active = i === progress;
                return (
                  <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0, fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "#10b981" : active ? "#3b82f6" : "#f3f4f6",
                      color: done || active ? "#fff" : "#9ca3af",
                    }}>{done ? "✓" : i + 1}</div>
                    <div style={{ paddingTop: "4px" }}>
                      <div style={{ fontSize: 13, color: done ? "#065F46" : active ? "#1e40af" : "#9ca3af", fontWeight: active ? 600 : 500 }}>{step}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile fixed bottom action bar */}
        {viewingDoc.status === "pending" || viewingDoc.status === "review" ? (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101, padding: "12px 16px", borderTop: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: 8 }}>
            <button
              onClick={handleApprove}
              style={{
                flex: 1, padding: "14px 0", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 44, transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.target.style.background = "#059669"; }}
              onMouseLeave={e => { e.target.style.background = "#10b981"; }}
            >
              ✓ Approve
            </button>
            <button
              onClick={handleReject}
              style={{
                flex: 1, padding: "14px 0", background: "#fff", color: "#991b1b", border: "2px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", minHeight: 44, transition: "all 0.15s"
              }}
              onMouseEnter={e => { e.target.style.background = "#fef2f2"; }}
              onMouseLeave={e => { e.target.style.background = "#fff"; }}
            >
              ✗ Reject
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  // ── DESKTOP VIEW ────────────────────────────────────────────────────────────────

  // ── DESKTOP VIEW ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,23,42,0.4)", display: "flex" }} onClick={e => e.target === e.currentTarget && setViewingDoc(null)}>
      <div style={{ width: "calc(100% - 320px)", height: "100%", background: "#fff", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eaf0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <div style={{ fontSize: 28 }}>{SUBTYPE_ICON[viewingDoc.subtype] || "📄"}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{viewingDoc.ref}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Uploaded by {viewingDoc.uploader} · {fmtDate(viewingDoc.date)}</div>
            </div>
            <Badge status={viewingDoc.status} />
          </div>
          <button onClick={() => setViewingDoc(null)} style={{ background: "none", border: "none", fontSize: 24, color: "#6b7280", cursor: "pointer" }}>×</button>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Preview with toolbar */}
          <div style={{ background: "#f9fafb", borderRadius: 12, marginBottom: 20, display: "flex", flexDirection: "column", minHeight: 240 }}>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
              {hasFileUrl && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => setZoom(Math.max(50, zoom - 10))} title="Zoom out" style={{
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                    fontSize: 14, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s"
                  }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>−</button>
                  <span style={{ fontSize: 12, color: "#6b7280", minWidth: 40, textAlign: "center", fontWeight: 500 }}>{zoom}%</span>
                  <button onClick={() => setZoom(Math.min(200, zoom + 10))} title="Zoom in" style={{
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                    fontSize: 14, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s"
                  }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>+</button>
                  <div style={{ width: "1px", height: "20px", background: "#d1d5db", margin: "0 4px" }} />
                  <button onClick={() => setRotation((rotation + 90) % 360)} title="Rotate" style={{
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 10px",
                    fontSize: 14, cursor: "pointer", color: "#6b7280", fontWeight: 600, transition: "all 0.15s"
                  }} onMouseEnter={e => { e.target.style.background = "#f3f4f6"; }} onMouseLeave={e => { e.target.style.background = "#fff"; }}>↻</button>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
                {hasFileUrl && (
                  <button
                    onClick={() => window.open(viewingDoc.file_url, '_blank')}
                    title="Download file"
                    style={{
                      background: "#1a6fbd", border: "1px solid #1a6fbd", borderRadius: 6, padding: "6px 12px",
                      fontSize: 13, cursor: "pointer", color: "#fff", fontWeight: 600, transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.target.style.background = "#1560a0"; }}
                    onMouseLeave={e => { e.target.style.background = "#1a6fbd"; }}
                  >
                    ⬇ Download
                  </button>
                )}
              </div>
            </div>

            {/* Preview content */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", overflow: "auto" }}>
              {hasFileUrl ? (
                isImageUrl(viewingDoc.file_url) ? (
                  <img
                    src={viewingDoc.file_url}
                    alt={viewingDoc.ref}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: 8,
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transformOrigin: "center",
                      transition: "transform 0.2s ease-out"
                    }}
                  />
                ) : (
                  <iframe
                    src={viewingDoc.file_url}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      borderRadius: 8,
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease-out"
                    }}
                  />
                )
              ) : (
                /* Placeholder when no file attached */
                <div style={{ textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 72, marginBottom: 16 }}>{SUBTYPE_ICON[viewingDoc.subtype] || "📄"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#9ca3af", marginBottom: 20 }}>No file attached</div>
                  <button
                    onClick={() => document.getElementById('upload-file-input')?.click()}
                    style={{
                      background: "#1a6fbd",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 32,
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => { e.target.style.background = "#1560a0"; }}
                    onMouseLeave={e => { e.target.style.background = "#1a6fbd"; }}
                  >
                    📤 Upload file
                  </button>
                  <input type="file" id="upload-file-input" style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png,.gif" />

                  {/* Summary card */}
                  <div style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: "20px",
                    maxWidth: "420px",
                    margin: "0 auto",
                    textAlign: "left"
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Document Summary</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Reference</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{viewingDoc.ref}</div>
                      </div>
                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Date</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{fmtDate(viewingDoc.date)}</div>
                      </div>
                    </div>

                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Party</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{viewingDoc.party}</div>
                    </div>

                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Amount</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{fmt(viewingDoc.amount)}</div>
                    </div>

                    {viewingDoc.notes && (
                      <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, borderLeft: "3px solid #10b981" }}>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 13, color: "#111827" }}>{viewingDoc.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meta strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Amount</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{fmt(viewingDoc.amount)}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Account Code</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{viewingDoc.code}</div>
              <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>{ACCOUNT_CODES.find(a => a.code === viewingDoc.code)?.label}</div>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Company</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{company.short}</div>
            </div>
          </div>

          {/* Lifecycle */}
          <div style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lifecycle</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {lifecycleSteps.map((step, i) => {
                const done = i < progress;
                const active = i === progress;
                return (
                  <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? "#10b981" : active ? "#3b82f6" : "#f3f4f6",
                      color: done || active ? "#fff" : "#9ca3af",
                      fontSize: 14, fontWeight: 700
                    }}>{done ? "✓" : i + 1}</div>
                    <div style={{ fontSize: 10, color: done ? "#065F46" : active ? "#1e40af" : "#9ca3af", textAlign: "center", fontWeight: active ? 600 : 400 }}>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {viewingDoc.status === "pending" || viewingDoc.status === "review" ? (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #e8eaf0", display: "flex", gap: 10 }}>
            <button onClick={handleApprove} style={{ flex: 1, padding: "12px 0", background: "#10b981", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✓ Approve</button>
            <button onClick={handleReject} style={{ flex: 1, padding: "12px 0", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✗ Reject</button>
          </div>
        ) : null}
      </div>

      {/* Left sidebar - document list (desktop only) */}
      <div style={{ width: 320, background: "#fff", borderLeft: "1px solid #e8eaf0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e8eaf0", fontWeight: 700, fontSize: 13, color: "#111827" }}>All documents</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {docs.map(doc => (
            <button key={doc.id} onClick={() => handleSelectDoc(doc.id)} style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: viewingDoc.id === doc.id ? "#eff6ff" : "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>{SUBTYPE_ICON[doc.subtype] || "📄"}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.ref}</div>
                <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.party}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{fmt(doc.amount)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SCREENS ────────────────────────────────────────────────────────────────────

function Dashboard({ docs, company, setViewingDoc, isMobile }) {
  const pending  = docs.filter(d => d.status === "pending").length;
  const approved = docs.filter(d => d.status === "approved").length;
  const total    = docs.reduce((s, d) => s + d.amount, 0);
  const bankers  = docs.filter(d => d.status === "approved" && d.type === "supplier").length;

  const pipeline = [
    { label:"Uploaded",    count: docs.length,  color:"#6366f1" },
    { label:"In review",   count: docs.filter(d=>d.status==="review").length,    color:"#3b82f6" },
    { label:"Approved",    count: approved,      color:"#10b981" },
    { label:"Bank maker",  count: bankers,       color:"#f59e0b" },
    { label:"Acct synced", count: docs.filter(d=>d.status==="synced").length,    color:"#14b8a6" },
  ];

  const recent = [...docs].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

  const byType = [
    { label:"Supplier invoices", count: docs.filter(d=>d.subtype==="Invoice").length },
    { label:"Credit / Debit notes", count: docs.filter(d=>d.subtype==="Credit Note"||d.subtype==="Debit Note").length },
    { label:"Petrol claims", count: docs.filter(d=>d.subtype==="Petrol").length },
    { label:"Medical claims", count: docs.filter(d=>d.subtype==="Medical").length },
    { label:"Entertainment", count: docs.filter(d=>d.subtype==="Entertainment").length },
    { label:"Telephone", count: docs.filter(d=>d.subtype==="Telephone").length },
  ];

  return (
    <div style={{ padding: isMobile ? "16px 12px" : "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: isMobile ? 11 : 13, color: "#6b7280", margin: "4px 0 0" }}>{company.name} · October 2024</p>
      </div>

      {/* Stats row - responsive grid */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 12, marginBottom: isMobile ? 16 : 24 }}>
        <StatCard label="Pending approval" value={pending} sub="↑ 3 new today" subColor="#b45309" isMobile={isMobile} />
        <StatCard label="Processed (MTD)" value={docs.length} sub="↑ 12% vs last month" subColor="#065F46" isMobile={isMobile} />
        <StatCard label="Total amount (MTD)" value={fmt(total)} sub="Supplier + Claims" isMobile={isMobile} />
        <StatCard label="Awaiting bank maker" value={bankers} sub="Finance action needed" subColor="#b45309" isMobile={isMobile} />
      </div>

      {/* Recent docs and pipeline - stack on mobile */}
      <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Recent documents */}
        <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius: isMobile ? 8 : 12, overflow:"hidden" }}>
          <div style={{ padding: isMobile ? "10px 12px" : "14px 20px", borderBottom:"1px solid #f0f0f5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:600, fontSize: isMobile ? 12 : 14, color:"#111827" }}>Recent documents</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color:"#1a6fbd", cursor:"pointer" }}>View all →</span>
          </div>
          {recent.map(doc => (
            <div key={doc.id} style={{
              display:"flex", alignItems:"center", gap: isMobile ? 8 : 12, padding: isMobile ? "8px 12px" : "10px 20px",
              borderBottom:"1px solid #f9fafb", cursor:"pointer",
              transition:"background .12s",
            }}
              onClick={() => setViewingDoc(doc)}
              onMouseEnter={e => e.currentTarget.style.background="#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div style={{ fontSize: isMobile ? 16 : 20 }}>{SUBTYPE_ICON[doc.subtype] || "📄"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doc.ref}</div>
                <div style={{ fontSize: isMobile ? 10 : 11, color:"#6b7280", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{doc.party} · {doc.subtype}</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color:"#111827" }}>{fmt(doc.amount)}</div>
                <Badge status={doc.status} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Pipeline */}
          <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius: isMobile ? 8 : 12, padding: isMobile ? "10px 12px" : "14px 20px" }}>
            <div style={{ fontWeight:600, fontSize: isMobile ? 12 : 14, color:"#111827", marginBottom: isMobile ? 10 : 14 }}>Approval pipeline</div>
            {pipeline.map(p => (
              <div key={p.label} style={{ display:"flex", alignItems:"center", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 8 : 10 }}>
                <span style={{ fontSize: isMobile ? 11 : 12, color:"#6b7280", width: isMobile ? 60 : 90, flexShrink:0 }}>{p.label}</span>
                <div style={{ flex:1, height:6, background:"#f3f4f6", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${Math.round((p.count / docs.length) * 100)}%`, height:"100%", background:p.color, borderRadius:3, transition:"width .5s" }} />
                </div>
                <span style={{ fontSize: isMobile ? 11 : 12, color:"#374151", fontWeight:600, width:20, textAlign:"right" }}>{p.count}</span>
              </div>
            ))}
          </div>

          {/* By type */}
          <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius: isMobile ? 8 : 12, padding: isMobile ? "10px 12px" : "14px 20px" }}>
            <div style={{ fontWeight:600, fontSize: isMobile ? 12 : 14, color:"#111827", marginBottom: isMobile ? 10 : 12 }}>Document types</div>
            {byType.map(t => (
              <div key={t.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding: isMobile ? "4px 0" : "5px 0", borderBottom:"1px solid #f9fafb" }}>
                <span style={{ fontSize: isMobile ? 11 : 12, color:"#374151" }}>{t.label}</span>
                <span style={{ fontSize: isMobile ? 11 : 12, fontWeight:600, color:"#111827", background:"#f3f4f6", padding:"1px 8px", borderRadius:10 }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Documents({ docs, setDocs, setViewingDoc }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = docs.filter(d => {
    if (filter === "supplier" && d.type !== "supplier") return false;
    if (filter === "claims"   && d.type !== "claim")    return false;
    if (filter === "pending"  && d.status !== "pending") return false;
    if (search && !d.ref.toLowerCase().includes(search.toLowerCase()) &&
        !d.party.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function approve(id) { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"approved"} : d)); setSelected(null); }
  function reject(id)  { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"rejected"} : d)); setSelected(null); }

  const TABS = [
    { key:"all",      label:"All" },
    { key:"supplier", label:"Supplier" },
    { key:"claims",   label:"Staff claims" },
    { key:"pending",  label:"Pending" },
  ];

  return (
    <div style={{ padding:"28px 32px", maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Documents</h1>
      </div>

      {/* Tabs + search */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ display:"flex", gap:0, borderBottom:"2px solid #f0f0f5" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding:"8px 16px", fontSize:13, border:"none", background:"none",
              cursor:"pointer", fontWeight: filter===t.key ? 600 : 400,
              color: filter===t.key ? "#1a6fbd" : "#6b7280",
              borderBottom: filter===t.key ? "2px solid #1a6fbd" : "2px solid transparent",
              marginBottom:-2,
            }}>{t.label}</button>
          ))}
        </div>
        <input
          placeholder="Search ref or supplier…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:"7px 12px", fontSize:13, border:"1px solid #e8eaf0", borderRadius:8, outline:"none", width:220, color:"#111827", background:"#fff" }}
        />
      </div>

      <div style={{ display:"grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap:16 }}>
        {/* Table */}
        <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f9fafb" }}>
                {["Type","Reference","Party / Staff","Amount","Account","Status","Date",""].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#374151", fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid #e8eaf0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}
                  onClick={() => { setViewingDoc(doc); setSelected(null); }}
                  style={{ borderBottom:"1px solid #f3f4f6", cursor:"pointer", background: selected?.id===doc.id ? "#eff6ff" : "transparent", transition:"background .1s" }}
                  onMouseEnter={e => { if (selected?.id!==doc.id) e.currentTarget.style.background="#f9fafb"; }}
                  onMouseLeave={e => { if (selected?.id!==doc.id) e.currentTarget.style.background="transparent"; }}
                >
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontSize:16 }}>{SUBTYPE_ICON[doc.subtype]}</span>
                    <span style={{ fontSize:11, color:"#6b7280", marginLeft:5 }}>{doc.subtype}</span>
                  </td>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#111827", fontFamily:"monospace", fontSize:12 }}>{doc.ref}</td>
                  <td style={{ padding:"10px 14px", color:"#374151", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{doc.party}</td>
                  <td style={{ padding:"10px 14px", fontWeight:600, color:"#111827", whiteSpace:"nowrap" }}>{fmt(doc.amount)}</td>
                  <td style={{ padding:"10px 14px" }}>
                    <span style={{ fontFamily:"monospace", fontSize:11, background:"#f3f4f6", padding:"2px 7px", borderRadius:5, color:"#374151" }}>{doc.code}</span>
                  </td>
                  <td style={{ padding:"10px 14px" }}><Badge status={doc.status} /></td>
                  <td style={{ padding:"10px 14px", color:"#6b7280", whiteSpace:"nowrap" }}>{fmtDate(doc.date)}</td>
                  <td style={{ padding:"10px 14px", color:"#9ca3af", fontSize:16 }}>›</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>No documents found</div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:12, padding:20, height:"fit-content" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontWeight:700, fontSize:15, color:"#111827" }}>{selected.ref}</span>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#6b7280" }}>×</button>
            </div>

            <div style={{ fontSize:28, textAlign:"center", margin:"16px 0 8px" }}>{SUBTYPE_ICON[selected.subtype]}</div>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <Badge status={selected.status} />
            </div>

            {[
              ["Type", selected.subtype],
              ["Party / Staff", selected.party],
              ["Amount", fmt(selected.amount)],
              ["Account code", selected.code + " · " + (ACCOUNT_CODES.find(a=>a.code===selected.code)?.label || "")],
              ["Uploaded by", selected.uploader],
              ["Date", fmtDate(selected.date)],
              ["Notes", selected.notes || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f3f4f6", fontSize:13 }}>
                <span style={{ color:"#6b7280" }}>{k}</span>
                <span style={{ color:"#111827", fontWeight:500, textAlign:"right", maxWidth:200 }}>{v}</span>
              </div>
            ))}

            {/* Lifecycle */}
            <div style={{ margin:"18px 0 14px", fontWeight:600, fontSize:12, color:"#374151", textTransform:"uppercase", letterSpacing:"0.05em" }}>Lifecycle</div>
            {["Uploaded","OCR extracted","Account mapped","Approved","Bank maker","Acct sync","Done"].map((step, i) => {
              const stages = { pending:3, review:3, approved:4, rejected:3, synced:7 };
              const prog = stages[selected.status] || 0;
              const done = i < prog;
              const active = i === prog;
              return (
                <div key={step} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <div style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0, fontSize:10, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background: done ? "#10b981" : active ? "#3b82f6" : "#f3f4f6",
                    color: done || active ? "#fff" : "#9ca3af",
                  }}>{done ? "✓" : i+1}</div>
                  <span style={{ fontSize:12, color: done ? "#065F46" : active ? "#1e40af" : "#9ca3af", fontWeight: active ? 600 : 400 }}>{step}</span>
                </div>
              );
            })}

            {selected.status === "pending" && (
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                <button onClick={() => approve(selected.id)} style={{ flex:1, padding:"9px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
                <button onClick={() => reject(selected.id)} style={{ flex:1, padding:"9px 0", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✗ Reject</button>
              </div>
            )}
            {selected.status === "review" && (
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                <button onClick={() => approve(selected.id)} style={{ flex:1, padding:"9px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
                <button onClick={() => reject(selected.id)} style={{ flex:1, padding:"9px 0", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✗ Reject</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Upload({ docs, setDocs }) {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setParty("Auto-detected: Pemasok Berjaya Sdn Bhd");
      setAmount("12500");
      setStep(2);
    }, 1800);
  }

  function submit() {
    const newDoc = {
      id: docs.length + 1,
      type: docType,
      subtype,
      ref: docType === "supplier" ? `INV-2024-${900 + docs.length}` : `CLM-00${50 + docs.length}`,
      party: party.replace("Auto-detected: ", ""),
      amount: parseFloat(amount) || 0,
      code,
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      uploader: "Lim Wei",
      notes,
    };
    setDocs(d => [newDoc, ...d]);
    setDone(true);
  }

  function reset() { setStep(1); setDocType(""); setSubtype(""); setParty(""); setAmount(""); setCode(""); setNotes(""); setFile(null); setDone(false); setProcessing(false); }

  const supplierSubtypes = ["Invoice", "Credit Note", "Debit Note"];
  const claimSubtypes    = ["Petrol", "Medical", "Telephone", "Entertainment"];
  const availableSubs    = docType === "supplier" ? supplierSubtypes : docType === "claim" ? claimSubtypes : [];
  const filteredCodes    = ACCOUNT_CODES.filter(a => !docType || a.type === docType);

  if (done) return (
    <div style={{ padding:"28px 32px", maxWidth:600 }}>
      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding:48, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
        <h2 style={{ fontSize:20, fontWeight:700, color:"#111827", marginBottom:8 }}>Document submitted</h2>
        <p style={{ color:"#6b7280", fontSize:14, marginBottom:24 }}>Your document has been queued for approval. The approver will be notified via email.</p>
        <button onClick={reset} style={{ padding:"10px 28px", background:"#1a6fbd", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>Upload another</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"28px 32px", maxWidth:680 }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:4 }}>Upload document</h1>
      <p style={{ fontSize:13, color:"#6b7280", marginBottom:24 }}>Supported formats: PDF, JPG, PNG</p>

      {/* Progress */}
      <div style={{ display:"flex", gap:0, marginBottom:28 }}>
        {["Select & upload","Fill details","Review & submit"].map((s, i) => (
          <div key={s} style={{ flex:1, textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"center" }}>
              {i > 0 && <div style={{ flex:1, height:2, background: step > i ? "#1a6fbd" : "#e8eaf0" }} />}
              <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
                background: step > i+1 ? "#10b981" : step === i+1 ? "#1a6fbd" : "#e8eaf0",
                color: step >= i+1 ? "#fff" : "#9ca3af", flexShrink:0 }}>
                {step > i+1 ? "✓" : i+1}
              </div>
              {i < 2 && <div style={{ flex:1, height:2, background: step > i+1 ? "#1a6fbd" : "#e8eaf0" }} />}
            </div>
            <div style={{ fontSize:11, color: step===i+1 ? "#1a6fbd" : "#9ca3af", marginTop:6, fontWeight: step===i+1 ? 600 : 400 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding:28 }}>
        {step === 1 && (
          <>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Document category</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[{k:"supplier",label:"Supplier document",icon:"🏢",desc:"Invoice, CN, DN"},{k:"claim",label:"Staff claim",icon:"👤",desc:"Petrol, medical, etc."}].map(opt => (
                  <div key={opt.k} onClick={() => { setDocType(opt.k); setSubtype(""); setCode(""); }}
                    style={{ border:`2px solid ${docType===opt.k ? "#1a6fbd" : "#e8eaf0"}`, borderRadius:10, padding:14, cursor:"pointer", background: docType===opt.k ? "#eff6ff" : "#fff", transition:"all .15s" }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{opt.icon}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {docType && (
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Document type</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {availableSubs.map(s => (
                    <button key={s} onClick={() => setSubtype(s)} style={{
                      padding:"6px 14px", border:`1.5px solid ${subtype===s ? "#1a6fbd" : "#e8eaf0"}`,
                      borderRadius:20, background: subtype===s ? "#eff6ff" : "#fff",
                      color: subtype===s ? "#1a6fbd" : "#374151", fontSize:13, cursor:"pointer", fontWeight: subtype===s ? 600 : 400,
                    }}>{SUBTYPE_ICON[s]} {s}</button>
                  ))}
                </div>
              </div>
            )}

            <div
              onClick={() => docType && subtype && fileRef.current.click()}
              style={{
                border:`2px dashed ${docType && subtype ? "#1a6fbd" : "#e8eaf0"}`,
                borderRadius:12, padding:36, textAlign:"center",
                background: docType && subtype ? "#f0f7ff" : "#f9fafb",
                cursor: docType && subtype ? "pointer" : "not-allowed",
                transition:"all .2s",
              }}>
              {processing ? (
                <>
                  <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
                  <div style={{ fontSize:14, color:"#1a6fbd", fontWeight:600 }}>Processing with OCR…</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>Extracting document fields</div>
                </>
              ) : file ? (
                <>
                  <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                  <div style={{ fontSize:14, color:"#065F46", fontWeight:600 }}>{file.name}</div>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>File ready · {Math.round(file.size/1024)} KB</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:40, marginBottom:10 }}>☁️</div>
                  <div style={{ fontSize:14, fontWeight:600, color: docType && subtype ? "#1a6fbd" : "#9ca3af" }}>
                    {docType && subtype ? "Click to upload or drag & drop" : "Select category and type first"}
                  </div>
                  <div style={{ fontSize:12, color:"#9ca3af", marginTop:4 }}>PDF, JPG, PNG · max 20MB</div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} style={{ display:"none" }} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#065F46" }}>
              ✨ OCR extracted fields automatically. Please verify and correct if needed.
            </div>
            {[
              { label:"Supplier / Staff name", val:party, set:setParty, placeholder:"Company or person name" },
              { label:"Amount (RM)", val:amount, set:setAmount, placeholder:"0.00", type:"number" },
              { label:"Notes (optional)", val:notes, set:setNotes, placeholder:"Any remarks…" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>{f.label}</label>
                <input type={f.type||"text"} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #e8eaf0", borderRadius:8, fontSize:13, outline:"none", color:"#111827", background:"#fff", boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:6 }}>Account code</label>
              <select value={code} onChange={e => setCode(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", border:"1px solid #e8eaf0", borderRadius:8, fontSize:13, outline:"none", color:"#111827", background:"#fff" }}>
                <option value="">Select account code…</option>
                {filteredCodes.map(a => <option key={a.code} value={a.code}>{a.code} — {a.label}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:"10px 0", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>← Back</button>
              <button onClick={() => party && amount && code && setStep(3)} style={{ flex:2, padding:"10px 0", background:"#1a6fbd", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", opacity: party && amount && code ? 1 : 0.5 }}>Continue →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontWeight:700, fontSize:16, color:"#111827", marginBottom:16 }}>Review before submitting</div>
            {[
              ["Category", docType === "supplier" ? "Supplier document" : "Staff claim"],
              ["Type", subtype],
              ["Party", party.replace("Auto-detected: ", "")],
              ["Amount", fmt(parseFloat(amount)||0)],
              ["Account code", code + " · " + (ACCOUNT_CODES.find(a=>a.code===code)?.label || "")],
              ["Notes", notes || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f3f4f6", fontSize:13 }}>
                <span style={{ color:"#6b7280" }}>{k}</span>
                <span style={{ color:"#111827", fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={() => setStep(2)} style={{ flex:1, padding:"10px 0", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>← Back</button>
              <button onClick={submit} style={{ flex:2, padding:"10px 0", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>Submit for approval</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Approvals({ docs, setDocs, setViewingDoc }) {
  const pending = docs.filter(d => d.status === "pending" || d.status === "review");

  function approve(id) { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"approved"} : d)); }
  function reject(id)  { setDocs(ds => ds.map(d => d.id===id ? {...d, status:"rejected"} : d)); }

  return (
    <div style={{ padding:"28px 32px", maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Approval queue</h1>
        <p style={{ fontSize:13, color:"#6b7280", margin:"4px 0 0" }}>{pending.length} document{pending.length!==1?"s":""} awaiting your action</p>
      </div>

      {pending.length === 0 ? (
        <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:16, padding:60, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <div style={{ fontSize:16, fontWeight:600, color:"#111827" }}>All caught up!</div>
          <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>No documents pending approval.</div>
        </div>
      ) : pending.map(doc => (
        <div key={doc.id} onClick={() => setViewingDoc(doc)} style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, padding:20, marginBottom:14, display:"flex", gap:16, alignItems:"flex-start", cursor:"pointer" }}>
          <div style={{ fontSize:36, flexShrink:0 }}>{SUBTYPE_ICON[doc.subtype]}</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <div>
                <span style={{ fontSize:15, fontWeight:700, color:"#111827" }}>{doc.ref}</span>
                <Badge status={doc.status} />
              </div>
              <span style={{ fontSize:16, fontWeight:700, color:"#111827" }}>{fmt(doc.amount)}</span>
            </div>
            <div style={{ fontSize:13, color:"#374151", marginBottom:2 }}>{doc.party}</div>
            <div style={{ fontSize:12, color:"#6b7280" }}>{doc.subtype} · Uploaded by {doc.uploader} · {fmtDate(doc.date)}</div>
            {doc.notes && <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Note: {doc.notes}</div>}
            <div style={{ marginTop:4 }}>
              <span style={{ fontFamily:"monospace", fontSize:11, background:"#f3f4f6", padding:"2px 7px", borderRadius:5, color:"#374151" }}>{doc.code}</span>
              <span style={{ fontSize:11, color:"#6b7280", marginLeft:6 }}>{ACCOUNT_CODES.find(a=>a.code===doc.code)?.label}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
            <button onClick={() => approve(doc.id)} style={{ padding:"8px 20px", background:"#10b981", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Approve</button>
            <button onClick={() => reject(doc.id)}  style={{ padding:"8px 20px", background:"#fee2e2", color:"#991b1b", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✗ Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Finance({ docs, setDocs, setViewingDoc }) {
  const ready = docs.filter(d => d.status === "approved" && d.type === "supplier");
  const [paid, setPaid] = useState([]);

  function markPaid(id) { setPaid(p => [...p, id]); setDocs(ds => ds.map(d => d.id===id ? {...d, status:"synced"} : d)); }

  const total = ready.reduce((s, d) => s + d.amount, 0);

  return (
    <div style={{ padding:"28px 32px", maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Finance / Bank maker</h1>
        <p style={{ fontSize:13, color:"#6b7280", margin:"4px 0 0" }}>Approved supplier documents ready for payment processing</p>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20 }}>
        <StatCard label="Ready for payment" value={ready.length} />
        <StatCard label="Total payable" value={fmt(total)} />
        <StatCard label="Processed today" value={paid.length} sub="Bank transfers initiated" subColor="#065F46" />
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:600, fontSize:14, color:"#111827" }}>Payment queue</span>
          <button style={{ padding:"7px 16px", background:"#1a6fbd", color:"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Export to bank portal
          </button>
        </div>
        {ready.length === 0 ? (
          <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>No approved supplier documents pending payment.</div>
        ) : ready.map(doc => (
          <div key={doc.id} onClick={() => setViewingDoc(doc)} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 20px", borderBottom:"1px solid #f9fafb", cursor:"pointer" }}>
            <div style={{ fontSize:24 }}>{SUBTYPE_ICON[doc.subtype]}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{doc.party}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{doc.ref} · {fmtDate(doc.date)}</div>
            </div>
            <div style={{ textAlign:"right", marginRight:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{fmt(doc.amount)}</div>
              <div style={{ fontFamily:"monospace", fontSize:11, color:"#6b7280" }}>{doc.code}</div>
            </div>
            {paid.includes(doc.id) ? (
              <span style={{ background:"#d1fae5", color:"#065F46", fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:8 }}>✓ Processed</span>
            ) : (
              <button onClick={() => markPaid(doc.id)} style={{ padding:"7px 14px", background:"#f0fdf4", color:"#065F46", border:"1.5px solid #bbf7d0", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Mark paid
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountingSync({ docs }) {
  const [software, setSoftware] = useState("autocount");
  const [exported, setExported] = useState(false);
  const syncable = docs.filter(d => d.status === "approved" || d.status === "synced");

  return (
    <div style={{ padding:"28px 32px", maxWidth:900 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Accounting sync</h1>
        <p style={{ fontSize:13, color:"#6b7280", margin:"4px 0 0" }}>Export approved documents to your accounting software</p>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, padding:24, marginBottom:16 }}>
        <div style={{ fontWeight:600, fontSize:14, color:"#111827", marginBottom:14 }}>Select accounting software</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
          {[{k:"autocount",label:"AutoCount",desc:"XML / CSV import template",icon:"🔵"},{k:"sql",label:"SQL Account",desc:"CSV import wizard",icon:"🟠"}].map(opt => (
            <div key={opt.k} onClick={() => { setSoftware(opt.k); setExported(false); }}
              style={{ border:`2px solid ${software===opt.k ? "#1a6fbd":"#e8eaf0"}`, borderRadius:10, padding:16, cursor:"pointer", background: software===opt.k ? "#eff6ff":"#fff" }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{opt.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{opt.label}</div>
              <div style={{ fontSize:12, color:"#6b7280" }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"#f9fafb", borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:8 }}>Export preview — {syncable.length} documents</div>
          <div style={{ fontFamily:"monospace", fontSize:11, color:"#374151" }}>
            {software === "autocount" ? (
              <>
                <div style={{ color:"#6b7280" }}>&lt;?xml version="1.0"?&gt;</div>
                <div>&lt;AutoCountImport&gt;</div>
                {syncable.slice(0,3).map(d => (
                  <div key={d.id} style={{ paddingLeft:12 }}>
                    &lt;Journal ref="{d.ref}" acc="{d.code}" amount="{d.amount}" date="{d.date}"/&gt;
                  </div>
                ))}
                {syncable.length > 3 && <div style={{ paddingLeft:12, color:"#9ca3af" }}>… {syncable.length - 3} more entries</div>}
                <div>&lt;/AutoCountImport&gt;</div>
              </>
            ) : (
              <>
                <div style={{ color:"#6b7280" }}>DocRef,Date,Account,Description,Amount</div>
                {syncable.slice(0,3).map(d => (
                  <div key={d.id}>{d.ref},{d.date},{d.code},{d.subtype} - {d.party},{d.amount}</div>
                ))}
                {syncable.length > 3 && <div style={{ color:"#9ca3af" }}>… {syncable.length - 3} more rows</div>}
              </>
            )}
          </div>
        </div>

        {exported ? (
          <div style={{ background:"#d1fae5", border:"1px solid #bbf7d0", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#065F46", fontWeight:600 }}>
            ✅ Export file generated. Share with your accounts team to import into {software === "autocount" ? "AutoCount" : "SQL Account"}.
          </div>
        ) : (
          <button onClick={() => setExported(true)} style={{ width:"100%", padding:"11px 0", background:"#1a6fbd", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>
            Generate {software === "autocount" ? "XML" : "CSV"} export file
          </button>
        )}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f5" }}>
          <span style={{ fontWeight:600, fontSize:14, color:"#111827" }}>Account code summary</span>
        </div>
        {ACCOUNT_CODES.map(ac => {
          const count = syncable.filter(d => d.code === ac.code).length;
          const total = syncable.filter(d => d.code === ac.code).reduce((s,d) => s + d.amount, 0);
          return (
            <div key={ac.code} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", borderBottom:"1px solid #f9fafb" }}>
              <span style={{ fontFamily:"monospace", fontSize:12, background:"#f3f4f6", padding:"2px 8px", borderRadius:5, color:"#374151", flexShrink:0 }}>{ac.code}</span>
              <span style={{ flex:1, fontSize:13, color:"#374151" }}>{ac.label}</span>
              <span style={{ fontSize:12, color:"#6b7280" }}>{count} doc{count!==1?"s":""}</span>
              <span style={{ fontSize:13, fontWeight:600, color:"#111827", minWidth:100, textAlign:"right" }}>{count > 0 ? fmt(total) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserManagement({ members, setMembers, company }) {
  const [selectedId, setSelectedId] = useState(members[0]?.id || null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Staff");

  useEffect(() => {
    if (!members.some(member => member.id === selectedId)) {
      setSelectedId(members[0]?.id || null);
    }
  }, [members, selectedId]);

  const selectedMember = members.find(member => member.id === selectedId) || members[0] || null;

  const updateMember = (id, patch) => {
    setMembers(current => current.map(member => member.id === id ? { ...member, ...patch } : member));
  };

  const togglePermission = (id, key) => {
    setMembers(current => current.map(member => {
      if (member.id !== id) return member;
      return {
        ...member,
        permissions: {
          ...member.permissions,
          [key]: !member.permissions[key],
        },
      };
    }));
  };

  const toggleNotification = (id, key) => {
    setMembers(current => current.map(member => {
      if (member.id !== id) return member;
      return {
        ...member,
        notifications: {
          ...member.notifications,
          [key]: !member.notifications[key],
        },
      };
    }));
  };

  const handleRoleChange = (id, role) => {
    setMembers(current => current.map(member => {
      if (member.id !== id) return member;
      return {
        ...member,
        role,
        permissions: { ...ROLE_DEFAULTS[role] },
      };
    }));
  };

  const submitInvite = event => {
    event.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember = {
      id: Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      permissions: { ...ROLE_DEFAULTS[inviteRole] },
      notifications: { email:true, telegram:false, whatsapp:false },
    };

    setMembers(current => [newMember, ...current]);
    setSelectedId(newMember.id);
    setInviteOpen(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("Staff");
  };

  const roleDefaults = selectedMember ? ROLE_DEFAULTS[selectedMember.role] || {} : {};

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1180 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>User management</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>Select a member to view and edit permissions, or invite a new one.</div>
        </div>
        <button onClick={() => setInviteOpen(true)} style={{ padding: "12px 18px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Invite new member
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div style={{ flex: "0 0 320px", minWidth: 280, maxWidth: 320, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0f0f5", fontWeight: 700, color: "#111827" }}>All members</div>
          {members.map(member => (
            <button key={member.id} onClick={() => setSelectedId(member.id)} style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: selectedMember?.id === member.id ? "#eff6ff" : "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
            }}>
              <Avatar name={member.name} color="#7c3aed" size={38} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.email}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#374151", background: "#f3f4f6", borderRadius: 999, padding: "5px 10px" }}>{member.role}</span>
            </button>
          ))}
          {members.length === 0 && <div style={{ padding: 20, color: "#6b7280" }}>No members yet.</div>}
        </div>

        <div style={{ flex: "1 1 580px", minWidth: 320, background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, padding: 20 }}>
          {selectedMember ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, marginBottom: 20, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <Avatar name={selectedMember.name} color="#7c3aed" size={52} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedMember.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{selectedMember.email}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 180 }}>
                  <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Role</label>
                  <select value={selectedMember.role} onChange={e => handleRoleChange(selectedMember.id, e.target.value)} style={{ flex: 1, minWidth: 140, padding: "10px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827", fontSize: 13, cursor: "pointer" }}>
                    {Object.keys(ROLE_DEFAULTS).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Permissions</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Role defaults are shown with a lock icon, custom toggles remain editable.</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", padding: "6px 10px", borderRadius: 999, background: "#f3f4f6" }}>
                      {selectedMember.role} defaults
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {USER_PERMISSIONS.map(perm => {
                      const base = !!roleDefaults[perm.key];
                      const active = !!selectedMember.permissions[perm.key];
                      return (
                        <div key={perm.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 12, background: "#f9fafb" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#111827" }}>
                              {perm.label}
                              {base && <span style={{ color: "#6b7280", fontSize: 12 }}>🔒</span>}
                            </div>
                            <div style={{ fontSize: 11, color: active === base ? "#6b7280" : "#1a6fbd" }}>
                              {base ? "Role default" : active ? "Custom enabled" : "Custom off"}
                            </div>
                          </div>
                          <button onClick={() => togglePermission(selectedMember.id, perm.key)} style={{ width: 56, height: 28, borderRadius: 999, border: "none", background: active ? "#1a6fbd" : "#e5e7eb", color: active ? "#fff" : "#6b7280", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            {active ? "On" : "Off"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Per-member delivery channels for alerts.</div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {NOTIFICATION_CHANNELS.map(note => {
                      const active = !!selectedMember.notifications[note.key];
                      return (
                        <div key={note.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 12, background: "#f9fafb" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{note.label}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{active ? "Subscribed" : "Muted"}</div>
                          </div>
                          <button onClick={() => toggleNotification(selectedMember.id, note.key)} style={{ width: 56, height: 28, borderRadius: 999, border: "none", background: active ? "#1a6fbd" : "#e5e7eb", color: active ? "#fff" : "#6b7280", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            {active ? "On" : "Off"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
              Select a member to view and edit their permissions.
            </div>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(15,23,42,0.18)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Invite a new member</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Members receive an invite and are added with the selected role defaults.</div>
              </div>
              <button onClick={() => setInviteOpen(false)} style={{ border: "none", background: "transparent", fontSize: 20, color: "#6b7280", cursor: "pointer" }}>×</button>
            </div>
            <form onSubmit={submitInvite} style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#374151" }}>
                Name
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Full name" style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1px solid #e8eaf0", fontSize: 14, color: "#111827" }} />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#374151" }}>
                Email
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@example.com" style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1px solid #e8eaf0", fontSize: 14, color: "#111827" }} />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 12, color: "#374151" }}>
                Role
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1px solid #e8eaf0", background: "#fff", color: "#111827", fontSize: 14, cursor: "pointer" }}>
                  {Object.keys(ROLE_DEFAULTS).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
              <div style={{ fontSize: 12, color: "#6b7280", padding: "12px 14px", borderRadius: 12, background: "#f8fafc" }}>
                <strong>{inviteRole}</strong> default permissions: {USER_PERMISSIONS.filter(p => ROLE_DEFAULTS[inviteRole][p.key]).map(p => p.label).join(", ") || "none"}.
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setInviteOpen(false)} style={{ padding: "11px 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "11px 16px", borderRadius: 12, border: "none", background: "#1a6fbd", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Send invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Pricing() {
  const plans = [
    {
      name:"Starter", price:"RM 99", period:"/month",
      desc:"Perfect for small businesses with one entity",
      highlight:false,
      features:[
        "1 company entity","Up to 10 users","100 documents/month",
        "2-step approval flow","Email notifications",
        "Manual CSV export","90-day archive",
      ],
      cta:"Get started",
    },
    {
      name:"Growth", price:"RM 249", period:"/month",
      desc:"For growing SMEs managing multiple entities",
      highlight:true,
      features:[
        "Up to 5 company entities","Up to 30 users","500 documents/month",
        "Multi-level approval","Email + WhatsApp alerts",
        "AutoCount & SQL Account templates","Finance bank maker module",
        "2-year archive","Role-based access control",
      ],
      cta:"Start free trial",
    },
    {
      name:"Enterprise", price:"RM 599", period:"/month",
      desc:"For group holdings and larger businesses",
      highlight:false,
      features:[
        "Unlimited companies & users","Unlimited documents",
        "Custom approval chains","AutoCount SDK / SQL ODBC",
        "API access for ERP / HR","Custom account code rules",
        "Dedicated onboarding","Unlimited archive + audit trail",
        "White-label for accounting firms",
      ],
      cta:"Contact us",
    },
  ];

  return (
    <div style={{ padding:"28px 32px", maxWidth:980 }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <h1 style={{ fontSize:26, fontWeight:800, color:"#111827", margin:0 }}>Simple, transparent pricing</h1>
        <p style={{ fontSize:14, color:"#6b7280", margin:"8px 0 0" }}>All plans include a 14-day free trial. No credit card required.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background:"#fff",
            border: plan.highlight ? "2px solid #1a6fbd" : "1px solid #e8eaf0",
            borderRadius:16, padding:24, position:"relative",
            boxShadow: plan.highlight ? "0 4px 24px #1a6fbd18" : "none",
          }}>
            {plan.highlight && (
              <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#1a6fbd", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 14px", borderRadius:20, whiteSpace:"nowrap" }}>
                Most popular
              </div>
            )}
            <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 }}>{plan.name}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginBottom:16 }}>{plan.desc}</div>
            <div style={{ display:"flex", alignItems:"baseline", gap:2, marginBottom:20 }}>
              <span style={{ fontSize:28, fontWeight:800, color:"#111827" }}>{plan.price}</span>
              <span style={{ fontSize:12, color:"#6b7280" }}>{plan.period}</span>
            </div>
            <button style={{ width:"100%", padding:"10px 0", background: plan.highlight ? "#1a6fbd" : "#f3f4f6", color: plan.highlight ? "#fff" : "#374151", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:20 }}>
              {plan.cta}
            </button>
            {plan.features.map(f => (
              <div key={f} style={{ display:"flex", gap:8, marginBottom:8, fontSize:13, color:"#374151" }}>
                <span style={{ color:"#10b981", flexShrink:0 }}>✓</span>{f}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings({ companies, company, setCompany }) {
  return (
    <div style={{ padding:"28px 32px", maxWidth:680 }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", marginBottom:24 }}>Settings</h1>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f5", fontWeight:600, fontSize:14, color:"#111827" }}>Company entities</div>
        {companies.map(co => (
          <div key={co.id} onClick={() => setCompany(co)}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px", borderBottom:"1px solid #f9fafb", cursor:"pointer", background: company.id===co.id ? "#eff6ff" : "transparent" }}>
            <Avatar name={co.short} color={co.color} size={36} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#111827" }}>{co.name}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>Growth plan · Active</div>
            </div>
            {company.id===co.id && <span style={{ fontSize:12, color:"#1a6fbd", fontWeight:600 }}>Active ✓</span>}
          </div>
        ))}
        <div style={{ padding:"12px 20px" }}>
          <button style={{ fontSize:13, color:"#1a6fbd", background:"none", border:"1px dashed #1a6fbd44", borderRadius:8, padding:"7px 14px", cursor:"pointer" }}>+ Add company entity</button>
        </div>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f5", fontWeight:600, fontSize:14, color:"#111827" }}>Notification preferences</div>
        {[
          ["Email notifications", "Approval requests, rejections, reminders", true],
          ["WhatsApp alerts", "Urgent approvals (Growth plan & above)", true],
          ["Finance notifications", "Notify when docs ready for bank maker", true],
          ["Accounting sync alerts", "Notify when export is ready", false],
        ].map(([label, desc, on]) => (
          <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"1px solid #f9fafb" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"#111827" }}>{label}</div>
              <div style={{ fontSize:11, color:"#6b7280" }}>{desc}</div>
            </div>
            <div style={{ width:36, height:20, borderRadius:10, background: on ? "#1a6fbd" : "#e8eaf0", position:"relative", cursor:"pointer" }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff", position:"absolute", top:2, left: on ? 18 : 2, transition:"left .15s" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e8eaf0", borderRadius:14, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f5", fontWeight:600, fontSize:14, color:"#111827" }}>Account code mapping</div>
        {ACCOUNT_CODES.map(ac => (
          <div key={ac.code} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 20px", borderBottom:"1px solid #f9fafb" }}>
            <span style={{ fontFamily:"monospace", fontSize:12, background:"#f3f4f6", padding:"2px 8px", borderRadius:5, color:"#374151", flexShrink:0, width:40, textAlign:"center" }}>{ac.code}</span>
            <span style={{ flex:1, fontSize:13, color:"#374151" }}>{ac.label}</span>
            <span style={{ fontSize:11, background: ac.type==="supplier" ? "#dbeafe":"#d1fae5", color: ac.type==="supplier" ? "#1e40af":"#065F46", padding:"2px 8px", borderRadius:10, fontWeight:600 }}>{ac.type}</span>
            <button style={{ fontSize:12, color:"#1a6fbd", background:"none", border:"none", cursor:"pointer" }}>Edit</button>
          </div>
        ))}
        <div style={{ padding:"12px 20px" }}>
          <button style={{ fontSize:13, color:"#1a6fbd", background:"none", border:"1px dashed #1a6fbd44", borderRadius:8, padding:"7px 14px", cursor:"pointer" }}>+ Add account code</button>
        </div>
      </div>
    </div>
  );
}

// ── APP SHELL ──────────────────────────────────────────────────────────────────
const NAV = [
  { key:"dashboard",  label:"Dashboard",     icon:"📊" },
  { key:"documents",  label:"Documents",     icon:"📁" },
  { key:"upload",     label:"Upload",         icon:"⬆️" },
  { key:"approvals",  label:"Approvals",     icon:"✅" },
  { key:"users",      label:"Users",         icon:"👥" },
  { key:"finance",    label:"Finance",        icon:"🏦" },
  { key:"accounting", label:"Acct sync",     icon:"🔄" },
  { key:"settings",   label:"Settings",      icon:"⚙️" },
  { key:"pricing",    label:"Pricing",       icon:"💳" },
];

export default function App() {
  const [screen, setScreen] = useState("dashboard");
  const [company, setCompany] = useState(COMPANIES[0]);
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [coOpen, setCoOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const listener = event => setIsMobile(event.matches);
    media.addEventListener("change", listener);
    setIsMobile(media.matches);
    return () => media.removeEventListener("change", listener);
  }, []);

  const pendingCount = docs.filter(d => d.status === "pending").length;

  return (
    <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", minHeight:"100vh", fontFamily:"'DM Sans', system-ui, sans-serif", background:"#f5f6fa" }}>
      {/* Sidebar (hidden on mobile) */}
      {!isMobile && (
        <div style={{ width: 220, background:"#fff", borderRight: "1px solid #e8eaf0", display:"flex", flexDirection:"column", flexShrink:0, position: "sticky", top:0, height: "100vh" }}>
          <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #f0f0f5" }}>
            <div style={{ fontSize:17, fontWeight:800, color:"#111827" }} >A<span style={{ color:"#1a6fbd" }}>prova</span></div>
            <div style={{ fontSize:10, color:"#9ca3af", marginTop:1, letterSpacing:"0.05em" }}>DOCUMENT APPROVALS</div>
          </div>

          {/* Company switcher */}
          <div style={{ padding:"12px 14px", borderBottom:"1px solid #f0f0f5", position:"relative" }}>
            <div onClick={() => setCoOpen(!coOpen)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", background:"#f5f6fa", borderRadius:10, cursor:"pointer", border:"1px solid #e8eaf0" }}>
              <Avatar name={company.short} color={company.color} size={26} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{company.name}</div>
                <div style={{ fontSize:10, color:"#6b7280" }}>Switch company ▾</div>
              </div>
            </div>
            {coOpen && (
              <div style={{ position:"absolute", top:"100%", left:14, right:14, background:"#fff", border:"1px solid #e8eaf0", borderRadius:10, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", zIndex:50, overflow:"hidden" }}>
                {COMPANIES.map(co => (
                  <div key={co.id} onClick={() => { setCompany(co); setCoOpen(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", cursor:"pointer", background: company.id===co.id ? "#eff6ff":"#fff" }}
                    onMouseEnter={e => e.currentTarget.style.background="#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background=company.id===co.id?"#eff6ff":"#fff"}
                  >
                    <Avatar name={co.short} color={co.color} size={22} />
                    <span style={{ fontSize:12, color:"#111827", fontWeight: company.id===co.id ? 600:400 }}>{co.name}</span>
                    {company.id===co.id && <span style={{ marginLeft:"auto", fontSize:12, color:"#1a6fbd" }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex:1, padding:"10px 10px", overflowY: "auto" }}>
            {NAV.map(n => (
              <div key={n.key} onClick={() => setScreen(n.key)}
                style={{
                  display: "flex", width: "100%", alignItems:"center", gap:10, padding:"9px 12px",
                  borderRadius:9, cursor:"pointer", marginBottom: 2,
                  background: screen===n.key ? "#eff6ff" : "transparent",
                  color: screen===n.key ? "#1a6fbd" : "#374151",
                  fontWeight: screen===n.key ? 600 : 400,
                  fontSize:13, transition:"background .12s", position:"relative",
                }}
                onMouseEnter={e => { if(screen!==n.key) e.currentTarget.style.background="#f5f6fa"; }}
                onMouseLeave={e => { if(screen!==n.key) e.currentTarget.style.background="transparent"; }}
              >
                <span style={{ fontSize:15 }}>{n.icon}</span>
                {n.label}
                {n.key === "approvals" && pendingCount > 0 && (
                  <span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10 }}>{pendingCount}</span>
                )}
              </div>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding:"12px 14px", borderTop:"1px solid #f0f0f5", display:"flex", alignItems:"center", gap:10, flexWrap: "wrap" }}>
            <Avatar name="LW" color="#1a6fbd" size={30} />
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:"#111827" }}>Lim Wei Shen</div>
              <div style={{ fontSize:10, color:"#6b7280" }}>Admin · Growth plan</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile top bar (only on mobile) */}
      {isMobile && (
        <div style={{ background:"#fff", borderBottom: "1px solid #e8eaf0", padding: "12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12, position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#111827" }}>A<span style={{ color:"#1a6fbd" }}>prova</span></div>
          <div onClick={() => setCoOpen(!coOpen)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", background:"#f5f6fa", borderRadius:8, cursor:"pointer", border:"1px solid #e8eaf0", minHeight: 40, minWidth: 40, justifyContent: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{company.short}</div>
          </div>
          {coOpen && (
            <div style={{ position:"absolute", top:"100%", right:16, left:16, background:"#fff", border:"1px solid #e8eaf0", borderRadius:10, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", zIndex:50, overflow:"hidden", marginTop: 8 }}>
              {COMPANIES.map(co => (
                <div key={co.id} onClick={() => { setCompany(co); setCoOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", cursor:"pointer", background: company.id===co.id ? "#eff6ff":"#fff" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background=company.id===co.id?"#eff6ff":"#fff"}
                >
                  <Avatar name={co.short} color={co.color} size={22} />
                  <span style={{ fontSize:12, color:"#111827", fontWeight: company.id===co.id ? 600:400 }}>{co.name}</span>
                  {company.id===co.id && <span style={{ marginLeft:"auto", fontSize:12, color:"#1a6fbd" }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", paddingBottom: isMobile ? 60 : 0 }} onClick={() => coOpen && setCoOpen(false)}>
        {screen === "dashboard"  && <Dashboard  docs={docs} company={company} setViewingDoc={setViewingDoc} isMobile={isMobile} />}
        {screen === "documents"  && <Documents  docs={docs} setDocs={setDocs} setViewingDoc={setViewingDoc} />}
        {screen === "upload"     && <Upload     docs={docs} setDocs={setDocs} />}
        {screen === "approvals"  && <Approvals  docs={docs} setDocs={setDocs} setViewingDoc={setViewingDoc} />}
        {screen === "finance"    && <Finance    docs={docs} setDocs={setDocs} setViewingDoc={setViewingDoc} />}
        {screen === "accounting" && <AccountingSync docs={docs} />}
        {screen === "users"      && <UserManagement members={members} setMembers={setMembers} company={company} />}
        {screen === "pricing"    && <Pricing />}
        {screen === "settings"   && <Settings companies={COMPANIES} company={company} setCompany={setCompany} />}
      </div>

      {/* Mobile bottom nav (only on mobile) */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e8eaf0", display: "flex", justifyContent: "space-around", alignItems: "center", height: 60, zIndex: 40 }}>
          {NAV.slice(0, 5).map(n => (
            <button key={n.key} onClick={() => setScreen(n.key)} style={{
              flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              background: screen === n.key ? "#eff6ff" : "transparent",
              border: "none", cursor: "pointer", fontSize: 20, color: screen === n.key ? "#1a6fbd" : "#6b7280",
              transition: "all 0.12s"
            }} title={n.label}>
              <span>{n.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: "inherit" }}>{n.key === "approvals" && pendingCount > 0 ? pendingCount : ""}</span>
            </button>
          ))}
        </div>
      )}

      {/* Document Viewer */}
      <DocumentViewer docs={docs} viewingDoc={viewingDoc} setViewingDoc={setViewingDoc} setDocs={setDocs} company={company} isMobile={isMobile} />
    </div>
  );
}