import { type ReactNode, useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Code2,
  Database,
  Languages,
  LockKeyhole,
  Map as MapIcon,
  Search,
  Star,
  Target,
  X
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { DifficultyBadge } from "../components/DifficultyBadge";
import { useProgress } from "../hooks/useProgress";
import type { Theme } from "../hooks/useTheme";
import {
  catalog,
  featuredCount,
  getSolutionLanguages,
  isFeatured,
  learningPaths,
  problems,
  solutionCoverage
} from "../lib/catalog";
import type { CatalogProblem, Difficulty } from "../types/problem";

export type CatalogSection = "catalog" | "paths" | "progress";
type BrowseView = "all" | "featured" | "attempted" | "starred" | "solved";
type ProgressView = "all" | "attempted" | "solved" | "starred";
type ProgressController = ReturnType<typeof useProgress>;

type CatalogPageProps = {
  section: CatalogSection;
  theme: Theme;
  onToggleTheme: () => void;
};

type PathStats = {
  total: number;
  solved: number;
};

const PAGE_SIZE = 40;
const browseViews = new Set<BrowseView>(["all", "featured", "attempted", "starred", "solved"]);
const progressViews = new Set<ProgressView>(["all", "attempted", "solved", "starred"]);
const problemsByPath = new Map<string, CatalogProblem[]>(learningPaths.map((path) => [
  path.slug,
  problems.filter((problem) => problem.tags.some((tag) => (path.tags as readonly string[]).includes(tag.slug)))
]));
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

function browseViewLabel(view: BrowseView) {
  if (view === "featured") return "深度题解";
  if (view === "attempted") return "已尝试";
  if (view === "starred") return "已收藏";
  if (view === "solved") return "已完成";
  return "全部题目";
}

export function CatalogPage({ section, theme, onToggleTheme }: CatalogPageProps) {
  const progress = useProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  const requestedPath = searchParams.get("path");
  const activePath = requestedPath && problemsByPath.has(requestedPath) ? requestedPath : "all";
  const browseView = readBrowseView(searchParams.get("view"));
  const progressView = readProgressView(searchParams.get("view"));
  const activePathItem = learningPaths.find((path) => path.slug === activePath);

  const trackedSlugs = useMemo(
    () => new Set([...progress.attempted, ...progress.solved, ...progress.starred]),
    [progress.attempted, progress.solved, progress.starred]
  );

  const pathStats = useMemo<Map<string, PathStats>>(() => new Map(learningPaths.map((path) => {
    const pathProblems = problemsByPath.get(path.slug) ?? [];
    return [path.slug, {
      total: pathProblems.length,
      solved: pathProblems.filter((problem) => progress.solved.has(problem.slug)).length
    } satisfies PathStats];
  })), [progress.solved]);

  const solvedInLearningPaths = useMemo(
    () => Array.from(learningPathProblemSlugs).filter((slug) => progress.solved.has(slug)).length,
    [progress.solved]
  );

  const browseProblems = useMemo(() => {
    const pathProblems = activePath === "all" ? problems : problemsByPath.get(activePath) ?? [];
    return pathProblems.filter((problem) => {
      if (!matchesSearchAndDifficulty(problem, deferredSearch, difficulty)) return false;
      if (browseView === "featured") return isFeatured(problem);
      if (browseView === "attempted") return progress.attempted.has(problem.slug);
      if (browseView === "starred") return progress.starred.has(problem.slug);
      if (browseView === "solved") return progress.solved.has(problem.slug);
      return true;
    });
  }, [activePath, browseView, deferredSearch, difficulty, progress.attempted, progress.solved, progress.starred]);

  const trackedProblems = useMemo(
    () => problems.filter((problem) => trackedSlugs.has(problem.slug)),
    [trackedSlugs]
  );

  const progressProblems = useMemo(() => trackedProblems.filter((problem) => {
    if (!matchesSearchAndDifficulty(problem, deferredSearch, difficulty)) return false;
    if (progressView === "attempted") return progress.attempted.has(problem.slug);
    if (progressView === "solved") return progress.solved.has(problem.slug);
    if (progressView === "starred") return progress.starred.has(problem.slug);
    return true;
  }), [deferredSearch, difficulty, progress.attempted, progress.solved, progress.starred, progressView, trackedProblems]);

  const setQueryValue = (key: "path" | "view", value: string | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      return next;
    });
  };

  const clearLocalFilters = () => {
    setSearch("");
    setDifficulty("all");
  };

  const clearBrowseFilters = () => {
    clearLocalFilters();
    setSearchParams({});
  };

  const clearProgressFilters = () => {
    clearLocalFilters();
    setQueryValue("view", null);
  };

  return (
    <div className="app-shell">
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} />
      <main className="catalog-layout">
        <CatalogSidebar
          section={section}
          activePath={activePath}
          progressView={progressView}
          progress={progress}
          trackedCount={trackedSlugs.size}
          pathStats={pathStats}
        />

        <section className="catalog-content">
          {section === "catalog" && (
            <CatalogBrowser
              activePath={activePath}
              activePathItem={activePathItem}
              browseView={browseView}
              difficulty={difficulty}
              filteredProblems={browseProblems}
              progress={progress}
              search={search}
              onSearchChange={setSearch}
              onDifficultyChange={setDifficulty}
              onSetQueryValue={setQueryValue}
              onClearFilters={clearBrowseFilters}
            />
          )}

          {section === "paths" && (
            <LearningPathsView
              pathStats={pathStats}
              solvedInLearningPaths={solvedInLearningPaths}
            />
          )}

          {section === "progress" && (
            <ProgressOverview
              difficulty={difficulty}
              filteredProblems={progressProblems}
              progress={progress}
              progressView={progressView}
              search={search}
              trackedCount={trackedSlugs.size}
              onSearchChange={setSearch}
              onDifficultyChange={setDifficulty}
              onSetProgressView={(view) => setQueryValue("view", view)}
              onClearFilters={clearProgressFilters}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function CatalogSidebar({
  section,
  activePath,
  progressView,
  progress,
  trackedCount,
  pathStats
}: {
  section: CatalogSection;
  activePath: string;
  progressView: ProgressView;
  progress: ProgressController;
  trackedCount: number;
  pathStats: Map<string, PathStats>;
}) {
  const sidebarClass = (active: boolean) => active ? "sidebar-link is-active" : "sidebar-link";

  return (
    <aside className="catalog-sidebar" aria-label="题库分类与练习进度">
      <div className="sidebar-section">
        <h2>浏览题库</h2>
        <Link className={sidebarClass(section === "catalog" && activePath === "all")} to="/">
          <Database size={16} /><span>全部题目</span><strong>{catalog.total}</strong>
        </Link>
        {learningPaths.map((path) => (
          <Link
            className={sidebarClass(section === "catalog" && activePath === path.slug)}
            to={`/?path=${path.slug}`}
            key={path.slug}
          >
            <span className="path-dot" aria-hidden="true" />
            <span>{path.name}</span>
            <strong>{pathStats.get(path.slug)?.total ?? 0}</strong>
          </Link>
        ))}
      </div>

      <div className="sidebar-section">
        <h2>我的练习</h2>
        <Link className={sidebarClass(section === "progress" && progressView === "all")} to="/progress">
          <Target size={16} /><span>全部记录</span><strong>{trackedCount}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "attempted")} to="/progress?view=attempted">
          <Code2 size={16} /><span>已尝试</span><strong>{progress.attempted.size}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "starred")} to="/progress?view=starred">
          <Star size={16} /><span>已收藏</span><strong>{progress.starred.size}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "solved")} to="/progress?view=solved">
          <CheckCircle2 size={16} /><span>已完成</span><strong>{progress.solved.size}</strong>
        </Link>
      </div>
    </aside>
  );
}

