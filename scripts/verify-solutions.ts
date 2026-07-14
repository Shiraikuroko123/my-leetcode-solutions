import { featuredProblems } from "../src/data/featuredProblems";
import type { Language, RunResult } from "../src/types/problem";

const API_URL = process.env.ALGONOTE_API_URL || "http://127.0.0.1:8787";
const languages: Language[] = ["python", "cpp"];

async function verify(slug: string, language: Language, code: string) {
  const response = await fetch(`${API_URL}/api/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language, code, stdin: "", problemSlug: slug }),
    signal: AbortSignal.timeout(30_000)
  });
  const result = (await response.json()) as RunResult & { error?: string };
  if (!response.ok || result.code !== 0 || !/tests? passed/i.test(result.stdout)) {
    throw new Error(`${slug}/${language} failed: ${result.error || result.stderr || result.stdout}`);
  }
  console.log(`PASS ${slug}/${language} (${result.elapsedMs} ms)`);
}

async function main() {
  for (const problem of Object.values(featuredProblems)) {
    for (const language of languages) {
      await verify(problem.slug, language, problem.solutionCode[language]);
    }
  }
  console.log(`Verified ${Object.keys(featuredProblems).length * languages.length} runnable reference solutions`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
