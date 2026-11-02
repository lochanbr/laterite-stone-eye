import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ResultsPanel } from "@/components/site/ResultsPanel";
import type { AnalysisResult } from "@/lib/types";
import { ResultSchema } from "@/lib/analysis-schema";
import { blobToDataUrl } from "@/lib/image";

export const Route = createFileRoute("/_authenticated/inspect/$id")({
  head: () => ({
    meta: [{ title: "Inspection report — LateriteIQ" }],
  }),
  component: InspectionDetail,
});

function InspectionDetail() {
  const { id } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResult(null);
    setImageUrl(null);
    setImageDataUrl(null);
    setCreatedAt(null);

    const loadInspection = async () => {
      try {
        const { data, error } = await supabase
          .from("inspections")
          .select("id,created_at,result,image_path")
          .eq("id", id)
          .maybeSingle();
        if (error || !data) throw new Error("Could not load inspection.");

        const parsedResult = ResultSchema.safeParse(data.result);
        if (!parsedResult.success) throw new Error("This inspection report contains invalid data.");

        const { data: signed, error: signedError } = await supabase.storage
          .from("inspection-images")
          .createSignedUrl(data.image_path, 60 * 60);
        if (signedError) {
          toast.error("Report loaded, but its image could not be loaded.");
        }

        const url = signed?.signedUrl ?? null;
        let dataUrl: string | null = null;
        if (url) {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Image request failed (${response.status}).`);
            dataUrl = await blobToDataUrl(await response.blob());
          } catch {
            toast.error("Report loaded, but its image could not be prepared for the PDF.");
          }
        }

        if (cancelled) return;
        setResult(parsedResult.data);
        setCreatedAt(new Date(data.created_at));
        setImageUrl(url);
        setImageDataUrl(dataUrl);
      } catch (error: unknown) {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "Could not load inspection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadInspection();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Link
        to="/history"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to history
      </Link>

      {loading && <div className="h-64 animate-pulse rounded-xl bg-card" />}

      {!loading && result && createdAt && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Inspected stone"
                className="w-full rounded-2xl border border-border object-contain"
              />
            ) : (
              <div className="aspect-square w-full rounded-2xl bg-muted" />
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Inspected on {createdAt.toLocaleString()}
            </p>
          </div>
          <ResultsPanel result={result} imageDataUrl={imageDataUrl} createdAt={createdAt} />
        </div>
      )}

      {!loading && !result && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p>This inspection could not be found.</p>
          <Link to="/history" className="mt-4 inline-block">
            <Button variant="outline">Back to history</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
