import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, Search, FileText, Mountain, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LateriteIQ — AI-Powered Laterite Stone Quality Inspector" },
      {
        name: "description",
        content:
          "Upload a photo. Get an instant AI quality report on your laterite stone sample in seconds — grade, defects, and usage recommendations.",
      },
      { property: "og:title", content: "LateriteIQ — AI Laterite Stone Inspector" },
      {
        property: "og:description",
        content: "Instant AI-powered quality reports for laterite stone samples.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero */}
        <section className="grain relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--terracotta-glow)/20%,_transparent_60%)]"
          />
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 md:py-36">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mx-auto max-w-3xl text-center"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
                <Mountain className="h-3.5 w-3.5 text-primary" /> AI Quality Inspection
              </div>
              <h1 className="font-display text-5xl leading-[0.95] tracking-wide sm:text-7xl md:text-8xl">
                AI-Powered <span className="text-primary">Laterite Stone</span> Quality Inspector
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                Upload a photo. Get an instant quality report in seconds.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/inspect">
                  <Button size="lg" className="text-base">
                    Start Inspection <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            <Feature
              icon={<Search className="h-6 w-6" />}
              title="Instant Analysis"
              text="Vision AI evaluates color, texture, cracks, iron content, and more in seconds."
            />
            <Feature
              icon={<Mountain className="h-6 w-6" />}
              title="Defect Detection"
              text="Spot weathering, porosity, and structural issues before they reach the site."
            />
            <Feature
              icon={<FileText className="h-6 w-6" />}
              title="Grade Report"
              text="Get a clear A–D grade with recommendations and a downloadable PDF."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center font-display text-4xl tracking-wide sm:text-5xl">
              How It Works
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <Step n={1} icon={<Upload className="h-7 w-7" />} title="Upload" text="Drop in a clear photo of your stone sample." />
              <Step n={2} icon={<Search className="h-7 w-7" />} title="Analyze" text="Our AI inspects it against 7 quality parameters." />
              <Step n={3} icon={<FileText className="h-7 w-7" />} title="Report" text="Receive a graded report you can save or download." />
            </div>
            <div className="mt-12 text-center">
              <Link to="/inspect">
                <Button size="lg">Try It Free <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LateriteIQ
        </footer>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/60">
      <div className="inline-flex rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-2xl tracking-wide">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Step({ n, icon, title, text }: { n: number; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Step {n}</div>
      <h4 className="mt-1 font-display text-2xl tracking-wide">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
