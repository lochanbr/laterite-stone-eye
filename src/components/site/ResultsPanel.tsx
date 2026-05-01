import { motion } from "framer-motion";
import { Check, AlertTriangle, X, Download } from "lucide-react";
import { GradeBadge } from "./GradeBadge";
import { Button } from "@/components/ui/button";
import { PARAMETER_LABELS, type AnalysisResult, type ParameterStatus } from "@/lib/types";
import { downloadReportPdf } from "@/lib/pdf";

const STATUS_ICON: Record<ParameterStatus, React.ReactNode> = {
  good: <Check className="h-5 w-5 text-status-good" />,
  warning: <AlertTriangle className="h-5 w-5 text-status-warning" />,
  bad: <X className="h-5 w-5 text-status-bad" />,
};

const STATUS_BORDER: Record<ParameterStatus, string> = {
  good: "border-l-status-good",
  warning: "border-l-status-warning",
  bad: "border-l-status-bad",
};

interface Props {
  result: AnalysisResult;
  imageDataUrl: string | null;
  createdAt: Date;
}

export function ResultsPanel({ result, imageDataUrl, createdAt }: Props) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="space-y-6"
    >
      <Item>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
          <GradeBadge grade={result.grade} />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display text-3xl tracking-wide">Quality Grade</h3>
            <p className="mt-2 text-muted-foreground">{result.summary}</p>
          </div>
        </div>
      </Item>

      <Item>
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h4 className="font-display text-xl tracking-wide">Quality Parameters</h4>
          </div>
          <ul className="divide-y divide-border">
            {(Object.keys(PARAMETER_LABELS) as Array<keyof typeof PARAMETER_LABELS>).map((key) => {
              const param = (result as any)[key] as { result: string; status: ParameterStatus };
              return (
                <li
                  key={key}
                  className={`flex items-center justify-between gap-4 border-l-4 px-5 py-3 ${STATUS_BORDER[param.status]}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{PARAMETER_LABELS[key]}</div>
                    <div className="truncate text-sm text-muted-foreground">{param.result}</div>
                  </div>
                  <div className="shrink-0">{STATUS_ICON[param.status]}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </Item>

      <Item>
        <div className="rounded-xl border border-border bg-card p-5">
          <h4 className="font-display text-xl tracking-wide">Recommendations</h4>
          <ul className="mt-3 space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </Item>

      <Item>
        <Button
          onClick={() => downloadReportPdf(result, imageDataUrl, createdAt)}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" /> Download PDF Report
        </Button>
      </Item>
    </motion.div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
    >
      {children}
    </motion.div>
  );
}
