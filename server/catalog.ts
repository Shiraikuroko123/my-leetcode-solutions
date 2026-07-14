import { readFileSync } from "node:fs";
import path from "node:path";
import type { CatalogPayload, CatalogProblem } from "../src/types/problem";

const catalogPath = path.resolve("src/data/catalog.json");
export const serverCatalog = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogPayload;
export const serverProblemBySlug = new Map<string, CatalogProblem>(
  serverCatalog.questions.map((problem) => [problem.slug, problem])
);
