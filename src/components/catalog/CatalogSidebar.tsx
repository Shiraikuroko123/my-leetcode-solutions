import { memo } from "react";
import { CheckCircle2, Code2, Database, Star, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { catalog, learningPaths } from "../../lib/catalog";
import type { CatalogSection, PathStats, ProgressView } from "./types";

type CatalogSidebarProps = {
  section: CatalogSection;
  activePath: string;
  progressView: ProgressView;
  trackedCount: number;
  attemptedCount: number;
  starredCount: number;
  solvedCount: number;
  pathStats: ReadonlyMap<string, PathStats>;
};

export const CatalogSidebar = memo(function CatalogSidebar({
  section,
  activePath,
  progressView,
  trackedCount,
  attemptedCount,
  starredCount,
  solvedCount,
  pathStats
}: CatalogSidebarProps) {
  const sidebarClass = (active: boolean) => active ? "sidebar-link is-active" : "sidebar-link";

  return (
    <aside className={`catalog-sidebar catalog-sidebar--${section}`} aria-label="题库分类与练习进度">
      <nav className="sidebar-section sidebar-section--browse" aria-label="题库分类">
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
      </nav>

      <nav className="sidebar-section sidebar-section--progress" aria-label="练习记录">
        <h2>我的练习</h2>
        <Link className={sidebarClass(section === "progress" && progressView === "all")} to="/progress">
          <Target size={16} /><span>全部记录</span><strong>{trackedCount}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "attempted")} to="/progress?view=attempted">
          <Code2 size={16} /><span>已尝试</span><strong>{attemptedCount}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "starred")} to="/progress?view=starred">
          <Star size={16} /><span>已收藏</span><strong>{starredCount}</strong>
        </Link>
        <Link className={sidebarClass(section === "progress" && progressView === "solved")} to="/progress?view=solved">
          <CheckCircle2 size={16} /><span>已完成</span><strong>{solvedCount}</strong>
        </Link>
      </nav>
    </aside>
  );
});
