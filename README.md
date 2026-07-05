# My LeetCode Solutions

📚 **个人 LeetCode 刷题记录库** | Python & C++ 解题库

## 📊 统计

- 总题数：0/3000+
- Python 解法：0
- C++ 解法：0
- 难度分布：
  - Easy: 0
  - Medium: 0
  - Hard: 0

## 📁 项目结构

```
my-leetcode-solutions/
├── python/                    # Python 解法
│   ├── easy/                 # 简单难度
│   ├── medium/               # 中等难度
│   ├── hard/                 # 困难难度
│   └── README.md
├── cpp/                       # C++ 解法
│   ├── easy/
│   ├── medium/
│   ├── hard/
│   └── README.md
├── SOLUTIONS.md              # 解题笔记和总结
├── LEARNING.md               # 学习心得和技巧
└── README.md
```

## 🎯 学习目标

- [ ] 掌握常见数据结构（数组、链表、树、图等）
- [ ] 掌握常见算法（DFS、BFS、DP、贪心等）
- [ ] 积累 100+ 道解题经验
- [ ] 能够用 Python 和 C++ 灵活实现
- [ ] 为面试做准备

## 📝 解题模板

### Python 解法模板

```python
"""
题号: 0001
题名: Two Sum
难度: Easy

题目描述:
给定一个整数数组 nums 和一个整数目标值 target，
请你在该数组中找出和为目标值 target 的那两个整数，
并返回它们的数组下标。

解法思路:
使用哈希表存储已见过的数字及其索引，
对于每个数字，检查是否存在 target - num

时间复杂度: O(n)
空间复杂度: O(n)
"""

class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # 哈希表：值 -> 索引
        seen = {}
        
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        
        return []

# 测试用例
if __name__ == "__main__":
    solution = Solution()
    assert solution.twoSum([2, 7, 11, 15], 9) == [0, 1]
    assert solution.twoSum([3, 2, 4], 6) == [1, 2]
    print("✅ All tests passed!")
```

### C++ 解法模板

```cpp
/*
题号: 0001
题名: Two Sum
难度: Easy

题目描述:
给定一个整数数组 nums 和一个整数目标值 target，
请你在该数组中找出和为目标值 target 的那两个整数，
并返回它们的数组下标。

解法思路:
使用哈希表存储已见过的数字及其索引

时间复杂度: O(n)
空间复杂度: O(n)
*/

#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        
        return {};
    }
};
```

## 🔗 链接

- [LeetCode 官网](https://leetcode.com/)
- [LeetCode 中文](https://leetcode-cn.com/)

## 📚 参考资源

- [算法导论](https://en.wikipedia.org/wiki/Introduction_to_Algorithms)
- [Data Structures and Algorithms](https://www.coursera.org/)
- [GeeksforGeeks](https://www.geeksforgeeks.org/)

## 💡 学习建议

1. **分类学习**：按难度和类型系统地学习
2. **多语言实现**：同一道题用 Python 和 C++ 实现，加深理解
3. **复杂度分析**：每道题都分析时间和空间复杂度
4. **反复练习**：定期回顾和优化之前的解法
5. **写下笔记**：记录解题思路和关键概念

---

**开始日期**: 2024年

**最后更新**: 2024年

**作者**: Shiraikuroko123 🚀