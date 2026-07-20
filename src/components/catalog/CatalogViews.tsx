import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Map as MapIcon,
  Search,
  Star,
  Target,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import type { ProgressController } from "../../hooks/useProgress";
import { learningPaths } from "../../lib/catalog";
import type { CatalogProblem, Difficulty } from "../../types/problem";
import { AlgorithmAtlas } from "./AlgorithmAtlas";
import { CatalogControls, DifficultyFilter, SearchField } from "./CatalogControls";
import { EmptyResults, ProblemResults } from "./ProblemResults";
import type { BrowseView, PathStats, ProgressView } from "./types";

type LearningPath = (typeof learningPaths)[number];

function browseViewLabel(view: BrowseView) {
  if (view === "featured") return "深度题解";
  if (view === "attempted") return "已尝试";
  if (view === "starred") return "已收藏";
  if (view === "solved") return "已完成";
  return "全部题目";
}

function StatsStrip({ label, children }: { label: string; children: ReactNode }) {
  return <div className="stats-strip" aria-label={label}>{children}</div>;
}

function StatItem({ icon, children, title }: { icon: ReactNode; children: ReactNode; title?: string }) {
  return <div title={title}>{icon}<span>{children}</span></div>;
}

export function CatalogBrowser({
  activePath,
  activePathItem,
  browseView,
  difficulty,
  filteredProblems,
  pathStats,
  progress,
  search,
  onSearchChange,
  onDifficultyChange,
  onSetQueryValue,
  onClearFilters
}: {
  activePath: string;
  activePathItem: LearningPath | undefined;
  browseView: BrowseView;
  difficulty: "all" | Difficulty;
  filteredProblems: CatalogProblem[];
  pathStats: ReadonlyMap<string, PathStats>;
  progress: ProgressController;
  search: string;
  onSearchChange: (value: string) => void;
  onDifficultyChange: (value: "all" | Difficulty) => void;
  onSetQueryValue: (key: "path" | "view", value: string | null) => void;
  onClearFilters: () => void;
}) {
  const explorePath = (slug: string) => {
    onSetQueryValue("path", slug);
    window.requestAnimationFrame(() => {
      document.getElementById("problem-explorer")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });
  };

  return (
    <>
      <AlgorithmAtlas activePath={activePath} pathStats={pathStats} progress={progress} onExplorePath={explorePath} />

      <section className="problem-explorer" id="problem-explorer" aria-labelledby="problem-explorer-title">
        <header className="problem-explorer-heading">
          <div>
            <h2 id="problem-explorer-title">{activePathItem?.name || "题目索引"}</h2>
            <p>{activePathItem?.description || "按题号、题型和难度进入练习工作台。"}</p>
          </div>
          <strong>{filteredProblems.length.toLocaleString()}<span> 个结果</span></strong>
        </header>

        <CatalogControls>
          <SearchField value={search} onChange={onSearchChange} />
          <DifficultyFilter value={difficulty} onChange={onDifficultyChange} />
          <button
            className={browseView === "featured" ? "filter-button is-active" : "filter-button"}
            type="button"
            onClick={() => onSetQueryValue("view", browseView === "featured" ? null : "featured")}
          >
            <Code2 size={16} />深度题解
          </button>
        </CatalogControls>

        {activePath !== "all" || browseView !== "all" ? (
          <div className="active-filters" aria-live="polite">
            <span>{filteredProblems.length} 道结果</span>
            {activePath !== "all" ? (
              <button type="button" onClick={() => onSetQueryValue("path", null)}>
                {activePathItem?.name}<X size={13} />
              </button>
            ) : null}
            {browseView !== "all" ? (
              <button type="button" onClick={() => onSetQueryValue("view", null)}>
                {browseViewLabel(browseView)}<X size={13} />
              </button>
            ) : null}
          </div>
        ) : null}

        <ProblemResults key={`${activePath}:${browseView}:${difficulty}:${search}`} problems={filteredProblems} progress={progress}>
          <EmptyResults icon={<Search size={23} />} title="没有匹配的题目" description="调整关键词、难度或学习路径后再试。">
            <button type="button" onClick={onClearFilters}>清除筛选</button>
          </EmptyResults>
        </ProblemResults>
      </section>
    </>
  );
}

export function LearningPathsView({
  pathStats,
  solvedInLearningPaths,
  learningPathProblemCount
}: {
  pathStats: ReadonlyMap<string, PathStats>;
  solvedInLearningPaths: number;
  learningPathProblemCount: number;
}) {
  const overallPercent = learningPathProblemCount
    ? Math.round((solvedInLearningPaths / learningPathProblemCount) * 100)
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

      <StatsStrip label="学习路径统计">
        <StatItem icon={<MapIcon size={17} />}><strong>{learningPaths.length}</strong> 条学习路径</StatItem>
        <StatItem icon={<BookOpen size={17} />}><strong>{learningPathProblemCount.toLocaleString()}</strong> 道覆盖题目</StatItem>
        <StatItem icon={<CheckCircle2 size={17} />}><strong>{solvedInLearningPaths}</strong> 道已完成</StatItem>
        <StatItem icon={<Target size={17} />}><strong>{overallPercent}%</strong> 总体进度</StatItem>
      </StatsStrip>

      <div className="learning-path-list" aria-label="全部学习路径">
        <div className="learning-path-list__header" aria-hidden="true">
          <span>路径</span><span>完成情况</span><span>操作</span>
        </div>
        <ol>
          {learningPaths.map((path) => {
            const stats = pathStats.get(path.slug) ?? { total: 0, attempted: 0, solved: 0 };
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

export function ProgressOverview({
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

      <StatsStrip label="练习进度统计">
        <StatItem icon={<Code2 size={17} />}><strong>{progress.attempted.size}</strong> 道已尝试</StatItem>
        <StatItem icon={<CheckCircle2 size={17} />}><strong>{progress.solved.size}</strong> 道已完成</StatItem>
        <StatItem icon={<Star size={17} />}><strong>{progress.starred.size}</strong> 道已收藏</StatItem>
        <StatItem icon={<Target size={17} />}><strong>{completionRate}%</strong> 完成率</StatItem>
      </StatsStrip>

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

      {hasAnyProgress ? (
        <div className="active-filters" aria-live="polite">
          <span>{filteredProblems.length} 道记录</span>
          {progressView !== "all" ? (
            <button type="button" onClick={() => onSetProgressView("all")}>
              {browseViewLabel(progressView)}<X size={13} />
            </button>
          ) : null}
        </div>
      ) : null}

      <ProblemResults key={`${progressView}:${difficulty}:${search}`} problems={filteredProblems} progress={progress}>
        <EmptyResults icon={<Target size={24} />} title={emptyTitle} description={emptyDescription}>
          {hasAnyProgress
            ? <button type="button" onClick={onClearFilters}>清除筛选</button>
            : <Link className="primary-button" to="/">去题库选题<ArrowRight size={15} /></Link>}
        </EmptyResults>
      </ProblemResults>
    </>
  );
}
