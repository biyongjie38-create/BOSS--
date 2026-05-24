import { AppError } from "./errors";
import type { AnalysisResult, AnalyzeResponse, QuotePayload } from "./types";

type AnalyzeDependencies = {
  getQuote: (symbol: string) => Promise<QuotePayload>;
  analyzeQuote: (symbol: string, quote: QuotePayload) => Promise<AnalysisResult>;
  saveRecord: (symbol: string, quote: QuotePayload, analysis: AnalysisResult) => Promise<void>;
};

export function normalizeSymbol(symbol: unknown): string {
  if (typeof symbol !== "string" || symbol.trim().length === 0) {
    throw new AppError("MISSING_SYMBOL", "Please enter a stock symbol.", 400);
  }

  const normalized = symbol.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,16}$/.test(normalized)) {
    throw new AppError(
      "MISSING_SYMBOL",
      "Stock symbol can only contain letters, numbers, dots, and dashes.",
      400
    );
  }

  return normalized;
}

export async function analyzeStock(
  rawSymbol: unknown,
  dependencies: AnalyzeDependencies
): Promise<AnalyzeResponse> {
  const symbol = normalizeSymbol(rawSymbol);
  const quote = await dependencies.getQuote(symbol);
  const analysis = await dependencies.analyzeQuote(symbol, quote);

  try {
    await dependencies.saveRecord(symbol, quote, analysis);
  } catch {
    throw new AppError("SUPABASE_SAVE_ERROR", "Analysis succeeded, but Supabase save failed.", 502);
  }

  return {
    symbol,
    quote,
    analysis,
    saved: true
  };
}
