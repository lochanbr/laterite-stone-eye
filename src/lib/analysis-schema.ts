import { z } from "zod";

const ParameterSchema = z.object({
  result: z.string(),
  status: z.enum(["good", "warning", "bad"]),
});

export const ResultSchema = z.object({
  grade: z.enum(["A", "B", "C", "D"]),
  colorUniformity: ParameterSchema,
  surfaceTexture: ParameterSchema,
  visibleCracks: ParameterSchema,
  ironContent: ParameterSchema,
  weatheringSigns: ParameterSchema,
  shapeRegularity: ParameterSchema,
  porosityEstimate: ParameterSchema,
  summary: z.string(),
  recommendations: z.array(z.string()).min(1).max(8),
});
