import { useCallback, useEffect, useState } from "react";

const STORAGE_EVENT = "algonote-storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const read = useCallback(() => {
    try {
      const value = window.localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>;
      if (customEvent.detail?.key === key) setValue(read());
    };
    window.addEventListener(STORAGE_EVENT, sync);
    return () => window.removeEventListener(STORAGE_EVENT, sync);
  }, [key, read]);

  const update = useCallback(
    (nextValue: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof nextValue === "function"
          ? (nextValue as (value: T) => T)(current)
          : nextValue;
        window.localStorage.setItem(key, JSON.stringify(resolved));
        window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
        return resolved;
      });
    },
    [key]
  );

  return [value, update] as const;
}
