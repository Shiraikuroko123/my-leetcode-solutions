import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
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
  Search,
  Star,
  Target,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
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
import type { Difficulty } from "../types/problem";

type CatalogPageProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

type ViewFilter = "all" | "featured" | "starred" | "solved";
const PAGE_SIZE = 40;

export function CatalogPage({ theme, onToggleTheme }: CatalogPageProps) {
  const progress = useProgress();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [activePath, setActivePath] = useState("all");
  const [view, setView] = useState<ViewFilter>("all");
  const [page, setPage] = useState(1);

  const pathCounts = useMemo(() => {
    return new Map(learningPaths.map((path) => [
      path.slug,
      problems.filter((problem) => problem.tags.some((tag) => (path.tags as readonly string[]).includes(tag.slug))).length
    ]));
  }, []);

  const filteredProblems = useMemo(() => {
    const path = learningPaths.find((item) => item.slug === activePath);
    return problems.filter((problem) => {
      if (difficulty !== "all" && problem.difficulty !== difficulty) return false;
      if (path && !problem.tags.some((tag) => (path.tags as readonly string[]).includes(tag.slug))) return false;
      if (view === "featured" && !isFeatured(problem)) return false;
      if (view === "starred" && !progress.starred.has(problem.slug)) return false;
      if (view === "solved" && !progress.solved.has(problem.slug)) return false;
      if (!deferredSearch) return true;
      const haystack = [
        problem.id,
        problem.title,
        problem.titleCn,
        ...problem.tags.flatMap((tag) => [tag.name, tag.nameCn])
      ].join(" ").toLowerCase();
      return haystack.includes(deferredSearch);
    });
  }, [activePath, deferredSearch, difficulty, progress.solved, progress.starred, view]);

  useEffect(() => setPage(1), [activePath, deferredSearch, difficulty, view]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProblems = filteredProblems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activePathName = learningPaths.find((path) => path.slug === activePath)?.name;

  return (
    <div className="app-shell">
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} />
      <main className="catalog-layout">
        <aside className="catalog-sidebar" id="learning-paths">
          <div className="sidebar-section">
            <h2>浏览题库</h2>
            <button className={activePath === "all" ? "sidebar-link is-active" : "sidebar-link"} type="button" onClick={() => setActivePath("all")}>
              <Database size={16} /><span>全部题目</span><strong>{catalog.total}</strong>
            </button>
            {learningPaths.map((path) => (
              <button className={activePath === path.slug ? "sidebar-link is-active" : "sidebar-link"} type="button" key={path.slug} onClick={() => setActivePath(path.slug)}>
                <span className="path-dot" aria-hidden="true" />
                <span>{path.name}</span>
                <strong>{pathCounts.get(path.slug)}</strong>
              </button>
            ))}
          </div>

          <div className="sidebar-section" id="progress">
            <h2>我的练习</h2>
            <button className={view === "starred" ? "sidebar-link is-active" : "sidebar-link"} type="button" onClick={() => setView(view === "starred" ? "all" : "starred")}>
              <Star size={16} /><span>已收藏</span><strong>{progress.starred.size}</strong>
            </button>
            <button className={view === "solved" ? "sidebar-link is-active" : "sidebar-link"} type="button" onClick={() => setView(view === "solved" ? "all" : "solved")}>
              <CheckCircle2 size={16} /><span>已完成</span><strong>{progress.solved.size}</strong>
            </button>
          </div>
        </aside>

        <section className="catalog-content">
          <header className="catalog-heading">
            <div>
              <p className="catalog-context">{activePathName || "公开算法题库"}</p>
              <h1>{activePathName || "建立你的算法解题系统"}</h1>
              <p>{activePathName ? learningPaths.find((path) => path.slug === activePath)?.description : "从分类选题到双语言编码、运行测试与复盘，保持在一个工作流里。"}</p>
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
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索题号、题名或标签" aria-label="搜索题目" />
              {search && <button type="button" onClick={() => setSearch("")} title="清空搜索" aria-label="清空搜索"><X size={15} /></button>}
            </label>

            <div className="segmented-control" aria-label="难度筛选">
              {(["all", "easy", "medium", "hard"] as const).map((item) => (
                <button type="button" className={difficulty === item ? "is-active" : ""} onClick={() => setDifficulty(item)} key={item}>
                  {item === "all" ? "全部" : item === "easy" ? "简单" : item === "medium" ? "中等" : "困难"}
                </button>
              ))}
            </div>

            <button className={view === "featured" ? "filter-button is-active" : "filter-button"} type="button" onClick={() => setView(view === "featured" ? "all" : "featured")}>
              <Code2 size={16} />深度题解
            </button>
          </div>

          {(activePath !== "all" || view !== "all") && (
            <div className="active-filters">
              <span>{filteredProblems.length} 道结果</span>
              {activePath !== "all" && <button type="button" onClick={() => setActivePath("all")}>{activePathName}<X size={13} /></button>}
              {view !== "all" && <button type="button" onClick={() => setView("all")}>{view === "featured" ? "深度题解" : view === "starred" ? "已收藏" : "已完成"}<X size={13} /></button>}
            </div>
          )}

          <div className="problem-table-wrap">
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
                  return (
                    <tr key={problem.slug}>
                      <td className="status-column">
                        <button className={`status-button${solved ? " is-solved" : attempted ? " is-attempted" : ""}`} type="button" onClick={() => progress.toggleSolved(problem.slug)} title={solved ? "标记为未完成" : "标记为完成"} aria-label={solved ? "标记为未完成" : "标记为完成"}>
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
                        <button className={progress.starred.has(problem.slug) ? "star-button is-starred" : "star-button"} type="button" onClick={() => progress.toggleStarred(problem.slug)} title="收藏题目" aria-label="收藏题目">
                          <Star size={16} fill={progress.starred.has(problem.slug) ? "currentColor" : "none"} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {visibleProblems.length === 0 && (
              <div className="empty-results">
                <Search size={23} />
                <strong>没有匹配的题目</strong>
                <p>调整关键词、难度或学习路径后再试。</p>
                <button type="button" onClick={() => { setSearch(""); setDifficulty("all"); setActivePath("all"); setView("all"); }}>清除筛选</button>
              </div>
            )}
          </div>

          <footer className="pagination">
            <span>共 {filteredProblems.length.toLocaleString()} 道，当前 {currentPage}/{totalPages} 页</span>
            <div>
              <button className="icon-button" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} title="上一页" aria-label="上一页"><ChevronLeft size={17} /></button>
              <button className="icon-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} title="下一页" aria-label="下一页"><ChevronRight size={17} /></button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
