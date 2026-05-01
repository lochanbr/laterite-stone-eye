import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GradeBadge } from "@/components/site/GradeBadge";
import type { Grade } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — LateriteIQ" },
      { name: "description", content: "Your past laterite stone inspections." },
    ],
  }),
  component: HistoryPage,
});

interface Row {
  id: string;
  created_at: string;
  grade: Grade;
  image_path: string;
  result: { summary?: string };
  thumbUrl?: string;
}

function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("inspections")
      .select("id,created_at,grade,image_path,result")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    const withThumbs = await Promise.all(
      (data ?? []).map(async (r: any) => {
        const { data: signed } = await supabase.storage
          .from("inspection-images")
          .createSignedUrl(r.image_path, 60 * 60);
        return { ...r, thumbUrl: signed?.signedUrl } as Row;
      }),
    );
    setRows(withThumbs);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (row: Row) => {
    if (!confirm("Delete this inspection?")) return;
    await supabase.storage.from("inspection-images").remove([row.image_path]);
    const { error } = await supabase.from("inspections").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) => r?.filter((x) => x.id !== row.id) ?? null);
    toast.success("Inspection deleted");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your past inspections.</p>
        </div>
        <Link to="/inspect">
          <Button>
            <Camera className="mr-2 h-4 w-4" /> New inspection
          </Button>
        </Link>
      </div>

      {rows === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <h3 className="font-display text-2xl tracking-wide">No inspections yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Run your first inspection to see it here.
          </p>
          <Link to="/inspect" className="mt-6 inline-block">
            <Button>Start your first inspection</Button>
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60"
            >
              <Link to="/inspect/$id" params={{ id: r.id }} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {r.thumbUrl ? (
                    <img
                      src={r.thumbUrl}
                      alt="Inspected stone"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute right-3 top-3">
                    <GradeBadge grade={r.grade} size="sm" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">
                    {r.result?.summary ?? "Inspection report"}
                  </p>
                </div>
              </Link>
              <div className="flex justify-end border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(r)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
