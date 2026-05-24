import { describe, expect, it } from "vitest";

import { AppError } from "./errors";
import { parseAnalysisJson } from "./llm-json";

describe("parseAnalysisJson", () => {
  it("accepts exactly the required stock analysis JSON shape", () => {
    expect(
      parseAnalysisJson(
        JSON.stringify({
          summary: "Revenue momentum is steady, but valuation risk remains.",
          sentiment: "Neutral",
          risk_level: "Medium"
        })
      )
    ).toEqual({
      summary: "Revenue momentum is steady, but valuation risk remains.",
      sentiment: "Neutral",
      risk_level: "Medium"
    });
  });

  it("rejects malformed JSON with INVALID_LLM_JSON", () => {
    expect(() => parseAnalysisJson("{not-json")).toThrow(AppError);
    expect(() => parseAnalysisJson("{not-json")).toThrow("LLM did not return valid JSON.");
  });

  it("rejects unsupported sentiment values", () => {
    expect(() =>
      parseAnalysisJson(
        JSON.stringify({
          summary: "Looks fine.",
          sentiment: "Excited",
          risk_level: "Low"
        })
      )
    ).toThrow("LLM JSON did not match the required schema.");
  });

  it("rejects extra keys to keep the contract strict", () => {
    expect(() =>
      parseAnalysisJson(
        JSON.stringify({
          summary: "Looks fine.",
          sentiment: "Bullish",
          risk_level: "Low",
          target_price: 123
        })
      )
    ).toThrow("LLM JSON did not match the required schema.");
  });
});
