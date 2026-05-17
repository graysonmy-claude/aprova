import { useState, useRef } from "react";
import { processAndUpload, checkDuplicate, validateFile } from "../lib/uploadUtils";

export default function Upload({ companyId = 1, docs = [], setDocs = () => {} }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const fileRef = useRef();

  function onPick(e) {
    const f = e.target.files?.[0];
    handleFileSelected(f);
  }

  function handleFileSelected(f) {
    setError(null);
    setCompressionInfo(null);
    setDuplicates([]);
    if (!f) return;

    const v = validateFile(f);
    if (!v.valid) {
      setError(v.error);
      return;
    }

    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!file) return setError("Choose a file first");
    setProcessing(true);
    setError(null);

    try {
      // Try to detect duplicates using a light heuristic: attempt to extract party/amount/date
      // For demo we pass minimal metadata — real app should extract via OCR.
      const meta = { partyName: "", amount: 0, subtype: "", date: new Date().toISOString() };

      const dup = await checkDuplicate(companyId, meta);
      if (dup.isDuplicate) setDuplicates(dup.matches);

      const result = await processAndUpload(file, companyId);

      // Update UI state
      setCompressionInfo(result.compressionInfo || null);

      // Add to docs list (lightweight client-side representation)
      const newDoc = {
        id: docs.length + 1,
        type: "supplier",
        subtype: "Invoice",
        ref: `UP-${Date.now()}`,
        party: meta.partyName || "Unknown",
        amount: meta.amount || 0,
        code: "",
        status: "pending",
        date: new Date().toISOString().slice(0, 10),
        uploader: "You",
        url: result.publicUrl,
      };

      setDocs(d => [newDoc, ...d]);
      setFile(null);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      setError(err.message || String(err));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 640 }}>
      <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16 }}>Upload document</div>

      <div
        style={{
          border: "2px dashed #e6eefc",
          borderRadius: 8,
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: "#fff",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>Choose a file (JPG, PNG, WebP, PDF)</div>
          <input ref={fileRef} type="file" onChange={onPick} style={{ display: "block" }} />
          {error && <div style={{ color: "#991b1b", marginTop: 8 }}>{error}</div>}
        </div>

        <div style={{ width: 120, textAlign: "center" }}>
          {preview ? (
            <img src={preview} alt="preview" style={{ width: 100, height: 80, objectFit: "cover", borderRadius: 6 }} />
          ) : (
            <div style={{ width: 100, height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", borderRadius: 6, background: "#f8fafc" }}>No preview</div>
          )}
        </div>
      </div>

      {compressionInfo && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#374151" }}>
          Compressed: {compressionInfo.originalSizeKB}KB → {compressionInfo.compressedSizeKB}KB ({compressionInfo.savedPercent}% saved)
        </div>
      )}

      {duplicates && duplicates.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#92400E" }}>
          Possible duplicates found: {duplicates.length}
          <ul style={{ marginTop: 6 }}>
            {duplicates.map(d => (
              <li key={d.id} style={{ fontSize: 12 }}>{d.ref} · {d.party_name} · RM {d.amount}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={handleUpload} disabled={processing || !file} style={{ padding: "8px 12px", background: "#1a6fbd", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          {processing ? "Processing…" : "Upload"}
        </button>
        <button onClick={() => { setFile(null); setPreview(null); setError(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ padding: "8px 12px", background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer" }}>Reset</button>
      </div>
    </div>
  );
}
