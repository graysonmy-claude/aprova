export async function extractDocumentFields(file, docType) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Gemini OCR] API key is missing — check VITE_GEMINI_API_KEY in .env");
    return {};
  }

  const isPdf = file.type === "application/pdf";
  if (isPdf) {
    console.log("[Gemini OCR] PDF file detected; skipping OCR and requesting manual fill.");
    return {};
  }

  const base64 = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = docType === "supplier"
    ? `You are an OCR system. Extract data from this Malaysian invoice or receipt image.
Return ONLY a JSON object with these exact keys (use null if not found):
{
  "supplier_name": "string",
  "invoice_number": "string",
  "invoice_date": "string (DD/MM/YYYY format)",
  "total_amount": 0.00,
  "sst_amount": 0.00,
  "currency": "MYR"
}
No markdown, no explanation, just the JSON object.`
    : `You are an OCR system. Extract data from this receipt image.
Return ONLY valid JSON with these exact keys (use null if not found):
{
  "merchant_name": "string",
  "receipt_date": "string",
  "total_amount": 0.00,
  "receipt_number": "string",
  "payment_method": "string"
}
No markdown, no explanation, just the JSON object.`;

  // Only use current supported models
  const models = ["gemini-1.5-flash-8b", "gemini-1.5-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log(`[Gemini OCR] Trying model: ${model}`);

      const response = await fetch(url, {
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
      });

      const responseText = await response.text();
      console.log(`[Gemini OCR] model=${model} status=${response.status}`);

      if (!response.ok) {
        console.warn(`[Gemini OCR] ${model} failed:`, responseText);
        continue;
      }

      const data = JSON.parse(responseText);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log("[Gemini OCR] raw text:", rawText);

      const clean = rawText.replace(/```json|```/g, "").trim();
      if (!clean || clean === "{}") continue;

      try {
        const parsed = JSON.parse(clean);
        console.log("[Gemini OCR] success:", parsed);
        return parsed;
      } catch (e) {
        console.error("[Gemini OCR] JSON parse error:", e, "raw:", clean);
        continue;
      }

    } catch (err) {
      console.error(`[Gemini OCR] Network error on ${model}:`, err);
      continue;
    }
  }

  console.error("[Gemini OCR] All models failed");
  return {};
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}