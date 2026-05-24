import { analyzeStock } from "@/src/lib/analyze-service";
import { fetchGlobalQuote } from "@/src/lib/alpha-vantage";
import { analyzeQuoteWithDeepSeek } from "@/src/lib/deepseek";
import { toAppError } from "@/src/lib/errors";
import { saveAnalysisRecord } from "@/src/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { symbol?: unknown };

    const result = await analyzeStock(body.symbol, {
      getQuote: (symbol) => fetchGlobalQuote(symbol, process.env.ALPHA_VANTAGE_API_KEY),
      analyzeQuote: (symbol, quote) =>
        analyzeQuoteWithDeepSeek(symbol, quote, process.env.DEEPSEEK_API_KEY),
      saveRecord: saveAnalysisRecord
    });

    return Response.json(result);
  } catch (error) {
    const appError = toAppError(error);
    return Response.json(
      {
        error: {
          code: appError.code,
          message: appError.message
        }
      },
      { status: appError.status }
    );
  }
}
