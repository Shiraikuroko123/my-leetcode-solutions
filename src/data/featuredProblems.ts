import type { FeaturedProblem } from "../types/problem";

const twoSum: FeaturedProblem = {
  slug: "two-sum",
  summary: [
    "给定一个整数数组和目标值，请找出两个不同位置的元素，使它们之和等于目标值，并返回这两个位置。",
    "每组输入保证恰好存在一个答案，同一个元素不能重复使用。"
  ],
  examples: [
    { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", explanation: "2 + 7 = 9。" },
    { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" }
  ],
  constraints: ["数组至少包含 2 个元素", "答案唯一", "元素和目标值均为整数"],
  hints: ["枚举当前数字时，真正需要寻找的是 target - 当前数字。", "用哈希表记录已经访问过的数字及其下标。"],
  approach: {
    title: "一次遍历 + 哈希表",
    intuition: [
      "暴力做法会枚举所有数对。更直接的观察是：看到 nums[i] 时，只需知道它的补数是否已经出现。",
      "先查询再写入哈希表，可以自然避免把当前元素使用两次。"
    ],
    steps: ["创建 value -> index 的哈希表。", "依次计算 complement = target - nums[i]。", "补数存在时返回两个下标，否则记录当前值。"],
    time: "O(n)",
    space: "O(n)"
  },
  starterCode: {
    python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // 在这里完成你的解法
        return {};
    }
};`
  },
  solutionCode: {
    python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen: dict[int, int] = {}
        for index, value in enumerate(nums):
            complement = target - value
            if complement in seen:
                return [seen[complement], index]
            seen[value] = index
        return []

if __name__ == "__main__":
    solution = Solution()
    assert solution.twoSum([2, 7, 11, 15], 9) == [0, 1]
    assert solution.twoSum([3, 2, 4], 6) == [1, 2]
    assert solution.twoSum([3, 3], 6) == [0, 1]
    print("3/3 tests passed")`,
    cpp: `#include <cassert>
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
            const int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) return {seen[complement], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};

int main() {
    Solution solution;
    vector<int> a{2, 7, 11, 15};
    vector<int> b{3, 2, 4};
    assert((solution.twoSum(a, 9) == vector<int>{0, 1}));
    assert((solution.twoSum(b, 6) == vector<int>{1, 2}));
    cout << "2/2 tests passed\\n";
}`
  }
};

const longestSubstring: FeaturedProblem = {
  slug: "longest-substring-without-repeating-characters",
  summary: ["给定一个字符串，求其中不含重复字符的最长连续子串长度。", "子串必须连续，不能像子序列那样跳过字符。"],
  examples: [
    { input: 's = "abcabcbb"', output: "3", explanation: '最长候选为 "abc"。' },
    { input: 's = "bbbbb"', output: "1" },
    { input: 's = "pwwkew"', output: "3" }
  ],
  constraints: ["字符串可能为空", "字符可包含字母、数字、符号和空格"],
  hints: ["维护一个始终没有重复字符的窗口。", "记录每个字符最后一次出现的位置，左边界只向右移动。"],
  approach: {
    title: "滑动窗口",
    intuition: ["右指针加入新字符；若它已在当前窗口中，左边界直接跳到上次位置的后一位。", "左边界绝不能后退，因此更新时取 max。"],
    steps: ["用哈希表保存字符最后出现的下标。", "遍历右边界，必要时移动 left。", "用 right - left + 1 更新答案。"],
    time: "O(n)",
    space: "O(min(n, 字符集大小))"
  },
  starterCode: {
    python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // 在这里完成你的解法
        return 0;
    }
};`
  },
  solutionCode: {
    python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        last_seen: dict[str, int] = {}
        left = 0
        best = 0
        for right, char in enumerate(s):
            if char in last_seen:
                left = max(left, last_seen[char] + 1)
            last_seen[char] = right
            best = max(best, right - left + 1)
        return best

if __name__ == "__main__":
    solution = Solution()
    assert solution.lengthOfLongestSubstring("abcabcbb") == 3
    assert solution.lengthOfLongestSubstring("bbbbb") == 1
    assert solution.lengthOfLongestSubstring("") == 0
    print("3/3 tests passed")`,
    cpp: `#include <algorithm>
#include <array>
#include <cassert>
#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(const string& s) {
        array<int, 256> lastSeen;
        lastSeen.fill(-1);
        int left = 0;
        int best = 0;
        for (int right = 0; right < static_cast<int>(s.size()); ++right) {
            const unsigned char c = s[right];
            left = max(left, lastSeen[c] + 1);
            lastSeen[c] = right;
            best = max(best, right - left + 1);
        }
        return best;
    }
};

int main() {
    Solution solution;
    assert(solution.lengthOfLongestSubstring("abcabcbb") == 3);
    assert(solution.lengthOfLongestSubstring("bbbbb") == 1);
    assert(solution.lengthOfLongestSubstring("") == 0);
    cout << "3/3 tests passed\\n";
}`
  }
};

