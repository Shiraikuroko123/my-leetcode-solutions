# C++ 原创解法目录

网站的题目目录和深度题解位于 `src/data/`。本目录保留给希望以独立 `.cpp` 文件维护的原创解法，不用于镜像全部 LeetCode 题面或第三方仓库。

推荐结构：

```text
cpp/
  easy/
  medium/
  hard/
```

每个文件应包含题号、题名、核心思路、复杂度、`Solution` 实现和可直接运行的 `main` 测试。题面只写原创摘要，并提供官方链接。

```cpp
/* 0001. Two Sum
 * 思路：一次遍历，用哈希表保存已经出现的值与下标。
 * 时间 O(n)，空间 O(n)。
 */

#include <cassert>

class Solution {
public:
    // 实现
};

int main() {
    // 断言测试
}
```

本地建议使用 C++17 或更新标准。浏览器内的 C++ 运行环境由自建 Piston 的 GCC 运行时提供。
