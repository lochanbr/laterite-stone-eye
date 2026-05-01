import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ResultsPanel } from "@/components/site/ResultsPanel";
import type { AnalysisResult } from "@/lib/types";

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
    (async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select("id,created_at,result,image_path")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load inspection.");
        setLoading(false);
        return;
      }
      setResult(data.result as unknown as AnalysisResult);
      setCreatedAt(new Date(data.created_at));
      const { data: signed } = await supabase.storage
        .from("inspection-images")
        .createSignedUrl(data.image_path, 60 * 60);
      const url = signed?.signedUrl ?? null;
      setImageUrl(url);
      // Convert image to data URL for PDF embedding
      if (url) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onload = () => setImageDataUrl(reader.result as string);
          reader.readAsDataURL(blob);
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    })();
  }, [id]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <Link to="/history" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
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
