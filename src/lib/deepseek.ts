import { AppError } from "./errors";
import { parseAnalysisJson } from "./llm-json";
import type { AnalysisResult, FetchLike, QuotePayload } from "./types";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function analyzeQuoteWithDeepSeek(
  symbol: string,
  quote: QuotePayload,
  apiKey: string | undefined,
  fetchFn: FetchLike = fetch
): Promise<AnalysisResult> {
  if (!apiKey) {
    throw new AppError("DEEPSEEK_ERROR", "Missing DEEPSEEK_API_KEY.", 500);
  }

  const firstPass = await requestDeepSeek(
    [
      {
        role: "system",
        content:
          "You are a cautious stock analyst. Return only strict JSON. No markdown, no commentary."
      },
      {
        role: "user",
        content: buildAnalysisPrompt(symbol, quote)
      }
    ],
    apiKey,
    fetchFn
  );

  try {
    return parseAnalysisJson(firstPass);
  } catch {
    const repaired = await requestDeepSeek(
      [
        {
          role: "system",
          content:
            "You repair invalid model output into strict JSON only. No markdown, no commentary."
        },
        {
          role: "user",
          content: buildRepairPrompt(symbol, quote, firstPass)
        }
      ],
      apiKey,
      fetchFn
    );

    try {
      return parseAnalysisJson(repaired);
    } catch {
      throw new AppError("INVALID_LLM_JSON", "DeepSeek returned invalid JSON after one repair attempt.", 502);
    }
  }
}

function buildAnalysisPrompt(symbol: string, quote: QuotePayload): string {
  return [
    `Analyze the current Global Quote for ${symbol}.`,
    "Use only the quote data provided; do not invent financial metrics.",
    "Return exactly this JSON shape:",
    '{"summary":"string","sentiment":"Bullish | Neutral | Bearish","risk_level":"Low | Medium | High"}',
    "Quote JSON:",
    JSON.stringify(quote)
  ].join("\n");
}

function buildRepairPrompt(symbol: string, quote: QuotePayload, invalidOutput: string): string {
  return [
    `Repair the previous output for ${symbol} into valid JSON that matches the required schema.`,
    "Required schema:",
    '{"summary":"string","sentiment":"Bullish | Neutral | Bearish","risk_level":"Low | Medium | High"}',
    "Original quote JSON:",
    JSON.stringify(quote),
    "Invalid output:",
    invalidOutput
  ].join("\n");
}

async function requestDeepSeek(
  messages: DeepSeekMessage[],
  apiKey: string,
  fetchFn: FetchLike
): Promise<string> {
  let payload: DeepSeekResponse;

  try {
    const response = await fetchFn(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        response_format: { type: "json_object" },
        thinking: { type: "disabled" },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek responded with HTTP ${response.status}`);
    }

    payload = (await response.json()) as DeepSeekResponse;
  } catch {
    throw new AppError("DEEPSEEK_ERROR", "Failed to call DeepSeek API.", 502);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError("DEEPSEEK_ERROR", "DeepSeek returned an empty response.", 502);
  }

  return content;
}