function CatalogBrowser({
  activePath,
  activePathItem,
  browseView,
  difficulty,
  filteredProblems,
  progress,
  search,
  onSearchChange,
  onDifficultyChange,
  onSetQueryValue,
  onClearFilters
}: {
  activePath: string;
  activePathItem: (typeof learningPaths)[number] | undefined;
  browseView: BrowseView;
  difficulty: "all" | Difficulty;
  filteredProblems: CatalogProblem[];
  progress: ProgressController;
  search: string;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: "all" | Difficulty) => void;
  onSetQueryValue: (key: "path" | "view", value: string | null) => void;
  onClearFilters: () => void;
}) {
  return (
    <>
      <header className="catalog-heading">
        <div>
          <p className="catalog-context">{activePathItem?.name || "公开算法题库"}</p>
          <h1>{activePathItem?.name || "建立你的算法解题系统"}</h1>
          <p>{activePathItem?.description || "从分类选题到双语言编码、运行测试与复盘，保持在一个工作流里。"}</p>
        </div>
        <div className="sync-note" title={`同步时间：${new Date(catalog.syncedAt).toLocaleString("zh-CN")}`}>
          <span className="sync-dot" />已同步 LeetCode CN 公开目录
        </div>
      </header>

      <div className="stats-strip" aria-label="题库统计">
        <div><Database size={17} /><span><strong>{catalog.total.toLocaleString()}</strong> 道公开目录</span></div>
        <div><BookOpen size={17} /><span><strong>{featuredCount}</strong> 道深度题解</span></div>
        <div title={`Python ${solutionCoverage.counts.python.toLocaleString()} · C++ ${solutionCoverage.counts.cpp.toLocaleString()}`}>
          <Languages size={17} /><span><strong>{solutionCoverage.counts.both.toLocaleString()}</strong> 道双语参考</span>
        </div>
        <div><Target size={17} /><span><strong>{progress.solved.size}</strong> 道已完成</span></div>
      </div>

      <div className="catalog-toolbar">
        <SearchField value={search} onChange={onSearchChange} />
        <DifficultyFilter value={difficulty} onChange={onDifficultyChange} />
        <button
          className={browseView === "featured" ? "filter-button is-active" : "filter-button"}
          type="button"
          onClick={() => onSetQueryValue("view", browseView === "featured" ? null : "featured")}
        >
          <Code2 size={16} />深度题解
        </button>
      </div>

      {(activePath !== "all" || browseView !== "all") && (
        <div className="active-filters" aria-live="polite">
          <span>{filteredProblems.length} 道结果</span>
          {activePath !== "all" && (
            <button type="button" onClick={() => onSetQueryValue("path", null)}>
              {activePathItem?.name}<X size={13} />
            </button>
          )}
          {browseView !== "all" && (
            <button type="button" onClick={() => onSetQueryValue("view", null)}>
              {browseViewLabel(browseView)}<X size={13} />
            </button>
          )}
        </div>
      )}

      <ProblemResults
        key={`${activePath}:${browseView}:${difficulty}:${search}`}
        problems={filteredProblems}
        progress={progress}
        emptyIcon={<Search size={23} />}
        emptyTitle="没有匹配的题目"
        emptyDescription="调整关键词、难度或学习路径后再试。"
        emptyAction={<button type="button" onClick={onClearFilters}>清除筛选</button>}
      />
    </>
  );
}

