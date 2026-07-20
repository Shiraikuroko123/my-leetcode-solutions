import catalogJson from "../data/catalog.json";
import { featuredProblems, featuredSlugs } from "../data/featuredProblems";
import solutionCoverageJson from "../data/solution-coverage.json";
import type { CatalogPayload, CatalogProblem, Language } from "../types/problem";

type SolutionCoveragePayload = {
  syncedAt: string;
  counts: { problems: number; python: number; cpp: number; both: number };
  byId: Record<string, Language[]>;
};

export const catalog = catalogJson as CatalogPayload;
export const problems = catalog.questions;
export const problemBySlug = new Map(problems.map((problem) => [problem.slug, problem]));
export const solutionCoverage = solutionCoverageJson as SolutionCoveragePayload;
export const featuredCount = featuredSlugs.size;

export const learningPaths = [
  { slug: "array", name: "数组与哈希", tags: ["array", "hash-table"], description: "索引、计数与快速查找" },
  { slug: "two-pointers", name: "双指针", tags: ["two-pointers"], description: "用有序结构缩小搜索空间" },
  { slug: "sliding-window", name: "滑动窗口", tags: ["sliding-window"], description: "维护连续区间的不变量" },
  { slug: "stack", name: "栈与单调栈", tags: ["stack", "monotonic-stack"], description: "处理嵌套与最近关系" },
  { slug: "binary-search", name: "二分查找", tags: ["binary-search"], description: "在单调性中定位边界" },
  { slug: "linked-list", name: "链表", tags: ["linked-list"], description: "指针重排与快慢指针" },
  { slug: "tree", name: "树与递归", tags: ["tree", "binary-tree", "binary-search-tree"], description: "遍历、分治与层序结构" },
  { slug: "graph", name: "图与搜索", tags: ["graph", "depth-first-search", "breadth-first-search", "union-find"], description: "连通性与最短路径" },
  { slug: "dynamic-programming", name: "动态规划", tags: ["dynamic-programming"], description: "状态定义、转移与空间优化" },
  { slug: "greedy", name: "贪心", tags: ["greedy"], description: "局部最优与正确性证明" }
] as const;

export const problemsByLearningPath = new Map<string, CatalogProblem[]>(learningPaths.map((path) => [
  path.slug,
  problems.filter((problem) => problem.tags.some((tag) => (path.tags as readonly string[]).includes(tag.slug)))
]));

export function isFeatured(problem: CatalogProblem) {
  return featuredSlugs.has(problem.slug);
}

export function getFeaturedProblem(slug: string) {
  return featuredProblems[slug];
}

export function getSolutionLanguages(problem: CatalogProblem): readonly Language[] {
  if (featuredSlugs.has(problem.slug)) return ["python", "cpp"];
  return solutionCoverage.byId[problem.id] || [];
}

export function officialProblemUrl(problem: CatalogProblem) {
  return `https://leetcode.cn/problems/${problem.slug}/`;
}

export function numericProblemId(problem: CatalogProblem) {
  return /^\d+$/.test(problem.id) ? Number(problem.id) : null;
}
