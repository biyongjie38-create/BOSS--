import { z } from "zod";

import { AppError } from "./errors";
import type { AnalysisResult } from "./types";

export const analysisSchema = z
  .object({
    summary: z.string().trim().min(1),
    sentiment: z.enum(["Bullish", "Neutral", "Bearish"]),
    risk_level: z.enum(["Low", "Medium", "High"])
  })
  .strict();

export function parseAnalysisJson(raw: string): AnalysisResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("INVALID_LLM_JSON", "LLM did not return valid JSON.", 502);
  }

  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError("INVALID_LLM_JSON", "LLM JSON did not match the required schema.", 502);
  }

  return result.data;
}
