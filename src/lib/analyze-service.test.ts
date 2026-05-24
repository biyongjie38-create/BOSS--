import { describe, expect, it, vi } from "vitest";

import { analyzeStock, normalizeSymbol } from "./analyze-service";
import { AppError } from "./errors";
import type { AnalysisResult, QuotePayload } from "./types";

const quote: QuotePayload = {
  "Global Quote": {
    "01. symbol": "AAPL",
    "05. price": "196.5800",
    "10. change percent": "0.54%"
  }
};

const analysis: AnalysisResult = {
  summary: "AAPL is stable with moderate near-term risk.",
  sentiment: "Neutral",
  risk_level: "Medium"
};

describe("normalizeSymbol", () => {
  it("trims and uppercases valid symbols", () => {
    expect(normalizeSymbol(" aapl ")).toBe("AAPL");
    expect(normalizeSymbol("brk.b")).toBe("BRK.B");
  });

  it("rejects empty symbols", () => {
    expect(() => normalizeSymbol("   ")).toThrow(AppError);
    expect(() => normalizeSymbol(undefined)).toThrow("Please enter a stock symbol.");
  });

  it("rejects symbols with unsupported characters", () => {
    expect(() => normalizeSymbol("AAPL;DROP")).toThrow("Stock symbol can only contain letters, numbers, dots, and dashes.");
  });
});

describe("analyzeStock", () => {
  it("runs quote, AI analysis, and save steps in order", async () => {
    const getQuote = vi.fn().mockResolvedValue(quote);
    const analyzeQuote = vi.fn().mockResolvedValue(analysis);
    const saveRecord = vi.fn().mockResolvedValue(undefined);

    await expect(
      analyzeStock(" aapl ", {
        getQuote,
        analyzeQuote,
        saveRecord
      })
    ).resolves.toEqual({
      symbol: "AAPL",
      quote,
      analysis,
      saved: true
    });

    expect(getQuote).toHaveBeenCalledWith("AAPL");
    expect(analyzeQuote).toHaveBeenCalledWith("AAPL", quote);
    expect(saveRecord).toHaveBeenCalledWith("AAPL", quote, analysis);
  });

  it("maps Supabase save failures to SUPABASE_SAVE_ERROR", async () => {
    await expect(
      analyzeStock("MSFT", {
        getQuote: vi.fn().mockResolvedValue(quote),
        analyzeQuote: vi.fn().mockResolvedValue(analysis),
        saveRecord: vi.fn().mockRejectedValue(new Error("permission denied"))
      })
    ).rejects.toMatchObject({
      code: "SUPABASE_SAVE_ERROR"
    });
  });
});
