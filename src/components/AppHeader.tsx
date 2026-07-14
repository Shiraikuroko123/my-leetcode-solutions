import { Braces, Github, Moon, Sun } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import type { Theme } from "../hooks/useTheme";

type AppHeaderProps = {
  theme: Theme;
  onToggleTheme: () => void;
  compact?: boolean;
};

export function AppHeader({ theme, onToggleTheme, compact = false }: AppHeaderProps) {
  return (
    <header className={`app-header${compact ? " app-header--compact" : ""}`}>
      <Link className="brand" to="/" aria-label="AlgoNote 题库首页">
        <span className="brand__mark"><Braces size={18} strokeWidth={2.4} /></span>
        <span className="brand__name">AlgoNote</span>
      </Link>

      {!compact && (
        <nav className="primary-nav" aria-label="主导航">
          <NavLink to="/" end>题库</NavLink>
          <a href="#learning-paths">学习路径</a>
          <a href="#progress">我的进度</a>
        </nav>
      )}

      <div className="header-actions">
        <a
          className="icon-button"
          href="https://github.com/Shiraikuroko123/my-leetcode-solutions"
          target="_blank"
          rel="noreferrer"
          title="查看 GitHub 仓库"
          aria-label="查看 GitHub 仓库"
        >
          <Github size={18} />
        </a>
        <button
          className="icon-button"
          type="button"
          onClick={onToggleTheme}
          title={theme === "light" ? "切换深色主题" : "切换浅色主题"}
          aria-label={theme === "light" ? "切换深色主题" : "切换浅色主题"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
