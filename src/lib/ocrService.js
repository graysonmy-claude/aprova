export async function extractDocumentFields(file, docType) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const base64 = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = docType === "supplier"
    ? "Extract from this invoice/document: supplier_name, invoice_number, invoice_date, due_date, total_amount, sst_amount, currency. Return ONLY valid JSON with these exact keys. Use null for missing fields."
    : "Extract from this receipt/claim: merchant_name, receipt_date, total_amount, receipt_number, payment_method. Return ONLY valid JSON with these exact keys. Use null for missing fields.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } }
          ]
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
