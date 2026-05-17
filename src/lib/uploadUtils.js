// ============================================================
//  Aprova — Upload utilities
//  Place this file at: src/lib/uploadUtils.js
// ============================================================

import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────────
// 1. IMAGE COMPRESSION
//    Compresses JPG/PNG before upload using Canvas API
//    Target: max 800KB, quality 80%
// ─────────────────────────────────────────────────────────────
export async function compressImage(file, options = {}) {
  const {
    maxWidthOrHeight = 1920,
    quality = 0.8,
    maxSizeKB = 800,
  } = options;

  // Only compress images, not PDFs
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions keeping aspect ratio
      let { width, height } = img;
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Try compressing at decreasing quality until under maxSizeKB
      let currentQuality = quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));

            const sizeKB = blob.size / 1024;

            if (sizeKB > maxSizeKB && currentQuality > 0.3) {
              currentQuality -= 0.1;
              tryCompress();
            } else {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            }
          },
          "image/jpeg",
          currentQuality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────
// 2. FILE VALIDATION
//    Check file type and size before processing
// ─────────────────────────────────────────────────────────────
export function validateFile(file) {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const MAX_PDF_SIZE_MB = 5;
  const MAX_IMAGE_SIZE_MB = 10; // before compression

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, WebP and PDF files are allowed." };
  }

  if (file.type === "application/pdf") {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_PDF_SIZE_MB) {
      return { valid: false, error: `PDF is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_PDF_SIZE_MB}MB.` };
    }
  }

  if (file.type.startsWith("image/")) {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      return { valid: false, error: `Image is too large (${sizeMB.toFixed(1)}MB). Maximum size is ${MAX_IMAGE_SIZE_MB}MB.` };
    }
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 3. DUPLICATE DETECTION
//    Check if a similar document already exists in the company
// ─────────────────────────────────────────────────────────────
export async function checkDuplicate(companyId, { partyName, amount, subtype, date }) {
  // Look for docs within 7 days of the given date
  const dateObj  = date ? new Date(date) : new Date();
  const dateMinus7 = new Date(dateObj);
  const datePlus7  = new Date(dateObj);
  dateMinus7.setDate(dateMinus7.getDate() - 7);
  datePlus7.setDate(datePlus7.getDate() + 7);

  const { data, error } = await supabase
    .from("documents")
    .select("id, ref_number, party_name, amount, status, created_at")
    .eq("company_id", companyId)
    .eq("subtype", subtype)
    .gte("amount", amount * 0.99)   // within 1% of amount (handle rounding)
    .lte("amount", amount * 1.01)
    .gte("created_at", dateMinus7.toISOString())
    .lte("created_at", datePlus7.toISOString())
    .ilike("party_name", `%${partyName.split(" ")[0]}%`) // match first word of name
    .not("status", "eq", "rejected"); // ignore rejected docs

  if (error) {
    console.error("Duplicate check error:", error);
    return { isDuplicate: false, matches: [] };
  }

  return {
    isDuplicate: data && data.length > 0,
    matches: data || [],
  };
}

// ─────────────────────────────────────────────────────────────
// 4. PROCESS & UPLOAD FILE
//    Compress image → validate → upload to Supabase Storage
// ─────────────────────────────────────────────────────────────
export async function processAndUpload(file, companyId) {
  // Step 1: Validate
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  // Step 2: Compress if image
  let processedFile = file;
  let compressionInfo = null;

  if (file.type.startsWith("image/")) {
    const originalSizeKB = Math.round(file.size / 1024);
    processedFile = await compressImage(file);
    const compressedSizeKB = Math.round(processedFile.size / 1024);
    compressionInfo = {
      originalSizeKB,
      compressedSizeKB,
      savedPercent: Math.round((1 - compressedSizeKB / originalSizeKB) * 100),
    };
  }

  // Step 3: Upload to Supabase Storage
  const ext      = processedFile.type === "application/pdf" ? "pdf" : "jpg";
  const filePath = `${companyId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, processedFile, {
      contentType: processedFile.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Step 4: Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  return {
    filePath,
    publicUrl,
    fileName: file.name,
    fileSizeBytes: processedFile.size,
    compressionInfo,
  };
}

// ─────────────────────────────────────────────────────────────
// 5. GET SIGNED URL (for private bucket access)
//    Generates a temporary URL valid for 1 hour
// ─────────────────────────────────────────────────────────────
export async function getSignedUrl(filePath, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}