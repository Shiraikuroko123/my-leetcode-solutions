import type { Language } from "../src/types/problem";

type Harness = Partial<Record<Language, string>>;

function pythonChecks(expressions: string[]) {
  const checks = expressions.map((expression) => `        lambda: ${expression},`).join("\n");
  return `# AlgoNote server-side checks
def _algonote_run_checks():
    try:
        solution = Solution()
        checks = [
${checks}
        ]
        for index, check in enumerate(checks, start=1):
            try:
                if not check():
                    print(f"Test {index} failed")
                    return 1
            except Exception as error:
                print(f"Test {index} error: {type(error).__name__}")
                return 1
        print("${expressions.length}/${expressions.length} tests passed")
        return 0
    except Exception as error:
        print(f"Unable to run checks: {type(error).__name__}")
        return 1

raise SystemExit(_algonote_run_checks())`;
}

function cppChecks(body: string, count: number) {
  return `#include <iostream>

int main() {
    Solution solution;
    auto fail = [](int index) {
        std::cerr << "Test " << index << " failed\\n";
        return 1;
    };
${body}
    std::cout << "${count}/${count} tests passed\\n";
    return 0;
}`;
}

const featuredTestHarnesses: Record<string, Harness> = {
  "two-sum": {
    python: pythonChecks([
      "solution.twoSum([2, 7, 11, 15], 9) == [0, 1]",
      "solution.twoSum([3, 2, 4], 6) == [1, 2]",
      "solution.twoSum([3, 3], 6) == [0, 1]"
    ]),
    cpp: cppChecks(`    std::vector<int> first{2, 7, 11, 15};
    std::vector<int> firstExpected{0, 1};
    if (solution.twoSum(first, 9) != firstExpected) return fail(1);
    std::vector<int> second{3, 2, 4};
    std::vector<int> secondExpected{1, 2};
    if (solution.twoSum(second, 6) != secondExpected) return fail(2);
    std::vector<int> third{3, 3};
    std::vector<int> thirdExpected{0, 1};
    if (solution.twoSum(third, 6) != thirdExpected) return fail(3);`, 3)
  },
  "longest-substring-without-repeating-characters": {
    python: pythonChecks([
      'solution.lengthOfLongestSubstring("abcabcbb") == 3',
      'solution.lengthOfLongestSubstring("bbbbb") == 1',
      'solution.lengthOfLongestSubstring("") == 0'
    ]),
    cpp: cppChecks(`    const int firstExpected = 3;
    const int firstActual = solution.lengthOfLongestSubstring("abcabcbb");
    if (firstActual != firstExpected) return fail(1);
    const int secondExpected = 1;
    const int secondActual = solution.lengthOfLongestSubstring("bbbbb");
    if (secondActual != secondExpected) return fail(2);
    const int thirdExpected = 0;
    const int thirdActual = solution.lengthOfLongestSubstring("");
    if (thirdActual != thirdExpected) return fail(3);`, 3)
  },
  "valid-parentheses": {
    python: pythonChecks([
      'solution.isValid("()[]{}") is True',
      'solution.isValid("([)]") is False',
      'solution.isValid("{[]}") is True'
    ]),
    cpp: cppChecks(`    const bool firstExpected = true;
    const bool firstActual = solution.isValid("()[]{}");
    if (firstActual != firstExpected) return fail(1);
    const bool secondExpected = false;
    const bool secondActual = solution.isValid("([)]");
    if (secondActual != secondExpected) return fail(2);
    const bool thirdExpected = true;
    const bool thirdActual = solution.isValid("{[]}");
    if (thirdActual != thirdExpected) return fail(3);`, 3)
  },
  "maximum-subarray": {
    python: pythonChecks([
      "solution.maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6",
      "solution.maxSubArray([-1]) == -1"
    ]),
    cpp: cppChecks(`    std::vector<int> first{-2, 1, -3, 4, -1, 2, 1, -5, 4};
    const int firstExpected = 6;
    const int firstActual = solution.maxSubArray(first);
    if (firstActual != firstExpected) return fail(1);
    std::vector<int> second{-1};
    const int secondExpected = -1;
    const int secondActual = solution.maxSubArray(second);
    if (secondActual != secondExpected) return fail(2);`, 2)
  },
  "climbing-stairs": {
    python: pythonChecks([
      "solution.climbStairs(2) == 2",
      "solution.climbStairs(5) == 8"
    ]),
    cpp: cppChecks(`    const int firstExpected = 2;
    const int firstActual = solution.climbStairs(2);
    if (firstActual != firstExpected) return fail(1);
    const int secondExpected = 8;
    const int secondActual = solution.climbStairs(5);
    if (secondActual != secondExpected) return fail(2);`, 2)
  },
  "best-time-to-buy-and-sell-stock": {
    python: pythonChecks([
      "solution.maxProfit([7, 1, 5, 3, 6, 4]) == 5",
      "solution.maxProfit([7, 6, 4, 3, 1]) == 0"
    ]),
    cpp: cppChecks(`    std::vector<int> first{7, 1, 5, 3, 6, 4};
    const int firstExpected = 5;
    const int firstActual = solution.maxProfit(first);
    if (firstActual != firstExpected) return fail(1);
    std::vector<int> second{7, 6, 4, 3, 1};
    const int secondExpected = 0;
    const int secondActual = solution.maxProfit(second);
    if (secondActual != secondExpected) return fail(2);`, 2)
  },
  "number-of-islands": {
    python: pythonChecks([
      'solution.numIslands([["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]]) == 2'
    ]),
    cpp: cppChecks(`    std::vector<std::vector<char>> grid{{'1', '1', '0'}, {'1', '0', '0'}, {'0', '0', '1'}};
    const int expected = 2;
    const int actual = solution.numIslands(grid);
    if (actual != expected) return fail(1);`, 1)
  },
  "binary-search": {
    python: pythonChecks([
      "solution.search([-1, 0, 3, 5, 9, 12], 9) == 4",
      "solution.search([-1, 0, 3, 5, 9, 12], 2) == -1"
    ]),
    cpp: cppChecks(`    std::vector<int> numbers{-1, 0, 3, 5, 9, 12};
    const int firstExpected = 4;
    const int firstActual = solution.search(numbers, 9);
    if (firstActual != firstExpected) return fail(1);
    const int secondExpected = -1;
    const int secondActual = solution.search(numbers, 2);
    if (secondActual != secondExpected) return fail(2);`, 2)
  }
};

export function attachFeaturedTests(problemSlug: string | undefined, language: Language, code: string) {
  const harness = problemSlug ? featuredTestHarnesses[problemSlug]?.[language] : undefined;
  if (!harness) return code;
  if (language === "cpp") {
    return `#define main algonote_user_main\n${code}\n#undef main\n\n${harness}`;
  }
  return `${code}\n\n${harness}`;
}

export function hasFeaturedTests(problemSlug: string, language: Language) {
  return Boolean(featuredTestHarnesses[problemSlug]?.[language]);
}
