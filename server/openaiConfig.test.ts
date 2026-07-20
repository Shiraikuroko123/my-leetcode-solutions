import { describe, expect, it } from "vitest";
import { resolveOpenAIApiKey, resolveOpenAIBaseUrl, resolveOpenAIApiMode, resolveReasoningConfig } from "./openaiConfig";

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

describe("OpenAI compatibility settings", () => {
  it("adds the v1 path for a root-compatible provider URL", () => {
    expect(resolveOpenAIBaseUrl({ OPENAI_BASE_URL: "http://127.0.0.1:8080" })).toBe("http://127.0.0.1:8080/v1");
  });

  it("keeps an explicitly configured API path", () => {
    expect(resolveOpenAIBaseUrl({ OPENAI_BASE_URL: "https://example.test/custom/" })).toBe("https://example.test/custom");
  });

  it("defaults to chat completions for OpenAI-compatible proxies", () => {
    expect(resolveOpenAIApiMode({})).toBe("chat");
    expect(resolveOpenAIApiMode({ OPENAI_API_MODE: "responses" })).toBe("responses");
  });
});
