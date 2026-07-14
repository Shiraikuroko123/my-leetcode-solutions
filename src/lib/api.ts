import type { CatalogProblem, Language, RunResult } from "../types/problem";

export const REASONING_EFFORTS = ["low", "medium", "high", "xhigh", "max", "ultra"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

export type AppConfig = {
  aiEnabled: boolean;
  reasoningEfforts: ReasoningEffort[];
  reasoningDefault: ReasoningEffort;
  runnerEnabled: boolean;
  catalogTotal: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}

export async function runCode(language: Language, code: string, stdin = "", problemSlug?: string) {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language, code, stdin, problemSlug })
  });
  return parseResponse<RunResult>(response);
}

export type ExternalSolution = {
  code: string;
  sourceUrl: string;
  repositoryUrl: string;
  license: string;
  attribution: string;
};

export async function fetchExternalSolution(slug: string, language: Language) {
  const response = await fetch(`/api/solutions/${encodeURIComponent(slug)}/${language}`);
  return parseResponse<ExternalSolution>(response);
}

export async function fetchAppConfig() {
  const response = await fetch("/api/config");
  return parseResponse<AppConfig>(response);
}

export async function askTutor(options: {
  message: string;
  code: string;
  language: Language;
  problem: CatalogProblem;
  summary: string[];
  sessionId: string;
  reasoningEffort: ReasoningEffort;
}) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json", "x-session-id": options.sessionId },
    body: JSON.stringify({
      message: options.message,
      code: options.code,
      language: options.language,
      reasoningEffort: options.reasoningEffort,
      problem: {
        id: options.problem.id,
        title: options.problem.title,
        titleCn: options.problem.titleCn,
        difficulty: options.problem.difficulty,
        tags: options.problem.tags.map((tag) => tag.nameCn),
        summary: options.summary
      }
    })
  });
  return parseResponse<{ answer: string; model: string; reasoningEffort: ReasoningEffort }>(response);
}
