import { describe, expect, it } from "vitest";
import { resolveOpenAIApiKey, resolveReasoningConfig } from "./openaiConfig";

describe("resolveOpenAIApiKey", () => {
  it("prefers the AlgoNote-specific key", () => {
    expect(resolveOpenAIApiKey({ ALGONOTE_OPENAI_API_KEY: "local-key", OPENAI_API_KEY: "global-key" })).toBe("local-key");
  });

  it("falls back to the standard OpenAI key", () => {
    expect(resolveOpenAIApiKey({ OPENAI_API_KEY: "global-key" })).toBe("global-key");
  });

  it("ignores blank values", () => {
    expect(resolveOpenAIApiKey({ ALGONOTE_OPENAI_API_KEY: "  ", OPENAI_API_KEY: "" })).toBeUndefined();
  });
});

describe("resolveReasoningConfig", () => {
  it("uses the portable public options and medium by default", () => {
    expect(resolveReasoningConfig({})).toEqual({
      supportedEfforts: ["low", "medium", "high", "xhigh", "max"],
      defaultEffort: "medium"
    });
  });

  it("accepts provider-specific options only when explicitly configured", () => {
    expect(resolveReasoningConfig({
      OPENAI_REASONING_EFFORTS: "low, xhigh, ultra, invalid, xhigh",
      OPENAI_REASONING_DEFAULT: "ultra"
    })).toEqual({
      supportedEfforts: ["low", "xhigh", "ultra"],
      defaultEffort: "ultra"
    });
  });

  it("falls back to a supported default", () => {
    expect(resolveReasoningConfig({
      OPENAI_REASONING_EFFORTS: "high,max",
      OPENAI_REASONING_DEFAULT: "medium"
    })).toEqual({ supportedEfforts: ["high", "max"], defaultEffort: "high" });
  });
});
