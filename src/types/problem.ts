export type Difficulty = "easy" | "medium" | "hard";
export type Language = "python" | "cpp";

export type ProblemTag = {
  slug: string;
  name: string;
  nameCn: string;
};

export type CatalogProblem = {
  id: string;
  title: string;
  titleCn: string;
  slug: string;
  difficulty: Difficulty;
  acceptance: number;
  paidOnly: boolean;
  tags: ProblemTag[];
};

export type ProblemExample = {
  input: string;
  output: string;
  explanation?: string;
};

export type FeaturedProblem = {
  slug: string;
  summary: string[];
  examples: ProblemExample[];
  constraints: string[];
  hints: string[];
  approach: {
    title: string;
    intuition: string[];
    steps: string[];
    time: string;
    space: string;
  };
  starterCode: Record<Language, string>;
  solutionCode: Record<Language, string>;
};

export type CatalogPayload = {
  syncedAt: string;
  total: number;
  questions: CatalogProblem[];
};

export type RunResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  elapsedMs?: number;
};
