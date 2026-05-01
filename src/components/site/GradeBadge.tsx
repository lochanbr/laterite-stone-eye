import { motion } from "framer-motion";
import { GRADE_META, type Grade } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLOR: Record<Grade, string> = {
  A: "bg-grade-a text-background",
  B: "bg-grade-b text-background",
  C: "bg-grade-c text-background",
  D: "bg-grade-d text-background",
};

export function GradeBadge({ grade, size = "lg" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const meta = GRADE_META[grade];
  const dims =
    size === "lg"
      ? "h-32 w-32 text-7xl"
      : size === "md"
        ? "h-20 w-20 text-4xl"
        : "h-12 w-12 text-2xl";
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl font-display shadow-xl",
        COLOR[grade],
        dims,
      )}
    >
      <span className="leading-none">{grade}</span>
      {size !== "sm" && (
        <span className="mt-1 text-xs font-sans uppercase tracking-widest opacity-90">
          {meta.label}
        </span>
      )}
    </motion.div>
  );
}
