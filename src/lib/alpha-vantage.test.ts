import { describe, expect, it, vi } from "vitest";

import { fetchGlobalQuote } from "./alpha-vantage";

describe("fetchGlobalQuote", () => {
  it("calls Alpha Vantage Global Quote and returns the payload", async () => {
    const payload = {
      "Global Quote": {
        "01. symbol": "AAPL",
        "05. price": "196.5800"
      }
    };
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload
    });

    await expect(fetchGlobalQuote("AAPL", "demo-key", fetchFn)).resolves.toEqual(payload);

    const requestedUrl = new URL(fetchFn.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get("function")).toBe("GLOBAL_QUOTE");
    expect(requestedUrl.searchParams.get("symbol")).toBe("AAPL");
    expect(requestedUrl.searchParams.get("apikey")).toBe("demo-key");
  });

  it("fails clearly when Alpha Vantage returns no quote", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ "Global Quote": {} })
    });

    await expect(fetchGlobalQuote("NOPE", "demo-key", fetchFn)).rejects.toMatchObject({
      code: "ALPHA_VANTAGE_ERROR"
    });
  });
});