const validParentheses: FeaturedProblem = {
  slug: "valid-parentheses",
  summary: ["给定一个只包含三类括号的字符串，判断每个右括号是否能按正确类型和嵌套顺序闭合。"],
  examples: [
    { input: 's = "()[]{}"', output: "true" },
    { input: 's = "([)]"', output: "false" },
    { input: 's = "{[]}"', output: "true" }
  ],
  constraints: ["字符串只包含 ()[]{}", "空栈时不能读取栈顶"],
  hints: ["最近出现但尚未闭合的左括号，必须最先被闭合。", "这正是后进先出的栈。"],
  approach: {
    title: "栈匹配",
    intuition: ["遇到左括号就保存期望的右括号；遇到右括号时，它必须等于栈顶期望。", "结束后栈必须为空，否则仍有未闭合括号。"],
    steps: ["左括号入栈对应的右括号。", "右括号与栈顶比较，不符立即返回 false。", "遍历结束检查栈是否为空。"],
    time: "O(n)",
    space: "O(n)"
  },
  starterCode: {
    python: `class Solution:
    def isValid(self, s: str) -> bool:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <string>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // 在这里完成你的解法
        return false;
    }
};`
  },
  solutionCode: {
    python: `class Solution:
    def isValid(self, s: str) -> bool:
        expected: list[str] = []
        pairs = {"(": ")", "[": "]", "{": "}"}
        for char in s:
            if char in pairs:
                expected.append(pairs[char])
            elif not expected or expected.pop() != char:
                return False
        return not expected

if __name__ == "__main__":
    solution = Solution()
    assert solution.isValid("()[]{}")
    assert not solution.isValid("([)]")
    assert solution.isValid("{[]}")
    print("3/3 tests passed")`,
    cpp: `#include <cassert>
#include <iostream>
#include <stack>
#include <string>
using namespace std;

class Solution {
public:
    bool isValid(const string& s) {
        stack<char> expected;
        for (char c : s) {
            if (c == '(') expected.push(')');
            else if (c == '[') expected.push(']');
            else if (c == '{') expected.push('}');
            else if (expected.empty() || expected.top() != c) return false;
            else expected.pop();
        }
        return expected.empty();
    }
};

int main() {
    Solution solution;
    assert(solution.isValid("()[]{}"));
    assert(!solution.isValid("([)]"));
    assert(solution.isValid("{[]}"));
    cout << "3/3 tests passed\\n";
}`
  }
};

