from pathlib import Path

path = Path('src/App.jsx')
text = path.read_text(encoding='utf-8')
start = 'function AccountingSync({ docs, paymentRecords, setDocs, setPaymentRecords }) {'
end = 'function UserManagement({ members, setMembers, company }) {'
idx = text.find(start)
if idx == -1:
    raise SystemExit('start marker not found')
idx2 = text.find(end, idx)
if idx2 == -1:
    raise SystemExit('end marker not found')
new_block = '''function AccountingSync({ docs, paymentRecords, setDocs, setPaymentRecords, setViewingDoc, isMobile }) {
  const [software, setSoftware] = useState("autocount");
  const [invoiceExported, setInvoiceExported] = useState(false);
  const [paymentExported, setPaymentExported] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [invoiceForms, setInvoiceForms] = useState({});
  const [paymentForms, setPaymentForms] = useState({});

  const supplierInvoices = docs.filter(doc => doc.type === "supplier" && doc.status === "approved");
  const postedInvoices = supplierInvoices.filter(doc => doc.invoicePosted);
  const invoiceProgress = supplierInvoices.length ? Math.round((postedInvoices.length / supplierInvoices.length) * 100) : 0;
  const supplierAccountCodes = ACCOUNT_CODES.filter(a => a.type === "supplier" && a.code.startsWith("400-"));
  const sortedInvoices = [...supplierInvoices].sort((a, b) => (a.invoicePosted === b.invoicePosted ? 0 : a.invoicePosted ? 1 : -1));

  const paidPayments = paymentRecords.filter(record => {
    const doc = docs.find(d => d.id === record.docId);
    return doc && doc.status === "paid";
  });
  const sortedPayments = [...paidPayments].sort((a, b) => (a.posted === b.posted ? 0 : a.posted ? 1 : -1));

  const defaultInvoiceForm = doc => ({
    supplierCode: doc.code,
    expenseAccountCode: "5100",
    bankAccount: BANK_ACCOUNTS[0],
    sstAmount: 0,
    postingDate: new Date().toISOString().slice(0, 10),
    narration: `Purchase - ${doc.party} - ${doc.ref}`,
  });

  const defaultPaymentForm = record => ({
    bankAccount: record.bankAccount || `${record.bank} Current`,
    method: record.method || PAYMENT_METHODS[0],
    paymentRef: record.paymentRef || "",
    paymentDate: record.paymentDate || new Date().toISOString().slice(0, 10),
    amount: record.amount ?? 0,
    narration: record.narration || `Payment - ${record.supplierName} - ${record.invoiceRef}`,
  });

  const invoiceForm = doc => invoiceForms[doc.id] || defaultInvoiceForm(doc);
  const paymentForm = record => paymentForms[record.id] || defaultPaymentForm(record);

  const toggleInvoice = doc => {
    const nextId = expandedInvoiceId === doc.id ? null : doc.id;
    setExpandedInvoiceId(nextId);
    setExpandedPaymentId(null);
    if (isMobile && nextId) window.scrollTo(0, 0);
    if (!invoiceForms[doc.id]) {
      setInvoiceForms(current => ({ ...current, [doc.id]: defaultInvoiceForm(doc) }));
    }
  };

  const togglePayment = record => {
    const nextId = expandedPaymentId === record.id ? null : record.id;
    setExpandedPaymentId(nextId);
    setExpandedInvoiceId(null);
    if (isMobile && nextId) window.scrollTo(0, 0);
    if (!paymentForms[record.id]) {
      setPaymentForms(current => ({ ...current, [record.id]: defaultPaymentForm(record) }));
    }
  };

  const updateInvoiceField = (doc, field, value) => {
    setInvoiceForms(current => ({ ...current, [doc.id]: { ...invoiceForm(doc), [field]: value } }));
  };

  const updatePaymentField = (record, field, value) => {
    setPaymentForms(current => ({ ...current, [record.id]: { ...paymentForm(record), [field]: value } }));
  };

  const markInvoicePosted = doc => {
    const postedAt = new Date().toISOString();
    setDocs(current => current.map(item => item.id === doc.id ? { ...item, invoicePosted: true, invoicePostedBy: "Lim Wei", invoicePostedAt: postedAt } : item));
    setPaymentRecords(current => current.map(record => record.docId === doc.id ? { ...record, posted_invoice: true } : record));
  };

  const markPaymentPosted = record => {
    const postedAt = new Date().toISOString();
    setPaymentRecords(current => current.map(item => item.id === record.id ? { ...item, posted: true, posted_payment: true, postedBy: "Lim Wei", postedAt } : item));
  };

  const viewSlip = record => {
    if (record.slipPreview) {
      window.open(record.slipPreview, "_blank");
    } else if (record.slipFile) {
      const url = URL.createObjectURL(record.slipFile);
      window.open(url, "_blank");
    } else {
      alert("No slip attached");
    }
  };

  const openInvoiceDoc = doc => setViewingDoc(doc);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Accounting sync</h1>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Review and post supplier invoices and payment entries transaction by transaction.</p>
      </div>
      <div style={{ display: "grid", gap: 24 }}>
        <section style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f5" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>TASK 1 — Post supplier invoices</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Review each approved supplier invoice before posting.</div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{postedInvoices.length} of {supplierInvoices.length} invoices posted</div>
              <div style={{ flex: 1, minWidth: 180, height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${invoiceProgress}%`, height: "100%", background: "#1a6fbd", transition: "width .25s" }} />
              </div>
            </div>
          </div>
          <div style={{ padding: "20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => { setInvoiceExported(true); setPaymentExported(false); }} style={{ padding: "11px 16px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>AutoCount XML</button>
            <button onClick={() => { setInvoiceExported(true); setPaymentExported(false); }} style={{ padding: "11px 16px", background: "#f3f4f6", color: "#111827", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>SQL Account CSV</button>
            {invoiceExported && (
              <div style={{ color: "#065F46", fontWeight: 700 }}>Invoice export ready for accounts team.</div>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Supplier code","Supplier","Invoice ref","Amount","Status"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map(doc => {
                  const isOpen = expandedInvoiceId === doc.id;
                  const form = invoiceForm(doc);
                  return (
                    <>
                      <tr key={doc.id} onClick={() => toggleInvoice(doc)} style={{ cursor: "pointer", background: doc.invoicePosted ? "#f9fafb" : "transparent", opacity: doc.invoicePosted ? 0.65 : 1, borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#111827" }}>{doc.code}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{doc.party}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827" }}>{doc.ref}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827" }}>{fmt(doc.amount)}</td>
                        <td style={{ padding: "14px 16px", color: "#065F46", fontWeight: 700 }}>{doc.invoicePosted ? "Posted ✓" : "Review"}</td>
                      </tr>
                      {isOpen && (
                        <tr key={`${doc.id}-details`}>
                          <td colSpan={5} style={{ padding: 0, background: "#f8fafc" }}>
                            <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr", gap: 16, padding: "20px 24px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div>
                                  <button onClick={() => openInvoiceDoc(doc)} style={{ padding: "10px 16px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>View document</button>
                                </div>
                                {doc.invoicePosted && (
                                  <div style={{ alignSelf: "center", fontSize: 12, color: "#065F46", fontWeight: 700, whiteSpace: "nowrap" }}>Posted ✓</div>
                                )}
                              </div>
                              <div style={{ display: "grid", gap: 14 }}>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Supplier code</label>
                                  <select value={form.supplierCode} onChange={e => updateInvoiceField(doc, "supplierCode", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }}>
                                    {supplierAccountCodes.map(ac => <option key={ac.code} value={ac.code}>{ac.code} — {ac.label}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>GL / Expense account code</label>
                                  <input value={form.expenseAccountCode} onChange={e => updateInvoiceField(doc, "expenseAccountCode", e.target.value)} placeholder="5100" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Bank account</label>
                                  <select value={form.bankAccount} onChange={e => updateInvoiceField(doc, "bankAccount", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }}>
                                    {BANK_ACCOUNTS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>SST amount</label>
                                  <input type="number" value={form.sstAmount} onChange={e => updateInvoiceField(doc, "sstAmount", Number(e.target.value))} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Posting date</label>
                                  <input type="date" value={form.postingDate} onChange={e => updateInvoiceField(doc, "postingDate", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Narration</label>
                                  <input value={form.narration} onChange={e => updateInvoiceField(doc, "narration", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                                  <button onClick={() => markInvoicePosted(doc)} disabled={doc.invoicePosted} style={{ padding: "11px 16px", background: doc.invoicePosted ? "#d1fae5" : "#1a6fbd", color: doc.invoicePosted ? "#065F46" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: doc.invoicePosted ? "default" : "pointer", opacity: doc.invoicePosted ? 0.7 : 1 }}>Post to AutoCount</button>
                                  <button onClick={() => markInvoicePosted(doc)} disabled={doc.invoicePosted} style={{ padding: "11px 16px", background: "transparent", color: doc.invoicePosted ? "#065F46" : "#1a6fbd", border: `1px solid ${doc.invoicePosted ? "#d1fae5" : "#1a6fbd"}`, borderRadius: 10, fontWeight: 700, cursor: doc.invoicePosted ? "default" : "pointer", opacity: doc.invoicePosted ? 0.7 : 1 }}>Post to SQL Account</button>
                                </div>
                                {doc.invoicePosted && (
                                  <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                                    Posted by {doc.invoicePostedBy} · {fmtDateTime(doc.invoicePostedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {supplierInvoices.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "20px", color: "#9ca3af", textAlign: "center" }}>No supplier invoices ready for posting.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section style={{ background: "#fff", border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f0f0f5" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>TASK 2 — Post payment entries (knock off creditors)</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Review each payment entry before posting to accounting.</div>
          </div>
          <div style={{ padding: "20px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => { setPaymentExported(true); setInvoiceExported(false); }} style={{ padding: "11px 16px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>AutoCount XML</button>
            <button onClick={() => { setPaymentExported(true); setInvoiceExported(false); }} style={{ padding: "11px 16px", background: "#f3f4f6", color: "#111827", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>SQL Account CSV</button>
            {paymentExported && (
              <div style={{ color: "#065F46", fontWeight: 700 }}>Payment export ready for accounts team.</div>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Supplier code","Invoice ref","Payment date","Bank","Method","Ref no","Amount","Status"].map(h => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map(record => {
                  const doc = docs.find(d => d.id === record.docId);
                  const isOpen = expandedPaymentId === record.id;
                  const form = paymentForm(record);
                  return (
                    <>
                      <tr key={record.id} onClick={() => togglePayment(record)} style={{ cursor: "pointer", background: record.posted ? "#f9fafb" : "transparent", opacity: record.posted ? 0.65 : 1, borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#111827" }}>{record.supplierCode}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{record.invoiceRef}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{fmtDate(record.paymentDate)}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{record.bank}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{form.method}</td>
                        <td style={{ padding: "14px 16px", color: "#374151" }}>{form.paymentRef}</td>
                        <td style={{ padding: "14px 16px", fontWeight: 700, color: "#111827" }}>{fmt(form.amount)}</td>
                        <td style={{ padding: "14px 16px", color: "#065F46", fontWeight: 700 }}>{record.posted ? "Posted ✓" : "Review"}</td>
                      </tr>
                      {isOpen && (
                        <tr key={`${record.id}-details`}>
                          <td colSpan={8} style={{ padding: 0, background: "#f8fafc" }}>
                            <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr", gap: 16, padding: "20px 24px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ display: "grid", gap: 8 }}>
                                  <button onClick={() => doc && setViewingDoc(doc)} style={{ padding: "10px 16px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>View invoice</button>
                                  <button onClick={() => viewSlip(record)} style={{ padding: "10px 16px", background: record.slipPreview || record.slipFile ? "#f3f4f6" : "#fde68a", color: "#111827", border: "none", borderRadius: 10, fontWeight: 700, cursor: record.slipPreview || record.slipFile ? "pointer" : "default" }}>
                                    {record.slipPreview || record.slipFile ? "View bank slip" : "No slip attached"}
                                  </button>
                                </div>
                                {record.posted && (
                                  <div style={{ alignSelf: "center", fontSize: 12, color: "#065F46", fontWeight: 700, whiteSpace: "nowrap" }}>Posted ✓</div>
                                )}
                              </div>
                              <div style={{ display: "grid", gap: 14 }}>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Bank account</label>
                                  <select value={form.bankAccount} onChange={e => updatePaymentField(record, "bankAccount", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }}>
                                    {BANK_ACCOUNTS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Payment method</label>
                                  <select value={form.method} onChange={e => updatePaymentField(record, "method", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }}>
                                    {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Payment ref</label>
                                  <input value={form.paymentRef} onChange={e => updatePaymentField(record, "paymentRef", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Payment date</label>
                                  <input type="date" value={form.paymentDate} onChange={e => updatePaymentField(record, "paymentDate", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Amount paid</label>
                                  <input type="number" value={form.amount} onChange={e => updatePaymentField(record, "amount", Number(e.target.value))} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <label style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Narration</label>
                                  <input value={form.narration} onChange={e => updatePaymentField(record, "narration", e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #e8eaf0", background: "#fff", color: "#111827" }} />
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                                  <button onClick={() => markPaymentPosted(record)} disabled={record.posted} style={{ padding: "11px 16px", background: record.posted ? "#d1fae5" : "#1a6fbd", color: record.posted ? "#065F46" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: record.posted ? "default" : "pointer", opacity: record.posted ? 0.7 : 1 }}>Post payment entry</button>
                                </div>
                                {record.posted && (
                                  <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
                                    Posted by {record.postedBy} · {fmtDateTime(record.postedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
                {paidPayments.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "20px", color: "#9ca3af", textAlign: "center" }}>No paid documents available for payment entry posting.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ background: "#f9fafb", borderRadius: 12, padding: 16, margin: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Sample payment XML format</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              &lt;Payment supplierCode="400-P001" invoiceRef="INV-2024-0892" paymentRef="TT-001" date="2024-10-18" amount="12500" bank="Maybank"/&gt;
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
'''
text = text[:idx] + new_block + text[idx2:]
path.write_text(text, encoding='utf-8')
print('replaced AccountingSync block')
