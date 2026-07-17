import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";

type ProgressState = {
  solved: string[];
  attempted: string[];
  starred: string[];
};

const initialProgress: ProgressState = { solved: [], attempted: [], starred: [] };

export function useProgress() {
  const [progress, setProgress] = useLocalStorage<ProgressState>("algonote-progress-v1", initialProgress);

  const sets = useMemo(
    () => ({
      solved: new Set(progress.solved),
      attempted: new Set([...progress.attempted, ...progress.solved]),
      starred: new Set(progress.starred)
    }),
    [progress]
  );

  const toggleStarred = useCallback((slug: string) => {
    setProgress((current) => ({
      ...current,
      starred: current.starred.includes(slug)
        ? current.starred.filter((item) => item !== slug)
        : [...current.starred, slug]
    }));
  }, [setProgress]);

  const markAttempted = useCallback((slug: string) => {
    setProgress((current) => ({
      ...current,
      attempted: current.attempted.includes(slug) ? current.attempted : [...current.attempted, slug]
    }));
  }, [setProgress]);

  const markSolved = useCallback((slug: string) => {
    setProgress((current) => ({
      ...current,
      solved: current.solved.includes(slug) ? current.solved : [...current.solved, slug],
      attempted: current.attempted.includes(slug) ? current.attempted : [...current.attempted, slug]
    }));
  }, [setProgress]);

  const toggleSolved = useCallback((slug: string) => {
    setProgress((current) => {
      const isSolved = current.solved.includes(slug);
      return {
        ...current,
        solved: isSolved
          ? current.solved.filter((item) => item !== slug)
          : [...current.solved, slug],
        attempted: isSolved || current.attempted.includes(slug)
          ? current.attempted
          : [...current.attempted, slug]
      };
    });
  }, [setProgress]);

  return { ...sets, toggleStarred, markAttempted, markSolved, toggleSolved };
}

export type ProgressController = ReturnType<typeof useProgress>;
