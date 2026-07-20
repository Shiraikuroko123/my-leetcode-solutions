export type AlgorithmRelation = {
  source: string;
  target: string;
  label: string;
};

export const algorithmNodeLayout = {
  array: { x: 20, y: 150, code: "ARR" },
  "two-pointers": { x: 230, y: 30, code: "PTR" },
  "sliding-window": { x: 230, y: 190, code: "WIN" },
  stack: { x: 230, y: 350, code: "STK" },
  "binary-search": { x: 470, y: 30, code: "BIN" },
  "linked-list": { x: 470, y: 350, code: "LST" },
  tree: { x: 690, y: 145, code: "TRE" },
  graph: { x: 920, y: 65, code: "GRF" },
  "dynamic-programming": { x: 920, y: 285, code: "DYN" },
  greedy: { x: 690, y: 350, code: "GRD" }
} as const;

export const algorithmRelations: AlgorithmRelation[] = [
  { source: "array", target: "two-pointers", label: "有序收缩" },
  { source: "array", target: "sliding-window", label: "连续区间" },
  { source: "array", target: "stack", label: "局部状态" },
  { source: "two-pointers", target: "binary-search", label: "单调边界" },
  { source: "sliding-window", target: "dynamic-programming", label: "区间状态" },
  { source: "stack", target: "linked-list", label: "指针历史" },
  { source: "stack", target: "tree", label: "递归展开" },
  { source: "binary-search", target: "tree", label: "有序结构" },
  { source: "linked-list", target: "tree", label: "节点关系" },
  { source: "tree", target: "graph", label: "从层级到连通" },
  { source: "tree", target: "dynamic-programming", label: "树形状态" },
  { source: "greedy", target: "dynamic-programming", label: "选择与状态" },
  { source: "graph", target: "dynamic-programming", label: "路径状态" }
];
