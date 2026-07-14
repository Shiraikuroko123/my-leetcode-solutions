import { describe, expect, it } from "vitest";
import { isLegacyFeaturedStarter } from "./drafts";

const oldTwoSumStarter = `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # 在这里完成你的解法
        raise NotImplementedError

if __name__ == "__main__":
    solution = Solution()
    cases = [
        ([2, 7, 11, 15], 9, [0, 1]),
        ([3, 2, 4], 6, [1, 2]),
        ([3, 3], 6, [0, 1]),
    ]
    for nums, target, expected in cases:
        actual = solution.twoSum(nums, target)
        assert actual == expected, (actual, expected)
    print("3/3 tests passed")`;

describe("legacy featured drafts", () => {
  it("recognizes an untouched starter that exposed expected results", () => {
    expect(isLegacyFeaturedStarter("two-sum", "python", oldTwoSumStarter)).toBe(true);
  });

  it("preserves a starter after the user changes it", () => {
    expect(isLegacyFeaturedStarter("two-sum", "python", oldTwoSumStarter.replace("raise NotImplementedError", "return []"))).toBe(false);
  });
});
