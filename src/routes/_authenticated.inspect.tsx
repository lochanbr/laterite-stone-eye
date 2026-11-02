import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { analyzeStone } from "@/ai.functions.server";
import { UploadZone } from "@/components/site/UploadZone";
import { ResultsPanel } from "@/components/site/ResultsPanel";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/types";
import { fileToBase64, getImageFileError, urlToFile } from "@/lib/image";

const SAMPLE_URL =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

export const Route = createFileRoute("/_authenticated/inspect")({
  head: () => ({
    meta: [
      { title: "Inspect — LateriteIQ" },
      {
        name: "description",
        content: "Upload a laterite stone photo and get an instant AI quality report.",
      },
    ],
  }),
  component: InspectPage,
});

function InspectPage() {
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeStone);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleFile = (f: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setFile(f);
    setPreviewUrl(null);
    setResult(null);
    setCreatedAt(null);
    setImageDataUrl(null);
    if (f) {
      const url = URL.createObjectURL(f);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    }
  };

  const useSample = async () => {
    try {
      const f = await urlToFile(SAMPLE_URL, "sample-stone.jpg");
      handleFile(f);
    } catch {
      toast.error("Could not load sample image.");
    }
  };

  const analyze = async () => {
    if (!file || analyzing) return;

    const fileError = getImageFileError(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setAnalyzing(true);
    setResult(null);
    try {
      const { base64, mimeType, dataUrl, blob } = await fileToBase64(file);
      setImageDataUrl(dataUrl);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error("Could not verify your account. Please try again.");
      const userId = userData.user?.id;
      const ai: AnalysisResult = await analyzeFn({ data: { imageBase64: base64, mimeType } });

      const now = new Date();
      setResult(ai);
      setCreatedAt(now);

      if (userId) {
        const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        const uploadPath = `${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("inspection-images")
          .upload(uploadPath, blob, { contentType: mimeType, upsert: false });

        if (uploadError) {
          toast.error("Analysis complete, but the image could not be saved to your history.");
          return;
        }

        const { error: insErr } = await supabase.from("inspections").insert({
          user_id: userId,
          image_path: uploadPath,
          grade: ai.grade,
          result: JSON.parse(JSON.stringify(ai)),
        });
        if (insErr) {
          const { error: cleanupError } = await supabase.storage
            .from("inspection-images")
            .remove([uploadPath]);
          toast.error(
            cleanupError
              ? "Analysis complete, but saving failed and the uploaded image could not be cleaned up."
              : "Analysis complete, but the report could not be saved to your history.",
          );
          return;
        }
      }

      toast.success(userId ? "Analysis complete and saved to history." : "Analysis complete.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to analyze the image.";
      if (msg.includes("authentication failed") || msg.includes("Check GOOGLE_API_KEY")) {
        toast.error("AI service is not properly configured. Contact support.");
      } else if (msg.includes("access denied")) {
        toast.error("AI service access denied. Verify the API key is active.");
      } else if (msg.includes("rate limit")) {
        toast.error("AI service rate limit reached. Please wait and try again.");
      } else if (msg.includes("account")) {
        toast.error(msg);
      } else {
        toast.error(
          msg || "Unable to analyze this image. Make sure it's a clear photo of a laterite stone.",
        );
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">New Inspection</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a clear photo of a laterite stone sample to get an instant quality report.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <UploadZone
            file={file}
            previewUrl={previewUrl}
            onFile={handleFile}
            onUseSample={useSample}
            disabled={analyzing}
          />
          <Button size="lg" className="w-full" disabled={!file || analyzing} onClick={analyze}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Analyze Stone
              </>
            )}
          </Button>
        </div>

        <div>
          {analyzing && <AnalyzingSkeleton />}
          {!analyzing && result && createdAt && (
            <ResultsPanel result={result} imageDataUrl={imageDataUrl} createdAt={createdAt} />
          )}
          {!analyzing && !result && (
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">Your quality report will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={() => navigate({ to: "/history" })}>
            View inspection history
          </Button>
        </div>
      )}
    </main>
  );
}

function AnalyzingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="my-3 h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">
        <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Inspecting your stone…
      </div>
    </div>
  );
}
