import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getImageFileError } from "@/lib/image";

interface Props {
  file: File | null;
  previewUrl: string | null;
  onFile: (f: File | null) => void;
  onUseSample: () => void;
  disabled?: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export function UploadZone({ file, previewUrl, onFile, onUseSample, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(
    (f: File | undefined | null) => {
      if (disabled) return;
      setError(null);
      if (!f) return;
      const fileError = getImageFileError(f);
      if (fileError) {
        setError(fileError);
        return;
      }
      onFile(f);
    },
    [disabled, onFile],
  );

  const openFilePicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openFilePicker();
  };

  if (file && previewUrl) {
    return (
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={previewUrl}
            alt="Uploaded stone"
            className="max-h-[420px] w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                onFile(null);
              }}
              className="absolute right-3 top-3 rounded-full bg-background/80 p-2 text-foreground backdrop-blur transition hover:bg-background"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {error && (
          <p id="upload-error" role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        role="button"
        aria-disabled={disabled}
        aria-describedby={error ? "upload-error" : undefined}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group relative flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card/40 p-8 text-center transition",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
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
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <div className="rounded-full bg-primary/10 p-4 transition group-hover:bg-primary/20">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-4 font-display text-2xl tracking-wide">Drop a stone photo here</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse — JPG, PNG, WEBP up to 10 MB
        </p>
      </div>
      {error && (
        <p id="upload-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={onUseSample} disabled={disabled}>
          <ImageIcon className="mr-2 h-4 w-4" /> Use sample image
        </Button>
      </div>
    </div>
  );
}
