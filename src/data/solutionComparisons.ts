export type SolutionComparison = {
  id: string;
  name: string;
  summary: string;
  tradeoff: string;
  time: string;
  space: string;
  timeRank: number;
  spaceRank: number;
  recommended?: boolean;
};

export const solutionComparisons: Record<string, SolutionComparison[]> = {
  "two-sum": [
    { id: "pairs", name: "枚举数对", summary: "检查每一对下标，逻辑最直接。", tradeoff: "不需要额外结构，但输入增大后比较次数快速增长。", time: "O(n²)", space: "O(1)", timeRank: 5, spaceRank: 1 },
    { id: "sort", name: "排序双指针", summary: "排序后从两端收缩搜索区间。", tradeoff: "适合只求数值组合；保留下标需要额外映射。", time: "O(n log n)", space: "O(n)", timeRank: 4, spaceRank: 3 },
    { id: "hash", name: "一次哈希", summary: "遍历时查询补数，并记录已见元素。", tradeoff: "用线性额外空间换取一次扫描。", time: "O(n)", space: "O(n)", timeRank: 3, spaceRank: 3, recommended: true }
  ],
  "longest-substring-without-repeating-characters": [
    { id: "enumerate", name: "枚举子串", summary: "生成每个起点的所有候选子串。", tradeoff: "便于验证思路，但重复检查大量字符。", time: "O(n³)", space: "O(k)", timeRank: 6, spaceRank: 2 },
    { id: "set-window", name: "集合窗口", summary: "重复时逐步移动左边界并删除字符。", tradeoff: "实现直观，每个字符最多进出集合一次。", time: "O(n)", space: "O(k)", timeRank: 3, spaceRank: 2 },
    { id: "index-window", name: "下标窗口", summary: "记录字符最后位置，左边界可以直接跳跃。", tradeoff: "状态稍多，但减少重复移动。", time: "O(n)", space: "O(k)", timeRank: 2, spaceRank: 2, recommended: true }
  ],
  "valid-parentheses": [
    { id: "replace", name: "反复消除", summary: "持续删除成对括号，直到字符串不再变化。", tradeoff: "表达直观，但字符串重建会重复扫描。", time: "O(n²)", space: "O(n)", timeRank: 5, spaceRank: 3 },
    { id: "stack", name: "期望栈", summary: "左括号压入期望的右括号，右括号与栈顶匹配。", tradeoff: "一次扫描，空间与最大嵌套深度相关。", time: "O(n)", space: "O(n)", timeRank: 2, spaceRank: 3, recommended: true }
  ],
  "maximum-subarray": [
    { id: "enumerate", name: "枚举区间", summary: "固定起点并累加所有终点。", tradeoff: "不需要额外空间，适合小输入校验。", time: "O(n²)", space: "O(1)", timeRank: 5, spaceRank: 1 },
    { id: "prefix", name: "前缀最低点", summary: "当前前缀减去此前最小前缀得到候选答案。", tradeoff: "与 Kadane 同为线性，更强调前缀差值视角。", time: "O(n)", space: "O(1)", timeRank: 3, spaceRank: 1 },
    { id: "kadane", name: "Kadane", summary: "维护以当前位置结尾的最优子数组。", tradeoff: "状态最少，最适合流式扫描。", time: "O(n)", space: "O(1)", timeRank: 2, spaceRank: 1, recommended: true }
  ],
  "climbing-stairs": [
    { id: "recursion", name: "朴素递归", summary: "从最后一步递归拆成两个子问题。", tradeoff: "能直接表达递推式，但重复计算严重。", time: "O(2ⁿ)", space: "O(n)", timeRank: 6, spaceRank: 3 },
    { id: "table", name: "DP 数组", summary: "保存每一级台阶的走法数。", tradeoff: "便于观察完整状态，但只需最后两个值。", time: "O(n)", space: "O(n)", timeRank: 3, spaceRank: 3 },
    { id: "rolling", name: "滚动状态", summary: "只保留相邻两个状态。", tradeoff: "保持线性时间并压缩为常数空间。", time: "O(n)", space: "O(1)", timeRank: 2, spaceRank: 1, recommended: true }
  ],
  "best-time-to-buy-and-sell-stock": [
    { id: "pairs", name: "枚举买卖日", summary: "枚举每个合法的买入和卖出组合。", tradeoff: "定义直观，但比较次数为平方级。", time: "O(n²)", space: "O(1)", timeRank: 5, spaceRank: 1 },
    { id: "minimum", name: "最低价扫描", summary: "维护历史最低买入价和当前最大利润。", tradeoff: "一次扫描完成，适用于单次交易约束。", time: "O(n)", space: "O(1)", timeRank: 2, spaceRank: 1, recommended: true }
  ],
  "number-of-islands": [
    { id: "dfs", name: "深度优先", summary: "发现陆地后递归淹没整个连通分量。", tradeoff: "代码紧凑，超大网格要留意递归深度。", time: "O(mn)", space: "O(mn)", timeRank: 3, spaceRank: 4, recommended: true },
    { id: "bfs", name: "广度优先", summary: "用队列逐层访问相邻陆地。", tradeoff: "避免递归深度问题，队列峰值取决于岛屿边界。", time: "O(mn)", space: "O(mn)", timeRank: 3, spaceRank: 4 },
    { id: "union-find", name: "并查集", summary: "把相邻陆地合并并统计连通分量。", tradeoff: "适合动态连通扩展，静态网格实现成本更高。", time: "O(mn α(mn))", space: "O(mn)", timeRank: 4, spaceRank: 4 }
  ],
  "binary-search": [
    { id: "linear", name: "线性扫描", summary: "从头检查直到找到目标值。", tradeoff: "不利用有序性，但对极短数组常数小。", time: "O(n)", space: "O(1)", timeRank: 4, spaceRank: 1 },
    { id: "iterative", name: "迭代二分", summary: "保持闭区间不变量并每次排除一半。", tradeoff: "常数空间，边界条件需要严格一致。", time: "O(log n)", space: "O(1)", timeRank: 1, spaceRank: 1, recommended: true },
    { id: "recursive", name: "递归二分", summary: "把新区间交给下一层调用。", tradeoff: "结构清晰，但调用栈增加对数空间。", time: "O(log n)", space: "O(log n)", timeRank: 1, spaceRank: 2 }
  ]
};
