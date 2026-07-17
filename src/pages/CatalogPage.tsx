import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { CatalogSidebar } from "../components/catalog/CatalogSidebar";
import { CatalogBrowser, LearningPathsView, ProgressOverview } from "../components/catalog/CatalogViews";
import type { BrowseView, CatalogSection, PathStats, ProgressView } from "../components/catalog/types";
import { useProgress } from "../hooks/useProgress";
import type { Theme } from "../hooks/useTheme";
import { isFeatured, learningPaths, problems } from "../lib/catalog";
import type { CatalogProblem, Difficulty } from "../types/problem";

export type { CatalogSection } from "../components/catalog/types";

type CatalogPageProps = {
  section: CatalogSection;
  theme: Theme;
  onToggleTheme: () => void;
};

const EMPTY_PROBLEMS: CatalogProblem[] = [];
const browseViews = new Set<BrowseView>(["all", "featured", "attempted", "starred", "solved"]);
const progressViews = new Set<ProgressView>(["all", "attempted", "solved", "starred"]);
const problemsByPath = new Map<string, CatalogProblem[]>(learningPaths.map((path) => [
  path.slug,
  problems.filter((problem) => problem.tags.some((tag) => (path.tags as readonly string[]).includes(tag.slug)))
]));
const learningPathBySlug = new Map<string, (typeof learningPaths)[number]>(learningPaths.map((path) => [path.slug, path]));
const learningPathProblemSlugs = new Set(
  Array.from(problemsByPath.values()).flatMap((pathProblems) => pathProblems.map((problem) => problem.slug))
);

function readBrowseView(value: string | null): BrowseView {
  return value && browseViews.has(value as BrowseView) ? value as BrowseView : "all";
}

function readProgressView(value: string | null): ProgressView {
  return value && progressViews.has(value as ProgressView) ? value as ProgressView : "all";
}

function matchesSearchAndDifficulty(problem: CatalogProblem, search: string, difficulty: "all" | Difficulty) {
  if (difficulty !== "all" && problem.difficulty !== difficulty) return false;
  if (!search) return true;
  return [
    problem.id,
    problem.title,
    problem.titleCn,
    ...problem.tags.flatMap((tag) => [tag.name, tag.nameCn])
  ].join(" ").toLowerCase().includes(search);
}

export function CatalogPage({ section, theme, onToggleTheme }: CatalogPageProps) {
  const progress = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  const requestedPath = searchParams.get("path");
  const activePath = requestedPath && problemsByPath.has(requestedPath) ? requestedPath : "all";
  const activePathItem = activePath === "all" ? undefined : learningPathBySlug.get(activePath);
  const browseView = readBrowseView(searchParams.get("view"));
  const progressView = readProgressView(searchParams.get("view"));

  const trackedSlugs = useMemo(
    () => new Set([...progress.attempted, ...progress.solved, ...progress.starred]),
    [progress.attempted, progress.solved, progress.starred]
  );

  const pathStats = useMemo<Map<string, PathStats>>(() => new Map(learningPaths.map((path) => {
    const pathProblems = problemsByPath.get(path.slug) ?? EMPTY_PROBLEMS;
    return [path.slug, {
      total: pathProblems.length,
      solved: pathProblems.filter((problem) => progress.solved.has(problem.slug)).length
    } satisfies PathStats];
  })), [progress.solved]);

  const solvedInLearningPaths = useMemo(
    () => Array.from(learningPathProblemSlugs).filter((slug) => progress.solved.has(slug)).length,
    [progress.solved]
  );

  const filteredProblems = useMemo(() => {
    if (section === "paths") return EMPTY_PROBLEMS;

    if (section === "catalog") {
      const pathProblems = activePath === "all" ? problems : problemsByPath.get(activePath) ?? EMPTY_PROBLEMS;
      return pathProblems.filter((problem) => {
        if (!matchesSearchAndDifficulty(problem, deferredSearch, difficulty)) return false;
        if (browseView === "featured") return isFeatured(problem);
        if (browseView === "attempted") return progress.attempted.has(problem.slug);
        if (browseView === "starred") return progress.starred.has(problem.slug);
        if (browseView === "solved") return progress.solved.has(problem.slug);
        return true;
      });
    }

    return problems.filter((problem) => {
      if (!trackedSlugs.has(problem.slug)) return false;
      if (!matchesSearchAndDifficulty(problem, deferredSearch, difficulty)) return false;
      if (progressView === "attempted") return progress.attempted.has(problem.slug);
      if (progressView === "solved") return progress.solved.has(problem.slug);
      if (progressView === "starred") return progress.starred.has(problem.slug);
      return true;
    });
  }, [
    activePath,
    browseView,
    deferredSearch,
    difficulty,
    progress.attempted,
    progress.solved,
    progress.starred,
    progressView,
    section,
    trackedSlugs
  ]);

  const setQueryValue = useCallback((key: "path" | "view", value: string | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      return next;
    });
  }, [setSearchParams]);

  const clearLocalFilters = useCallback(() => {
    setSearch("");
    setDifficulty("all");
  }, []);

  const clearBrowseFilters = useCallback(() => {
    clearLocalFilters();
    setSearchParams({});
  }, [clearLocalFilters, setSearchParams]);

  const clearProgressFilters = useCallback(() => {
    clearLocalFilters();
    setQueryValue("view", null);
  }, [clearLocalFilters, setQueryValue]);

  const setProgressView = useCallback((view: ProgressView) => {
    setQueryValue("view", view);
  }, [setQueryValue]);

  return (
    <div className="app-shell">
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} />
      <main className="catalog-layout">
        <CatalogSidebar
          section={section}
          activePath={activePath}
          progressView={progressView}
          trackedCount={trackedSlugs.size}
          attemptedCount={progress.attempted.size}
          starredCount={progress.starred.size}
          solvedCount={progress.solved.size}
          pathStats={pathStats}
        />

        <section className="catalog-content">
          {section === "catalog" ? (
            <CatalogBrowser
              activePath={activePath}
              activePathItem={activePathItem}
              browseView={browseView}
              difficulty={difficulty}
              filteredProblems={filteredProblems}
              progress={progress}
              search={search}
              onSearchChange={setSearch}
              onDifficultyChange={setDifficulty}
              onSetQueryValue={setQueryValue}
              onClearFilters={clearBrowseFilters}
            />
          ) : section === "paths" ? (
            <LearningPathsView
              pathStats={pathStats}
              solvedInLearningPaths={solvedInLearningPaths}
              learningPathProblemCount={learningPathProblemSlugs.size}
            />
          ) : (
            <ProgressOverview
              difficulty={difficulty}
              filteredProblems={filteredProblems}
              progress={progress}
              progressView={progressView}
              search={search}
              trackedCount={trackedSlugs.size}
              onSearchChange={setSearch}
              onDifficultyChange={setDifficulty}
              onSetProgressView={setProgressView}
              onClearFilters={clearProgressFilters}
            />
          )}
        </section>
      </main>
    </div>
  );
}
