# 题解与代码覆盖

项目将题解分成两类，界面会明确标注来源。

## 原创深度题解

`src/data/featuredProblems.ts` 当前包含 8 道可直接运行的 Python / C++ 双语题解：

- 两数之和：哈希表
- 无重复字符的最长子串：滑动窗口
- 有效的括号：栈
- 最大子数组和：动态规划
- 爬楼梯：滚动动态规划
- 买卖股票的最佳时机：贪心扫描
- 岛屿数量：网格 DFS
- 二分查找：边界与循环不变量

每道深度题解必须包含：

- 不复制官方文本的原创题意摘要
- 示例与约束摘要
- 至少两级渐进提示
- 核心直觉、可执行步骤和复杂度
- Python 与 C++ 起始模板
- Python 与 C++ 标准实现
- 能在本项目 Piston 沙箱直接通过的测试入口

提交前运行：

```powershell
npm run verify:solutions
```

## 第三方参考实现

`server/data/solution-manifest.json` 是 `walkccc/LeetCode` 的上游文件清单，`src/data/solution-coverage.json` 是供题库界面使用的紧凑语言覆盖表。代码不会全部打包进前端，而是在用户主动查看时从上游读取并缓存。

第三方实现：

- 使用 MIT License，必须保留来源和许可说明
- 不属于本站原创，也不标记为“标准答案”
- 可能只包含 LeetCode 的 `Solution` 类
- 可能依赖平台预定义的数据结构
- 加载到编辑器后通常需要补充 `main` 或测试入口才能独立运行

更新清单：

```powershell
npm run sync:solutions
```

## 新增原创题解

1. 在 `featuredProblems.ts` 新建一个 `FeaturedProblem` 对象。
2. 使用题目的 `slug` 作为键加入 `featuredProblems`。
3. 保证摘要为原创表述，并链接官方题面核对完整约束。
4. 为两种语言提供独立可运行测试，至少覆盖正常、边界和易错用例。
5. 运行类型检查、题解验证、无障碍审计和视觉回归。

不要批量复制受版权保护的完整题面、官方题解或未注明许可的代码。
