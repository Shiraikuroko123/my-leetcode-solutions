import { readFileSync } from "node:fs";
import path from "node:path";

type LanguageSource = { path: string; rawUrl: string };
type Manifest = {
  syncedAt: string;
  repository: string;
  repositoryUrl: string;
  license: string;
  counts: { problems: number; python: number; cpp: number; both: number };
  solutions: Record<string, { python?: LanguageSource; cpp?: LanguageSource }>;
};

const manifestPath = path.resolve("server/data/solution-manifest.json");
export const solutionManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