const maximumSubarray: FeaturedProblem = {
  slug: "maximum-subarray",
  summary: ["给定整数数组，找出和最大的非空连续子数组，并返回这个最大和。"],
  examples: [
    { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "连续片段 [4,-1,2,1] 的和为 6。" },
    { input: "nums = [-1]", output: "-1" }
  ],
  constraints: ["数组非空", "答案可能为负数"],
  hints: ["思考以当前位置结尾的最优子数组。", "前缀和为负时，继续携带它只会让后续结果更差。"],
  approach: {
    title: "Kadane 动态规划",
    intuition: ["对每个数字，最优片段要么从这里重新开始，要么接在上一位置的最优片段后。", "只依赖前一个状态，因此无需保存完整 DP 数组。"],
    steps: ["current 表示以当前位置结尾的最大和。", "更新 current = max(value, current + value)。", "用 best 记录所有位置中的最大值。"],
    time: "O(n)",
    space: "O(1)"
  },
  starterCode: {
    python: `from typing import List

class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // 在这里完成你的解法
        return 0;
    }
};`
  },
  solutionCode: {
    python: `from typing import List

class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        current = best = nums[0]
        for value in nums[1:]:
            current = max(value, current + value)
            best = max(best, current)
        return best

if __name__ == "__main__":
    solution = Solution()
    assert solution.maxSubArray([-2,1,-3,4,-1,2,1,-5,4]) == 6
    assert solution.maxSubArray([-1]) == -1
    print("2/2 tests passed")`,
    cpp: `#include <algorithm>
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int maxSubArray(const vector<int>& nums) {
        int current = nums.front();
        int best = nums.front();
        for (int i = 1; i < static_cast<int>(nums.size()); ++i) {
            current = max(nums[i], current + nums[i]);
            best = max(best, current);
        }
        return best;
    }
};

int main() {
    Solution solution;
    vector<int> a{-2,1,-3,4,-1,2,1,-5,4};
    vector<int> b{-1};
    assert(solution.maxSubArray(a) == 6);
    assert(solution.maxSubArray(b) == -1);
    cout << "2/2 tests passed\\n";
}`
  }
};

const climbingStairs: FeaturedProblem = {
  slug: "climbing-stairs",
  summary: ["一次可以爬 1 级或 2 级台阶，求到达第 n 级共有多少种不同走法。"],
  examples: [
    { input: "n = 2", output: "2" },
    { input: "n = 5", output: "8" }
  ],
  constraints: ["n 为正整数", "只需返回走法数量"],
  hints: ["最后一步只能来自 n - 1 或 n - 2。", "状态转移与斐波那契数列相同。"],
  approach: {
    title: "滚动动态规划",
    intuition: ["到达当前台阶的方法数，是到达前一级和前两级的方法数之和。", "状态只依赖两个旧值，可以把空间压缩到常数。"],
    steps: ["把第 1、2 级的答案设为 1、2。", "从第 3 级开始滚动相加。", "返回当前状态。"],
    time: "O(n)",
    space: "O(1)"
  },
  starterCode: {
    python: `class Solution:
    def climbStairs(self, n: int) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `using namespace std;

class Solution {
public:
    int climbStairs(int n) {
        // 在这里完成你的解法
        return 0;
    }
};`
  },
  solutionCode: {
    python: `class Solution:
    def climbStairs(self, n: int) -> int:
        previous, current = 0, 1
        for _ in range(n):
            previous, current = current, previous + current
        return current

if __name__ == "__main__":
    solution = Solution()
    assert solution.climbStairs(2) == 2
    assert solution.climbStairs(5) == 8
    print("2/2 tests passed")`,
    cpp: `#include <cassert>
#include <iostream>
using namespace std;

class Solution {
public:
    int climbStairs(int n) {
        int previous = 0;
        int current = 1;
        for (int i = 0; i < n; ++i) {
            const int next = previous + current;
            previous = current;
            current = next;
        }
        return current;
    }
};

int main() {
    Solution solution;
    assert(solution.climbStairs(2) == 2);
    assert(solution.climbStairs(5) == 8);
    cout << "2/2 tests passed\\n";
}`
  }
};

const stockProfit: FeaturedProblem = {
  slug: "best-time-to-buy-and-sell-stock",
  summary: ["给定每天的股票价格，只允许先买入一次、之后卖出一次，求能够获得的最大利润；也可以选择不交易。"],
  examples: [
    { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "价格 1 时买入，价格 6 时卖出。" },
    { input: "prices = [7,6,4,3,1]", output: "0" }
  ],
  constraints: ["卖出日必须晚于买入日", "价格为非负整数"],
  hints: ["扫描到今天时，最佳买入价一定是此前出现过的最低价。", "同时维护最低价和最大利润。"],
  approach: {
    title: "一次扫描",
    intuition: ["固定卖出日后，最优选择是此前最低的买入价格。", "每一天先用历史最低价计算利润，再把当天纳入最低价。"],
    steps: ["初始化最低价为第一天。", "遍历价格并更新 best = max(best, price - minimum)。", "更新历史最低价。"],
    time: "O(n)",
    space: "O(1)"
  },
  starterCode: {
    python: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int maxProfit(vector<int>& prices) {
        // 在这里完成你的解法
        return 0;
    }
};`
  },
  solutionCode: {
    python: `from typing import List

class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        minimum = prices[0]
        best = 0
        for price in prices[1:]:
            best = max(best, price - minimum)
            minimum = min(minimum, price)
        return best

if __name__ == "__main__":
    solution = Solution()
    assert solution.maxProfit([7,1,5,3,6,4]) == 5
    assert solution.maxProfit([7,6,4,3,1]) == 0
    print("2/2 tests passed")`,
    cpp: `#include <algorithm>
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int maxProfit(const vector<int>& prices) {
        int minimum = prices.front();
        int best = 0;
        for (int i = 1; i < static_cast<int>(prices.size()); ++i) {
            best = max(best, prices[i] - minimum);
            minimum = min(minimum, prices[i]);
        }
        return best;
    }
};

int main() {
    Solution solution;
    vector<int> a{7,1,5,3,6,4};
    vector<int> b{7,6,4,3,1};
    assert(solution.maxProfit(a) == 5);
    assert(solution.maxProfit(b) == 0);
    cout << "2/2 tests passed\\n";
}`
  }
};

