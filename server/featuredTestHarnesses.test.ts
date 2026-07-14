import { describe, expect, it } from "vitest";
import { attachFeaturedTests, hasFeaturedTests } from "./featuredTestHarnesses";

describe("featured test harnesses", () => {
  it("leaves ordinary submissions unchanged", () => {
    expect(attachFeaturedTests("unknown", "python", "print('hello')")).toBe("print('hello')");
  });

  it("adds server-side checks to featured Python submissions", () => {
    const code = attachFeaturedTests("two-sum", "python", "class Solution: pass");
    expect(code).toContain("class Solution: pass");
    expect(code).toContain("AlgoNote server-side checks");
    expect(code).toContain("3/3 tests passed");
  });

  it("renames a user C++ main before adding the check runner", () => {
    const code = attachFeaturedTests("two-sum", "cpp", "int main() { return 0; }");
    expect(code).toContain("#define main algonote_user_main");
    expect(code).toContain("#undef main");
    expect(code).toContain("3/3 tests passed");
  });

  it("covers every featured problem in both languages", () => {
    const slugs = [
      "two-sum",
      "longest-substring-without-repeating-characters",
      "valid-parentheses",
      "maximum-subarray",
      "climbing-stairs",
      "best-time-to-buy-and-sell-stock",
      "number-of-islands",
      "binary-search"
    ];
    for (const slug of slugs) {
      expect(hasFeaturedTests(slug, "python")).toBe(true);
      expect(hasFeaturedTests(slug, "cpp")).toBe(true);
    }
  });
});
