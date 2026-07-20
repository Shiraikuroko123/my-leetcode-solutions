import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Check, GitCompareArrows } from "lucide-react";
import type { SolutionComparison } from "../data/solutionComparisons";

type SpectrumStyle = CSSProperties & {
  "--spectrum-x": string;
  "--spectrum-y": string;
};

export function SolutionSpectrum({ comparisons }: { comparisons: SolutionComparison[] }) {
  const preferred = useMemo(
    () => comparisons.find((comparison) => comparison.recommended) ?? comparisons[0],
    [comparisons]
  );
  const [activeId, setActiveId] = useState(preferred?.id ?? "");

  useEffect(() => {
    setActiveId(preferred?.id ?? "");
  }, [preferred]);

  if (!preferred || comparisons.length === 0) return null;
  const active = comparisons.find((comparison) => comparison.id === activeId) ?? preferred;

  return (
    <section className="solution-spectrum" aria-labelledby="solution-spectrum-title">
      <header>
        <div>
          <h2 id="solution-spectrum-title"><GitCompareArrows size={16} />解法光谱</h2>
          <p>比较时间阶、空间占用与实现条件。</p>
        </div>
        <span>{comparisons.length} 种可行方案</span>
      </header>

      <div className="spectrum-layout">
        <div className="complexity-plane" role="group" aria-label="解法复杂度坐标">
          <span className="complexity-axis complexity-axis--time">时间开销低到高</span>
          <span className="complexity-axis complexity-axis--space">空间开销低到高</span>
          <i className="complexity-guide complexity-guide--x1" />
          <i className="complexity-guide complexity-guide--x2" />
          <i className="complexity-guide complexity-guide--y1" />
          <i className="complexity-guide complexity-guide--y2" />
          {comparisons.map((comparison, index) => {
            const style: SpectrumStyle = {
              "--spectrum-x": `${12 + (comparison.timeRank - 1) * 15}%`,
              "--spectrum-y": `${88 - (comparison.spaceRank - 1) * 15}%`
            };
            return (
              <button
                className={`${comparison.id === active.id ? "is-active" : ""}${comparison.recommended ? " is-recommended" : ""}`}
                type="button"
                style={style}
                onClick={() => setActiveId(comparison.id)}
                aria-label={`${comparison.name}，时间 ${comparison.time}，空间 ${comparison.space}`}
                aria-pressed={comparison.id === active.id}
                key={comparison.id}
              >
                {String.fromCharCode(65 + index)}
              </button>
            );
          })}
        </div>

        <div className="solution-variant-list" role="tablist" aria-label="解法选择">
          {comparisons.map((comparison, index) => (
            <button
              className={comparison.id === active.id ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={comparison.id === active.id}
              onClick={() => setActiveId(comparison.id)}
              key={comparison.id}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <strong>{comparison.name}</strong>
              <code>{comparison.time} / {comparison.space}</code>
              {comparison.recommended ? <Check size={14} aria-label="推荐方案" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="solution-variant-detail" aria-live="polite">
        <div>
          <span>{active.recommended ? "当前主方案" : "替代方案"}</span>
          <strong>{active.name}</strong>
        </div>
        <p>{active.summary}</p>
        <p>{active.tradeoff}</p>
        <dl>
          <div><dt>时间</dt><dd>{active.time}</dd></div>
          <div><dt>空间</dt><dd>{active.space}</dd></div>
        </dl>
      </div>
    </section>
  );
}
