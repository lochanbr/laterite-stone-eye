export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export function getImageFileError(file: File): string | null {
  if (!IMAGE_MIME_TYPES.some((mimeType) => mimeType === file.type)) {
    return "Please upload a JPG, PNG, or WEBP image.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 10 MB.";
  }
  return null;
}

export async function fileToBase64(
  file: File,
  maxDim = 1600,
): Promise<{
  base64: string;
  mimeType: ImageMimeType;
  dataUrl: string;
  blob: Blob;
}> {
  const fileError = getImageFileError(file);
  if (fileError) throw new Error(fileError);
  if (!Number.isFinite(maxDim) || maxDim <= 0) {
    throw new Error("Image dimensions must be a positive number.");
  }

  const mimeType = IMAGE_MIME_TYPES.find((type) => type === file.type);
  if (!mimeType) throw new Error("Please upload a JPG, PNG, or WEBP image.");

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

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image data."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export async function urlToFile(url: string, filename = "sample.jpg"): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load sample image (${res.status}).`);
  }
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
  const fileError = getImageFileError(file);
  if (fileError) throw new Error(fileError);
  return file;
}
