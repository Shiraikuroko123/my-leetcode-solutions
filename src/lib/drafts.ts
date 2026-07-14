import type { Language } from "../types/problem";

const LEGACY_STARTER_FINGERPRINTS: Record<string, string> = {
  "two-sum:python": "503:a520c412",
  "two-sum:cpp": "458:88aa30b0",
  "longest-substring-without-repeating-characters:python": "383:9b3ff374",
  "longest-substring-without-repeating-characters:cpp": "450:55b40ace",
  "valid-parentheses:python": "306:6852db24",
  "valid-parentheses:cpp": "374:fef19483",
  "maximum-subarray:python": "335:b492ff0a",
  "maximum-subarray:cpp": "415:b221b839",
  "climbing-stairs:python": "275:c3a06d69",
  "climbing-stairs:cpp": "319:c01fdccb",
  "best-time-to-buy-and-sell-stock:python": "327:f1ddbe83",
  "best-time-to-buy-and-sell-stock:cpp": "407:3544b91c",
  "number-of-islands:python": "331:7f97d690",
  "number-of-islands:cpp": "391:d0014a81",
  "binary-search:python": "342:42a21377",
  "binary-search:cpp": "397:d07ac158"
};

export function draftFingerprint(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619);
  }
  return `${value.length}:${(hash >>> 0).toString(16)}`;
}

export function isLegacyFeaturedStarter(slug: string, language: Language, draft: string) {
  return LEGACY_STARTER_FINGERPRINTS[`${slug}:${language}`] === draftFingerprint(draft);
}
