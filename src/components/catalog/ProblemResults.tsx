import { memo, type ReactNode, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Circle, LockKeyhole, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { getSolutionLanguages, isFeatured } from "../../lib/catalog";
import type { ProgressController } from "../../hooks/useProgress";
import type { CatalogProblem } from "../../types/problem";
import { DifficultyBadge } from "../DifficultyBadge";

const PAGE_SIZE = 40;

type ProblemResultsProps = {
  problems: CatalogProblem[];
  progress: ProgressController;
  children: ReactNode;
};

type ProblemRowProps = {
  problem: CatalogProblem;
  solved: boolean;
  attempted: boolean;
  starred: boolean;
  onToggleSolved: (slug: string) => void;
  onToggleStarred: (slug: string) => void;
};

const ProblemRow = memo(function ProblemRow({
  problem,
  solved,
  attempted,
  starred,
  onToggleSolved,
  onToggleStarred
}: ProblemRowProps) {
  const solutionLanguages = getSolutionLanguages(problem);
  const solvedLabel = solved ? "标记为未完成" : "标记为完成";

  return (
    <tr>
      <td className="status-column">
        <button
          className={`status-button${solved ? " is-solved" : attempted ? " is-attempted" : ""}`}
          type="button"
          onClick={() => onToggleSolved(problem.slug)}
          title={solvedLabel}
          aria-label={`${solvedLabel}：${problem.titleCn}`}
        >
          {solved ? <Check size={15} /> : <Circle size={15} />}
        </button>
      </td>
      <td className="id-column">{problem.id}</td>
      <td className="problem-main-column">
        <Link className="problem-title-link" to={`/problems/${problem.slug}`}>
          <span>{problem.titleCn}</span>
          <small>{problem.title}</small>
        </Link>
        <div className="problem-tags">
          {problem.tags.slice(0, 3).map((tag) => <span key={tag.slug}>{tag.nameCn}</span>)}
          {problem.paidOnly ? <span><LockKeyhole size={11} />会员</span> : null}
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
          onClick={() => onToggleStarred(problem.slug)}
          title={starred ? "取消收藏" : "收藏题目"}
          aria-label={`${starred ? "取消收藏" : "收藏题目"}：${problem.titleCn}`}
        >
          <Star size={16} fill={starred ? "currentColor" : "none"} />
        </button>
      </td>
    </tr>
  );
});

export function EmptyResults({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-results">
      {icon}
      <strong>{title}</strong>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function ProblemResults({ problems, progress, children }: ProblemResultsProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(problems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProblems = useMemo(
    () => problems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, problems]
  );

  return (
    <>
      <div className="problem-table-wrap">
        {visibleProblems.length > 0 ? (
          <table className="problem-table" aria-label="题目列表">
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
              {visibleProblems.map((problem) => (
                <ProblemRow
                  key={problem.slug}
                  problem={problem}
                  solved={progress.solved.has(problem.slug)}
                  attempted={progress.attempted.has(problem.slug)}
                  starred={progress.starred.has(problem.slug)}
                  onToggleSolved={progress.toggleSolved}
                  onToggleStarred={progress.toggleStarred}
                />
              ))}
            </tbody>
          </table>
        ) : children}
      </div>

      {problems.length > 0 ? (
        <footer className="pagination">
          <span>共 {problems.length.toLocaleString()} 道，当前 {currentPage}/{totalPages} 页</span>
          <div>
            <button className="icon-button" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} title="上一页" aria-label="上一页"><ChevronLeft size={17} /></button>
            <button className="icon-button" type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} title="下一页" aria-label="下一页"><ChevronRight size={17} /></button>
          </div>
        </footer>
      ) : null}
    </>
  );
}
