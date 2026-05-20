export async function extractDocumentFields(file, docType) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isPdf = file.type === "application/pdf";
  if (isPdf) {
    console.log("[Gemini OCR] PDF file detected; skipping OCR and requesting manual fill.");
    return {};
  }

  const base64 = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = docType === "supplier"
    ? `You are an OCR system. Extract data from this Malaysian invoice or receipt image.\nReturn ONLY a JSON object with these exact keys (use null if not found):\n{\n  supplier_name: string,\n  invoice_number: string,\n  invoice_date: string (DD/MM/YYYY format),\n  total_amount: number (digits only, no RM symbol),\n  sst_amount: number (digits only, 0 if none),\n  currency: string (default MYR)\n}\nNo markdown, no explanation, just the JSON object.`
    : `You are an OCR system. Extract data from this receipt image.\nReturn ONLY valid JSON with these exact keys (use null if not found):\n{\n  merchant_name: string,\n  receipt_date: string,\n  total_amount: number,\n  receipt_number: string,\n  payment_method: string\n}\nNo markdown, no explanation, just the JSON object.`;

  const models = ["gemini-1.5-flash-latest", "gemini-pro-vision"];
  let lastErrorBody = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
    console.log("[Gemini OCR] body:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("[Gemini OCR] response JSON parse failed", error);
      lastErrorBody = responseText;
      continue;
    }

    if (!response.ok) {
      lastErrorBody = responseText;
      continue;
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    console.log("[Gemini OCR] raw text:", rawText);

    const clean = rawText.replace(/```json|```/g, "").trim();
    if (!clean || clean === "{}") {
      lastErrorBody = responseText;
      continue;
    }

    try {
      return JSON.parse(clean);
    } catch (error) {
      console.error("[Gemini OCR] JSON parse error", error, "clean text:", clean);
      lastErrorBody = clean;
      continue;
    }
  }

  console.error("[Gemini OCR] All models failed or returned invalid output", lastErrorBody);
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
