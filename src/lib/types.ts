export type Sentiment = "Bullish" | "Neutral" | "Bearish";
export type RiskLevel = "Low" | "Medium" | "High";

export type AnalysisResult = {
  summary: string;
  sentiment: Sentiment;
  risk_level: RiskLevel;
};

export type QuotePayload = Record<string, unknown>;

export type AnalyzeResponse = {
  symbol: string;
  quote: QuotePayload;
  analysis: AnalysisResult;
  saved: true;
};

export type ErrorCode =
  | "MISSING_SYMBOL"
  | "ALPHA_VANTAGE_ERROR"
  | "DEEPSEEK_ERROR"
  | "INVALID_LLM_JSON"
  | "SUPABASE_SAVE_ERROR";

export type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;
