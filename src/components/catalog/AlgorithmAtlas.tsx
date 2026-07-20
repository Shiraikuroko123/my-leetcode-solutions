import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, Clock3, Network } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProgressController } from "../../hooks/useProgress";
import {
  catalog,
  isFeatured,
  learningPaths,
  problemBySlug,
  problemsByLearningPath
} from "../../lib/catalog";
import { algorithmRelations } from "../../data/algorithmAtlas";
import { AlgorithmMap } from "./AlgorithmMap";
import type { PathStats } from "./types";

const EMPTY_STATS: PathStats = { total: 0, attempted: 0, solved: 0 };

export function AlgorithmAtlas({
  activePath,
  pathStats,
  progress,
  onExplorePath
}: {
  activePath: string;
  pathStats: ReadonlyMap<string, PathStats>;
  progress: ProgressController;
  onExplorePath: (slug: string) => void;
}) {
  const [selectedPath, setSelectedPath] = useState(activePath === "all" ? "array" : activePath);

  useEffect(() => {
    if (activePath !== "all") setSelectedPath(activePath);
  }, [activePath]);

  const selected = learningPaths.find((path) => path.slug === selectedPath) ?? learningPaths[0];
  const selectedStats = pathStats.get(selected.slug) ?? EMPTY_STATS;
  const relatedPaths = useMemo(() => {
    const slugs = algorithmRelations.flatMap((relation) => {
      if (relation.source === selected.slug) return [relation.target];
      if (relation.target === selected.slug) return [relation.source];
      return [];
    });
    return learningPaths.filter((path) => slugs.includes(path.slug));
  }, [selected.slug]);

  const representativeProblems = useMemo(() => {
    const pathProblems = problemsByLearningPath.get(selected.slug) ?? [];
    return [
      ...pathProblems.filter(isFeatured),
      ...pathProblems.filter((problem) => !isFeatured(problem))
    ].slice(0, 3);
  }, [selected.slug]);

  const recentProblems = useMemo(() => Array.from(progress.attempted)
    .reverse()
    .map((slug) => problemBySlug.get(slug))
    .filter((problem) => Boolean(problem))
    .slice(0, 4), [progress.attempted]);

  const capabilityPaths = useMemo(() => [...learningPaths].sort((left, right) => {
    const leftStats = pathStats.get(left.slug) ?? EMPTY_STATS;
    const rightStats = pathStats.get(right.slug) ?? EMPTY_STATS;
    return rightStats.attempted - leftStats.attempted || rightStats.solved - leftStats.solved;
  }), [pathStats]);

  return (
    <section className="atlas-overview" aria-labelledby="atlas-title">
      <header className="atlas-heading">
        <div>
          <p className="atlas-context"><Network size={15} />算法技术图谱</p>
          <h1 id="atlas-title">看见题型之间的迁移路径</h1>
          <p>从数据结构出发，沿着不变量、搜索空间和状态转移选择下一道题。</p>
        </div>
        <div className="atlas-source" title={`同步时间：${new Date(catalog.syncedAt).toLocaleString("zh-CN")}`}>
          <span>{learningPaths.length} 条路径</span>
          <span>{catalog.total.toLocaleString()} 道题</span>
          <small>LeetCode CN 公开目录</small>
        </div>
      </header>

      <div className="atlas-layout">
        <section className="atlas-map-panel" aria-labelledby="atlas-map-title">
          <header className="atlas-tool-header">
            <div>
              <h2 id="atlas-map-title">题型关系</h2>
              <span>节点选择会重绘相关路径</span>
            </div>
            <span className="atlas-selection-code">SELECT {selected.slug}</span>
          </header>

          <AlgorithmMap pathStats={pathStats} selectedPath={selected.slug} onSelectPath={setSelectedPath} />

          <div className="atlas-node-inspector" aria-live="polite">
            <div className="atlas-node-summary">
              <span>{selected.description}</span>
              <h3>{selected.name}</h3>
              <p><strong>{selectedStats.total.toLocaleString()}</strong> 题收录，<strong>{selectedStats.attempted}</strong> 题已尝试，<strong>{selectedStats.solved}</strong> 题已完成</p>
            </div>
            <div className="atlas-relations" aria-label={`${selected.name}关联题型`}>
              {relatedPaths.map((path) => (
                <button type="button" onClick={() => setSelectedPath(path.slug)} key={path.slug}>{path.name}</button>
              ))}
            </div>
            <div className="atlas-representatives">
              {representativeProblems.map((problem) => (
                <Link to={`/problems/${problem.slug}`} key={problem.slug}>{problem.id}. {problem.titleCn}</Link>
              ))}
            </div>
            <button className="atlas-explore-button" type="button" onClick={() => onExplorePath(selected.slug)}>
              筛选此路径<ArrowRight size={15} />
            </button>
          </div>
        </section>

        <aside className="atlas-signal-rail" aria-label="练习信号">
          <section className="atlas-signal-section recent-activity">
            <header>
              <h2><Clock3 size={15} />最近解题</h2>
              <span>{recentProblems.length ? `${recentProblems.length} 条记录` : "等待第一次运行"}</span>
            </header>
            {recentProblems.length ? (
              <ol>
                {recentProblems.map((problem) => problem ? (
                  <li key={problem.slug}>
                    <Link to={`/problems/${problem.slug}`}>
                      <span>{problem.id}</span>
                      <strong>{problem.titleCn}</strong>
                      {progress.solved.has(problem.slug) ? <CheckCircle2 size={14} aria-label="已完成" /> : <ArrowRight size={14} aria-hidden="true" />}
                    </Link>
                  </li>
                ) : null)}
              </ol>
            ) : (
              <div className="atlas-empty-activity">
                <p>运行一次代码后，最近练习会按顺序出现在这里。</p>
                <Link to="/problems/two-sum">从两数之和开始<ArrowRight size={14} /></Link>
              </div>
            )}
          </section>

          <section className="atlas-signal-section capability-distribution">
            <header>
              <h2><Activity size={15} />能力分布</h2>
              <span>完成 / 尝试</span>
            </header>
            <div className="capability-matrix">
              {capabilityPaths.map((path) => {
                const stats = pathStats.get(path.slug) ?? EMPTY_STATS;
                return (
                  <button
                    className={selected.slug === path.slug ? "is-selected" : ""}
                    type="button"
                    aria-pressed={selected.slug === path.slug}
                    onClick={() => setSelectedPath(path.slug)}
                    key={path.slug}
                  >
                    <span>{path.name}</span>
                    <strong>{stats.solved}<small>/</small>{stats.attempted}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
