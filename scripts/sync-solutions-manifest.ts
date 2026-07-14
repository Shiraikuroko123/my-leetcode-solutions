import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_URL = "https://api.github.com/repos/walkccc/LeetCode/git/trees/main?recursive=1";
const OUTPUT = path.resolve("server/data/solution-manifest.json");
const COVERAGE_OUTPUT = path.resolve("src/data/solution-coverage.json");

type TreeItem = { path: string; type: "blob" | "tree"; size?: number };
type TreePayload = { tree: TreeItem[]; truncated: boolean };
type LanguageSource = { path: string; rawUrl: string };
type Entry = { python?: LanguageSource; cpp?: LanguageSource };

function rawUrl(filePath: string) {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/walkccc/LeetCode/main/${encodedPath}`;
}

async function main() {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "AlgoNote solution manifest sync/1.0"
  };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(API_URL, { headers, signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`GitHub tree request failed: ${response.status}`);
  const payload = (await response.json()) as TreePayload;
  if (payload.truncated) throw new Error("GitHub returned a truncated repository tree");

  const solutions: Record<string, Entry> = {};
  for (const item of payload.tree) {
    if (item.type !== "blob") continue;
    const match = item.path.match(/^solutions\/(\d+)\. .+\/(\d+)\.(py|cpp)$/);
    if (!match || match[1] !== match[2]) continue;
    const [, id, , extension] = match;
    if (!id) continue;
    const language = extension === "py" ? "python" : "cpp";
    solutions[id] ||= {};
    solutions[id][language] = { path: item.path, rawUrl: rawUrl(item.path) };
  }

  const entries = Object.values(solutions);
  const counts = {
    problems: entries.length,
    python: entries.filter((entry) => entry.python).length,
    cpp: entries.filter((entry) => entry.cpp).length,
    both: entries.filter((entry) => entry.python && entry.cpp).length
  };
  const syncedAt = new Date().toISOString();
  const metadata = {
    syncedAt,
    repository: "walkccc/LeetCode",
    repositoryUrl: "https://github.com/walkccc/LeetCode",
    license: "MIT",
    counts,
    solutions
  };
  const coverage = {
    syncedAt,
    counts,
    byId: Object.fromEntries(
      Object.entries(solutions).map(([id, entry]) => [
        id,
        [entry.python ? "python" : null, entry.cpp ? "cpp" : null].filter(Boolean)
      ])
    )
  };

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await mkdir(path.dirname(COVERAGE_OUTPUT), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(metadata)}\n`, "utf8");
  await writeFile(COVERAGE_OUTPUT, `${JSON.stringify(coverage)}\n`, "utf8");
  console.log(`Wrote ${metadata.counts.both} dual-language entries to ${OUTPUT}`);
  console.log(`Wrote compact browser coverage to ${COVERAGE_OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