const numberOfIslands: FeaturedProblem = {
  slug: "number-of-islands",
  summary: ["在由陆地与水域组成的网格中，上下左右相邻的陆地属于同一座岛，求岛屿数量。"],
  examples: [
    { input: 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]', output: "2" }
  ],
  constraints: ["网格至少有一行一列", "只按上下左右连接，不包含对角线"],
  hints: ["每遇到一块尚未访问的陆地，就发现了一座新岛。", "从它出发做 DFS/BFS，把整座岛标记掉。"],
  approach: {
    title: "网格 DFS",
    intuition: ["扫描网格时，未访问陆地是一个新连通分量的入口。", "从入口淹没所有相连陆地，后续扫描便不会重复计数。"],
    steps: ["逐格扫描。", "发现 1 时答案加一，并 DFS 标记相邻陆地。", "越界、水域或已访问位置立即返回。"],
    time: "O(mn)",
    space: "O(mn)，最坏情况下为递归栈"
  },
  starterCode: {
    python: `from typing import List

class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // 在这里完成你的解法
        return 0;
    }
};`
  },
  solutionCode: {
    python: `from typing import List

class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        rows, columns = len(grid), len(grid[0])

        def sink(row: int, column: int) -> None:
            if row < 0 or row >= rows or column < 0 or column >= columns:
                return
            if grid[row][column] != "1":
                return
            grid[row][column] = "0"
            sink(row + 1, column)
            sink(row - 1, column)
            sink(row, column + 1)
            sink(row, column - 1)

        islands = 0
        for row in range(rows):
            for column in range(columns):
                if grid[row][column] == "1":
                    islands += 1
                    sink(row, column)
        return islands

if __name__ == "__main__":
    solution = Solution()
    grid = [["1","1","0"],["1","0","0"],["0","0","1"]]
    assert solution.numIslands(grid) == 2
    print("1/1 tests passed")`,
    cpp: `#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
    int rows = 0;
    int columns = 0;

    void sink(vector<vector<char>>& grid, int row, int column) {
        if (row < 0 || row >= rows || column < 0 || column >= columns) return;
        if (grid[row][column] != '1') return;
        grid[row][column] = '0';
        sink(grid, row + 1, column);
        sink(grid, row - 1, column);
        sink(grid, row, column + 1);
        sink(grid, row, column - 1);
    }

public:
    int numIslands(vector<vector<char>>& grid) {
        rows = static_cast<int>(grid.size());
        columns = static_cast<int>(grid[0].size());
        int islands = 0;
        for (int row = 0; row < rows; ++row) {
            for (int column = 0; column < columns; ++column) {
                if (grid[row][column] == '1') {
                    ++islands;
                    sink(grid, row, column);
                }
            }
        }
        return islands;
    }
};

int main() {
    Solution solution;
    vector<vector<char>> grid{{'1','1','0'},{'1','0','0'},{'0','0','1'}};
    assert(solution.numIslands(grid) == 2);
    cout << "1/1 tests passed\\n";
}`
  }
};

