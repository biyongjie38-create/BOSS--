import { AppError } from "./errors";
import type { FetchLike, QuotePayload } from "./types";

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";

export async function fetchGlobalQuote(
  symbol: string,
  apiKey: string | undefined,
  fetchFn: FetchLike = fetch
): Promise<QuotePayload> {
  if (!apiKey) {
    throw new AppError("ALPHA_VANTAGE_ERROR", "Missing ALPHA_VANTAGE_API_KEY.", 500);
  }

  const url = new URL(ALPHA_VANTAGE_URL);
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  let payload: QuotePayload;
  try {
    const response = await fetchFn(url.toString());
    if (!response.ok) {
      throw new Error(`Alpha Vantage responded with HTTP ${response.status}`);
    }
    payload = (await response.json()) as QuotePayload;
  } catch {
    throw new AppError("ALPHA_VANTAGE_ERROR", "Failed to fetch Alpha Vantage quote.", 502);
  }

  if (hasAlphaVantageError(payload) || !hasGlobalQuote(payload)) {
    throw new AppError("ALPHA_VANTAGE_ERROR", "Alpha Vantage returned no quote for this symbol.", 502);
  }

  return payload;
}

function hasGlobalQuote(payload: QuotePayload): boolean {
  const quote = payload["Global Quote"];
  return typeof quote === "object" && quote !== null && Object.keys(quote).length > 0;
}

function hasAlphaVantageError(payload: QuotePayload): boolean {
  return "Error Message" in payload || "Information" in payload || "Note" in payload;
}
