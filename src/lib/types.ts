export type ParameterStatus = "good" | "warning" | "bad";
export type Grade = "A" | "B" | "C" | "D";

export interface Parameter {
  result: string;
  status: ParameterStatus;
}

export interface AnalysisResult {
  grade: Grade;
  colorUniformity: Parameter;
  surfaceTexture: Parameter;
  visibleCracks: Parameter;
  ironContent: Parameter;
  weatheringSigns: Parameter;
  shapeRegularity: Parameter;
  porosityEstimate: Parameter;
  summary: string;
  recommendations: string[];
}

export const PARAMETER_LABELS: Record<keyof Omit<AnalysisResult, "grade" | "summary" | "recommendations">, string> = {
  colorUniformity: "Color Uniformity",
  surfaceTexture: "Surface Texture",
  visibleCracks: "Visible Cracks",
  ironContent: "Iron Content Estimate",
  weatheringSigns: "Weathering Signs",
  shapeRegularity: "Shape Regularity",
  porosityEstimate: "Porosity Estimate",
};

export const GRADE_META: Record<Grade, { label: string; tone: string; bg: string; text: string }> = {
  A: { label: "Excellent", tone: "grade-a", bg: "bg-grade-a/15", text: "text-grade-a" },
  B: { label: "Good", tone: "grade-b", bg: "bg-grade-b/15", text: "text-grade-b" },
  C: { label: "Average", tone: "grade-c", bg: "bg-grade-c/15", text: "text-grade-c" },
  D: { label: "Reject", tone: "grade-d", bg: "bg-grade-d/15", text: "text-grade-d" },
};
