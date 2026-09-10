import { useEffect, useState } from "react";

export const EXERCISE_HISTORY_STORAGE_KEY = "pupz-exercise-history";
const EXERCISE_HISTORY_UPDATED_EVENT = "pupz:exercise-history-updated";

const RETENTION_DAYS = 90;

type ExerciseDay = {
  readonly date: string;
  readonly reps: number;
};

export type ExerciseHistorySummary = {
  readonly today: number;
  readonly currentStreak: number;
  readonly currentWeek: number;
};

function toLocalDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function shiftLocalDate(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function normalizeHistory(value: unknown, now: Date): readonly ExerciseDay[] {
  if (!Array.isArray(value)) return [];

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cutoff = shiftLocalDate(today, -(RETENTION_DAYS - 1));
  const repsByDate = new Map<string, number>();

  for (const item of value) {
    if (
      !Array.isArray(item) ||
      item.length !== 2 ||
      typeof item[0] !== "string" ||
      typeof item[1] !== "number" ||
      !Number.isSafeInteger(item[1]) ||
      item[1] <= 0
    ) {
      continue;
    }

    const date = parseLocalDateKey(item[0]);
    if (!date || date < cutoff || date > today) continue;

    repsByDate.set(item[0], (repsByDate.get(item[0]) ?? 0) + item[1]);
  }

  return [...repsByDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, reps]) => ({ date, reps }));
}

function readHistory(now: Date): readonly ExerciseDay[] {
  if (typeof window === "undefined") return [];

  let stored: string | null;
  try {
    stored = window.localStorage.getItem(EXERCISE_HISTORY_STORAGE_KEY);
  } catch (error: unknown) {
    if (error instanceof DOMException) return [];
    return [];
  }

  if (!stored) return [];

  try {
    return normalizeHistory(JSON.parse(stored), now);
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return [];
    return [];
  }
}

function writeHistory(history: readonly ExerciseDay[]): boolean {
  if (typeof window === "undefined") return false;

  const compactHistory = history.map(({ date, reps }) => [date, reps]);
  const serializedHistory = JSON.stringify(compactHistory);
  let previousHistory: string | null;
  try {
    previousHistory = window.localStorage.getItem(EXERCISE_HISTORY_STORAGE_KEY);
  } catch {
    return false;
  }

  try {
    window.localStorage.setItem(EXERCISE_HISTORY_STORAGE_KEY, serializedHistory);
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException) {
      try {
        window.localStorage.removeItem(EXERCISE_HISTORY_STORAGE_KEY);
        window.localStorage.setItem(
          EXERCISE_HISTORY_STORAGE_KEY,
          serializedHistory,
        );
        return true;
      } catch {
        if (previousHistory !== null) {
          try {
            window.localStorage.setItem(
              EXERCISE_HISTORY_STORAGE_KEY,
              previousHistory,
            );
          } catch {
            return false;
          }
        }
        return false;
      }
    }
    return false;
  }
}

export function recordPushups(reps: number, now = new Date()): boolean {
  if (!Number.isSafeInteger(reps) || reps <= 0) return false;

  const todayKey = toLocalDateKey(now);
  const history = readHistory(now);
  const previousToday = history.find(({ date }) => date === todayKey)?.reps ?? 0;
  const withoutToday = history.filter(({ date }) => date !== todayKey);

  const didWrite = writeHistory(
    normalizeHistory(
      [
        ...withoutToday.map(({ date, reps: count }) => [date, count]),
        [todayKey, previousToday + reps],
      ],
      now,
    ),
  );

  if (didWrite && typeof window !== "undefined") {
    window.dispatchEvent(new Event(EXERCISE_HISTORY_UPDATED_EVENT));
  }

  return didWrite;
}

export function useExerciseHistorySummary(): ExerciseHistorySummary {
  const [summary, setSummary] = useState(getExerciseHistorySummary);

  useEffect(() => {
    const refresh = () => setSummary(getExerciseHistorySummary());
    const onStorage = (event: StorageEvent) => {
      if (event.key === EXERCISE_HISTORY_STORAGE_KEY) refresh();
    };

    window.addEventListener(EXERCISE_HISTORY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", onStorage);

    // The exercise route writes its final reps during unmount. Refresh once
    // after the dashboard has mounted so that navigation cleanup is included.
    const refreshFrame = window.requestAnimationFrame(refresh);

    return () => {
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener(EXERCISE_HISTORY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return summary;
}

export function getExerciseHistorySummary(
  now = new Date(),
): ExerciseHistorySummary {
  const history = readHistory(now);
  const repsByDate = new Map(history.map(({ date, reps }) => [date, reps]));
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = toLocalDateKey(today);
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const weekStartKey = toLocalDateKey(shiftLocalDate(today, mondayOffset));
  const currentWeek = history
    .filter(({ date }) => date >= weekStartKey && date <= todayKey)
    .reduce((total, { reps }) => total + reps, 0);

  let cursor = repsByDate.has(todayKey) ? today : shiftLocalDate(today, -1);
  let currentStreak = 0;
  while (repsByDate.has(toLocalDateKey(cursor))) {
    currentStreak += 1;
    cursor = shiftLocalDate(cursor, -1);
  }

  return {
    today: repsByDate.get(todayKey) ?? 0,
    currentStreak,
    currentWeek,
  };
}
