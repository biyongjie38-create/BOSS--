import { describe, expect, it, vi } from "vitest";

import { analyzeQuoteWithDeepSeek } from "./deepseek";
import type { QuotePayload } from "./types";

const quote: QuotePayload = {
  "Global Quote": {
    "01. symbol": "AAPL",
    "05. price": "196.5800"
  }
};

describe("analyzeQuoteWithDeepSeek", () => {
  it("repairs invalid first-pass JSON once", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "summary: stable, sentiment: neutral" } }]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "AAPL is stable at the current quote.",
                  sentiment: "Neutral",
                  risk_level: "Medium"
                })
              }
            }
          ]
        })
      });

    await expect(analyzeQuoteWithDeepSeek("AAPL", quote, "deepseek-key", fetchFn)).resolves.toEqual({
      summary: "AAPL is stable at the current quote.",
      sentiment: "Neutral",
      risk_level: "Medium"
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchFn.mock.calls[0][1]?.body as string)).toMatchObject({
      model: "deepseek-v4-flash",
      response_format: { type: "json_object" },
      thinking: { type: "disabled" }
    });
  });

  it("returns INVALID_LLM_JSON when repair also fails", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not json" } }]
      })
    });

    await expect(analyzeQuoteWithDeepSeek("AAPL", quote, "deepseek-key", fetchFn)).rejects.toMatchObject({
      code: "INVALID_LLM_JSON"
    });
  });
});
