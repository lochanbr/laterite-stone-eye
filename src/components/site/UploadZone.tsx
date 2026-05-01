import { useCallback, useRef, useState } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  file: File | null;
  previewUrl: string | null;
  onFile: (f: File | null) => void;
  onUseSample: () => void;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

export function UploadZone({ file, previewUrl, onFile, onUseSample, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(
    (f: File | undefined | null) => {
      setError(null);
      if (!f) return;
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        setError("Please upload a JPG, PNG, or WEBP image.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("Image must be smaller than 10 MB.");
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  if (file && previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <img src={previewUrl} alt="Uploaded stone" className="max-h-[420px] w-full object-contain" />
        {!disabled && (
          <button
            type="button"
            onClick={() => onFile(null)}
            className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-foreground backdrop-blur transition hover:bg-background"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card/40 p-8 text-center transition",
          drag
            ? "border-primary bg-primary/5 shadow-[0_0_40px_-10px_var(--terracotta-glow)]"
            : "border-border hover:border-primary hover:shadow-[0_0_40px_-15px_var(--terracotta-glow)]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <div className="rounded-full bg-primary/10 p-4 transition group-hover:bg-primary/20">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-4 font-display text-2xl tracking-wide">Drop a stone photo here</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse — JPG, PNG, WEBP up to 10 MB
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={onUseSample} disabled={disabled}>
          <ImageIcon className="mr-2 h-4 w-4" /> Use sample image
        </Button>
      </div>
    </div>
  );
}
