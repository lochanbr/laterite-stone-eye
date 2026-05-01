/** Convert a File to base64 (no data: prefix) and return mime + dataUrl too. */
export async function fileToBase64(file: File, maxDim = 1600): Promise<{
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  dataUrl: string;
  blob: Blob;
}> {
  const mimeType = (["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ? file.type
    : "image/jpeg") as "image/jpeg" | "image/png" | "image/webp";

  // Resize large images via canvas to keep payloads small.
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.drawImage(img, 0, 0, w, h);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))),
        mimeType,
        0.9,
      ),
    );
    const dataUrl = await blobToDataUrl(blob);
    const base64 = dataUrl.split(",")[1] ?? "";
    return { base64, mimeType, dataUrl, blob };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export async function urlToFile(url: string, filename = "sample.jpg"): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
}