function LearningPathsView({
  pathStats,
  solvedInLearningPaths
}: {
  pathStats: Map<string, PathStats>;
  solvedInLearningPaths: number;
}) {
  const overallPercent = learningPathProblemSlugs.size
    ? Math.round((solvedInLearningPaths / learningPathProblemSlugs.size) * 100)
    : 0;

  return (
    <>
      <header className="catalog-heading">
        <div>
          <p className="catalog-context">学习路径</p>
          <h1>按知识体系逐步练习</h1>
          <p>从基础数据结构到动态规划，按主题集中练习并查看每条路径的完成情况。</p>
        </div>
        <Link className="secondary-button heading-action" to="/">
          浏览全部题目<ArrowRight size={15} />
        </Link>
      </header>

      <div className="stats-strip" aria-label="学习路径统计">
        <div><MapIcon size={17} /><span><strong>{learningPaths.length}</strong> 条学习路径</span></div>
        <div><BookOpen size={17} /><span><strong>{learningPathProblemSlugs.size.toLocaleString()}</strong> 道覆盖题目</span></div>
        <div><CheckCircle2 size={17} /><span><strong>{solvedInLearningPaths}</strong> 道已完成</span></div>
        <div><Target size={17} /><span><strong>{overallPercent}%</strong> 总体进度</span></div>
      </div>

      <div className="learning-path-list" aria-label="全部学习路径">
        <div className="learning-path-list__header" aria-hidden="true">
          <span>路径</span><span>完成情况</span><span>操作</span>
        </div>
        <ol>
          {learningPaths.map((path) => {
            const stats = pathStats.get(path.slug) ?? { total: 0, solved: 0 };
            const percent = stats.total ? Math.round((stats.solved / stats.total) * 100) : 0;
            return (
              <li className="learning-path-row" key={path.slug}>
                <div className="learning-path-copy">
                  <span className="path-dot" aria-hidden="true" />
                  <div>
                    <h2>{path.name}</h2>
                    <p>{path.description}</p>
                  </div>
                </div>
                <div className="path-progress-summary">
                  <div className="path-progress-label">
                    <span>{stats.solved}/{stats.total} 已完成</span>
                    <strong>{percent}%</strong>
                  </div>
                  <div
                    className="path-progress-track"
                    role="progressbar"
                    aria-label={`${path.name}完成进度`}
                    aria-valuemin={0}
                    aria-valuemax={stats.total}
                    aria-valuenow={stats.solved}
                  >
                    <span style={{ width: `${percent}%` }} />
                  </div>
                </div>
                <Link className="path-action" to={`/?path=${path.slug}`}>
                  {stats.solved ? "继续练习" : "开始练习"}<ArrowRight size={15} />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

function ProgressOverview({
  difficulty,
  filteredProblems,
  progress,
  progressView,
  search,
  trackedCount,
  onSearchChange,
  onDifficultyChange,
  onSetProgressView,
  onClearFilters
}: {
  difficulty: "all" | Difficulty;
  filteredProblems: CatalogProblem[];
  progress: ProgressController;
  progressView: ProgressView;
  search: string;
  trackedCount: number;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: "all" | Difficulty) => void;
  onSetProgressView: (value: ProgressView) => void;
  onClearFilters: () => void;
}) {
  const completionRate = progress.attempted.size
    ? Math.round((progress.solved.size / progress.attempted.size) * 100)
    : 0;
  const hasAnyProgress = trackedCount > 0;
  const emptyTitle = hasAnyProgress ? "没有匹配的练习记录" : "还没有练习记录";
  const emptyDescription = hasAnyProgress
    ? "调整状态、关键词或难度后再试。"
    : "选择一道题开始编码，尝试、完成和收藏状态会保存在当前浏览器中。";

  return (
    <>
      <header className="catalog-heading">
        <div>
          <p className="catalog-context">我的进度</p>
          <h1>查看你的练习进度</h1>
          <p>集中查看已经尝试、完成或收藏的题目，继续上次的练习。</p>
        </div>
        <Link className="secondary-button heading-action" to="/">
          继续选题<ArrowRight size={15} />
        </Link>
      </header>

      <div className="stats-strip" aria-label="练习进度统计">
        <div><Code2 size={17} /><span><strong>{progress.attempted.size}</strong> 道已尝试</span></div>
        <div><CheckCircle2 size={17} /><span><strong>{progress.solved.size}</strong> 道已完成</span></div>
        <div><Star size={17} /><span><strong>{progress.starred.size}</strong> 道已收藏</span></div>
        <div><Target size={17} /><span><strong>{completionRate}%</strong> 完成率</span></div>
      </div>

      <div className="catalog-toolbar progress-toolbar">
        <SearchField value={search} onChange={onSearchChange} />
        <nav className="segmented-control progress-filter" aria-label="练习状态筛选">
          {([
            ["all", "全部记录"],
            ["attempted", "已尝试"],
            ["solved", "已完成"],
            ["starred", "已收藏"]
          ] as const).map(([value, label]) => (
            <Link
              className={progressView === value ? "is-active" : ""}
              aria-current={progressView === value ? "page" : undefined}
              to={value === "all" ? "/progress" : `/progress?view=${value}`}
              key={value}
            >
              {label}
            </Link>
          ))}
        </nav>
        <DifficultyFilter value={difficulty} onChange={onDifficultyChange} />
      </div>

      {hasAnyProgress && (
        <div className="active-filters" aria-live="polite">
          <span>{filteredProblems.length} 道记录</span>
          {progressView !== "all" && (
            <button type="button" onClick={() => onSetProgressView("all")}>
              {browseViewLabel(progressView)}<X size={13} />
            </button>
          )}
        </div>
      )}

      <ProblemResults
        key={`${progressView}:${difficulty}:${search}`}
        problems={filteredProblems}
        progress={progress}
        emptyIcon={<Target size={24} />}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={hasAnyProgress
          ? <button type="button" onClick={onClearFilters}>清除筛选</button>
          : <Link className="primary-button" to="/">去题库选题<ArrowRight size={15} /></Link>}
      />
    </>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="search-field">
      <Search size={17} aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="搜索题号、题名或标签" aria-label="搜索题目" />
      {value && (
        <button type="button" onClick={() => onChange("")} title="清空搜索" aria-label="清空搜索">
          <X size={15} />
        </button>
      )}
    </label>
  );
}

function DifficultyFilter({
  value,
  onChange
}: {
  value: "all" | Difficulty;
  onChange: (value: "all" | Difficulty) => void;
}) {
  return (
    <div className="segmented-control" aria-label="难度筛选">
      {(["all", "easy", "medium", "hard"] as const).map((item) => (
        <button type="button" className={value === item ? "is-active" : ""} onClick={() => onChange(item)} key={item}>
          {item === "all" ? "全部" : item === "easy" ? "简单" : item === "medium" ? "中等" : "困难"}
        </button>
      ))}
    </div>
  );
}

function ProblemResults({
  problems: resultProblems,
  progress,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction
}: {
  problems: CatalogProblem[];
  progress: ProgressController;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(resultProblems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProblems = resultProblems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <div className="problem-table-wrap">
        {visibleProblems.length > 0 ? (
          <table className="problem-table">
            <thead>
              <tr>
                <th className="status-column"><span className="sr-only">完成状态</span></th>
                <th className="id-column">题号</th>
                <th>题目</th>
                <th className="solution-column">题解</th>
                <th className="difficulty-column">难度</th>
                <th className="acceptance-column">通过率</th>
                <th className="star-column"><span className="sr-only">收藏</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleProblems.map((problem) => {
                const solved = progress.solved.has(problem.slug);
                const attempted = progress.attempted.has(problem.slug);
                const solutionLanguages = getSolutionLanguages(problem);
                const solvedLabel = solved ? "标记为未完成" : "标记为完成";
                const starred = progress.starred.has(problem.slug);
                return (
                  <tr key={problem.slug}>
                    <td className="status-column">
                      <button
                        className={`status-button${solved ? " is-solved" : attempted ? " is-attempted" : ""}`}
                        type="button"
                        onClick={() => progress.toggleSolved(problem.slug)}
                        title={solvedLabel}
                        aria-label={`${solvedLabel}：${problem.titleCn}`}
                      >
                        {solved ? <Check size={15} /> : <Circle size={15} />}
                      </button>
                    </td>
                    <td className="id-column">{problem.id}</td>
                    <td>
                      <Link className="problem-title-link" to={`/problems/${problem.slug}`}>
                        <span>{problem.titleCn}</span>
                        <small>{problem.title}</small>
                      </Link>
                      <div className="problem-tags">
                        {problem.tags.slice(0, 3).map((tag) => <span key={tag.slug}>{tag.nameCn}</span>)}
                        {problem.paidOnly && <span><LockKeyhole size={11} />会员</span>}
                      </div>
                    </td>
                    <td className="solution-column">
                      {isFeatured(problem) ? (
                        <span className="coverage coverage--deep">深度题解</span>
                      ) : solutionLanguages.length === 2 ? (
                        <span className="coverage">双语参考</span>
                      ) : solutionLanguages[0] ? (
                        <span className="coverage">{solutionLanguages[0] === "python" ? "Python" : "C++"}</span>
                      ) : <span className="coverage coverage--muted">暂无代码</span>}
                    </td>
                    <td className="difficulty-column"><DifficultyBadge difficulty={problem.difficulty} /></td>
                    <td className="acceptance-column">{problem.acceptance.toFixed(1)}%</td>
                    <td className="star-column">
                      <button
                        className={starred ? "star-button is-starred" : "star-button"}
                        type="button"
                        onClick={() => progress.toggleStarred(problem.slug)}
                        title={starred ? "取消收藏" : "收藏题目"}
                        aria-label={`${starred ? "取消收藏" : "收藏题目"}：${problem.titleCn}`}
                      >
                        <Star size={16} fill={starred ? "currentColor" : "none"} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-results">
            {emptyIcon}
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
            {emptyAction}
          </div>
        )}
      </div>

      {resultProblems.length > 0 && (
        <footer className="pagination">
          <span>共 {resultProblems.length.toLocaleString()} 道，当前 {currentPage}/{totalPages} 页</span>
          <div>
            <button className="icon-button" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} title="上一页" aria-label="上一页"><ChevronLeft size={17} /></button>
            <button className="icon-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} title="下一页" aria-label="下一页"><ChevronRight size={17} /></button>
          </div>
        </footer>
      )}
    </>
  );
}
