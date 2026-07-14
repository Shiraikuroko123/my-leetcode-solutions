import type { Difficulty } from "../types/problem";

const labels: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难"
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`difficulty difficulty--${difficulty}`}>{labels[difficulty]}</span>;
}
