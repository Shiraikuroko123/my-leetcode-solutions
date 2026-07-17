import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import type { Difficulty } from "../../types/problem";

export function CatalogControls({ children }: { children: ReactNode }) {
  return <div className="catalog-toolbar">{children}</div>;
}

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="search-field">
      <Search size={17} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索题号、题名或标签"
        aria-label="搜索题目"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} title="清空搜索" aria-label="清空搜索">
          <X size={15} />
        </button>
      ) : null}
    </label>
  );
}

export function DifficultyFilter({
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
