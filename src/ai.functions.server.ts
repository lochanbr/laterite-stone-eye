import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(100).max(15_000_000), // raw base64 (no data: prefix)
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

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

export type AnalysisResult = z.infer<typeof ResultSchema>;

const SYSTEM_PROMPT = `You are an expert laterite stone quality inspector with deep knowledge of construction materials, mineralogy, and civil engineering applications. Analyze the provided photograph of a laterite stone sample and produce a structured quality assessment.

Grade meaning:
- A = Excellent: dense, uniform color, minimal weathering, suitable for load-bearing structural use.
- B = Good: minor imperfections, suitable for general construction.
- C = Average: visible defects, only suitable for non-critical or filler applications.
- D = Reject: severe weathering, cracks, or porosity; not suitable for construction.

For each parameter, set status to:
- "good" when the property is favorable for construction
- "warning" when there are minor concerns
- "bad" when it is a serious defect

Be concise. Recommendations should be 3–6 short, actionable bullets about appropriate or inappropriate uses (e.g. "Suitable for load-bearing walls", "Not recommended for flooring exposed to moisture"). The summary is 2–3 sentences describing your overall verdict.

If the image clearly is not a laterite stone (or not a stone at all), still return the schema with grade "D", set every parameter status to "bad" with result "Not assessable", and put a clear note in the summary.`;

const analysisTool = {
  type: "function" as const,
  function: {
    name: "submit_laterite_analysis",
    description: "Submit the structured laterite stone quality analysis.",
    parameters: {
      type: "object",
      properties: {
        grade: { type: "string", enum: ["A", "B", "C", "D"] },
        colorUniformity: paramShape("Detected dominant color and how uniform it is"),
        surfaceTexture: paramShape("Surface texture: rough, smooth, porous, etc."),
        visibleCracks: paramShape("Crack severity: none, minor, major"),
        ironContent: paramShape("Estimated iron content: high, medium, low"),
        weatheringSigns: paramShape("Weathering signs: none, mild, severe"),
        shapeRegularity: paramShape("Shape regularity: regular, irregular"),
        porosityEstimate: paramShape("Estimated porosity: low, medium, high"),
        summary: { type: "string", description: "2–3 sentence overall verdict" },
        recommendations: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 8,
          description: "Actionable usage recommendations",
        },
      },
      required: [
        "grade",
        "colorUniformity",
        "surfaceTexture",
        "visibleCracks",
        "ironContent",
        "weatheringSigns",
        "shapeRegularity",
        "porosityEstimate",
        "summary",
        "recommendations",
      ],
      additionalProperties: false,
    },
  },
};

type LovableAIResponse = {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
    };
  }>;
};

type GoogleAIResponse = {
  candidates?: Array<{ content?: Array<{ text?: string }> }>;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  response?: {
    content?: Array<{ text?: string }>;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
};

function paramShape(description: string) {
  return {
    type: "object",
    description,
    properties: {
      result: { type: "string", description: "Short human-readable finding" },
      status: { type: "string", enum: ["good", "warning", "bad"] },
    },
    required: ["result", "status"],
    additionalProperties: false,
  };
}

function firstText(items: Array<{ text?: string }> | undefined): string | null {
  if (!items) {
    return null;
  }

  return items.find((item) => typeof item.text === "string")?.text ?? items[0]?.text ?? null;
}

function getGoogleText(response: GoogleAIResponse): string | null {
  return (
    firstText(response.candidates?.[0]?.content) ??
    firstText(response.output?.[0]?.content) ??
    firstText(response.response?.content) ??
    firstText(response.response?.output?.[0]?.content)
  );
}

export const analyzeStone = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY || import.meta.env.VITE_LOVABLE_API_KEY;
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
    if (!LOVABLE_API_KEY && !GOOGLE_API_KEY) {
      throw new Error(
        "AI service is not configured. Set LOVABLE_API_KEY or GOOGLE_API_KEY (or VITE_LOVABLE_API_KEY / VITE_GOOGLE_API_KEY).",
      );
    }

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

    if (LOVABLE_API_KEY) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this laterite stone sample and submit your assessment.",
                },
                {
                  type: "image_url",
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          tools: [analysisTool],
          tool_choice: {
            type: "function",
            function: { name: "submit_laterite_analysis" },
          },
        }),
      });

      if (response.status === 429) {
        throw new Error("Too many requests right now. Please wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error(
          "AI usage limit reached. Add credits in Lovable Cloud workspace settings to continue.",
        );
      }
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("AI gateway error", response.status, text);
        throw new Error("The AI service failed to analyze the image. Please try again.");
      }

      const json = (await response.json()) as LovableAIResponse;
      const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        console.error("No tool call in AI response", JSON.stringify(json).slice(0, 500));
        throw new Error("The AI returned an unexpected response. Please try again.");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error("The AI returned malformed data. Please try again.");
      }

      const result = ResultSchema.safeParse(parsed);
      if (!result.success) {
        console.error("AI result schema validation failed", result.error);
        throw new Error("The AI report did not match the expected format. Please try again.");
      }

      return result.data;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-pro:generateMessage?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              author: "system",
              content: [
                {
                  type: "text",
                  text: SYSTEM_PROMPT,
                },
              ],
            },
            {
              author: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this laterite stone sample and submit your assessment as valid JSON only. Use the exact schema keys: grade, colorUniformity, surfaceTexture, visibleCracks, ironContent, weatheringSigns, shapeRegularity, porosityEstimate, summary, recommendations. Do not include any extra text outside the JSON object.`,
                },
                {
                  type: "image",
                  imageUri: dataUrl,
                },
              ],
            },
          ],
          temperature: 0.2,
          maxOutputTokens: 1200,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Google AI error", response.status, text);
      throw new Error("The AI service failed to analyze the image. Please try again.");
    }

    const googleResponse = (await response.json()) as GoogleAIResponse;
    const outputText = getGoogleText(googleResponse);

    if (!outputText) {
      console.error("No text output from Google AI", JSON.stringify(googleResponse).slice(0, 500));
      throw new Error("The AI returned an unexpected response. Please try again.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      console.error("Failed to parse AI JSON output", error, outputText);
      throw new Error("The AI returned malformed data. Please try again.");
    }

    const result = ResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("AI result schema validation failed", result.error, outputText);
      throw new Error("The AI report did not match the expected format. Please try again.");
    }

    return result.data;
  });