const binarySearch: FeaturedProblem = {
  slug: "binary-search",
  summary: ["在严格升序数组中查找目标值，存在则返回下标，不存在则返回 -1。"],
  examples: [
    { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
    { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" }
  ],
  constraints: ["数组已按升序排列", "数组元素互不相同"],
  hints: ["比较中点后，可以排除一半搜索区间。", "明确区间是闭区间 [left, right]，并保持循环不变量。"],
  approach: {
    title: "闭区间二分查找",
    intuition: ["中点小于目标值时，中点及其左侧都不可能是答案；反之排除右侧。", "使用 left + (right - left) // 2 避免某些语言中的整数溢出。"],
    steps: ["初始化 left = 0, right = n - 1。", "在 left <= right 时检查中点。", "根据比较结果收缩到不含中点的新区间。"],
    time: "O(log n)",
    space: "O(1)"
  },
  starterCode: {
    python: `from typing import List

class Solution:
    def search(self, nums: List[int], target: int) -> int:
        # 在这里完成你的解法
        raise NotImplementedError`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        // 在这里完成你的解法
        return -1;
    }
};`
  },
  solutionCode: {
    python: `from typing import List

class Solution:
    def search(self, nums: List[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        while left <= right:
            middle = left + (right - left) // 2
            if nums[middle] == target:
                return middle
            if nums[middle] < target:
                left = middle + 1
            else:
                right = middle - 1
        return -1

if __name__ == "__main__":
    solution = Solution()
    assert solution.search([-1,0,3,5,9,12], 9) == 4
    assert solution.search([-1,0,3,5,9,12], 2) == -1
    print("2/2 tests passed")`,
    cpp: `#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int search(const vector<int>& nums, int target) {
        int left = 0;
        int right = static_cast<int>(nums.size()) - 1;
        while (left <= right) {
            const int middle = left + (right - left) / 2;
            if (nums[middle] == target) return middle;
            if (nums[middle] < target) left = middle + 1;
            else right = middle - 1;
        }
        return -1;
    }
};

int main() {
    Solution solution;
    vector<int> nums{-1,0,3,5,9,12};
    assert(solution.search(nums, 9) == 4);
    assert(solution.search(nums, 2) == -1);
    cout << "2/2 tests passed\\n";
}`
  }
};

export const featuredProblems: Record<string, FeaturedProblem> = {
  [twoSum.slug]: twoSum,
  [longestSubstring.slug]: longestSubstring,
  [validParentheses.slug]: validParentheses,
  [maximumSubarray.slug]: maximumSubarray,
  [climbingStairs.slug]: climbingStairs,
  [stockProfit.slug]: stockProfit,
  [numberOfIslands.slug]: numberOfIslands,
  [binarySearch.slug]: binarySearch
};

export const featuredSlugs = new Set(Object.keys(featuredProblems));
