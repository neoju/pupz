export const EXERCISE_COOLDOWN_STORAGE_KEY = "pupz-exercise-cooldown";

type StoredCooldown = {
  readonly cooldownEndsAt: number;
};

function parseCooldown(value: unknown): StoredCooldown | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const cooldownEndsAt = Reflect.get(value, "cooldownEndsAt");
  return typeof cooldownEndsAt === "number" &&
    Number.isSafeInteger(cooldownEndsAt) &&
    cooldownEndsAt > 0
    ? { cooldownEndsAt }
    : null;
}

export function clearExerciseCooldown(): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(EXERCISE_COOLDOWN_STORAGE_KEY);
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException) return false;
    return false;
  }
}

export function readExerciseCooldownDeadline(): number | null {
  if (typeof window === "undefined") return null;

  let stored: string | null;
  try {
    stored = window.localStorage.getItem(EXERCISE_COOLDOWN_STORAGE_KEY);
  } catch (error: unknown) {
    if (error instanceof DOMException) return null;
    return null;
  }

  if (stored === null) return null;

  try {
    const cooldown = parseCooldown(JSON.parse(stored));
    if (cooldown !== null) return cooldown.cooldownEndsAt;
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) return null;
  }

  clearExerciseCooldown();
  return null;
}

export function saveExerciseCooldown(deadline: number): boolean {
  if (
    typeof window === "undefined" ||
    !Number.isSafeInteger(deadline) ||
    deadline <= 0
  ) {
    return false;
  }

  try {
    window.localStorage.setItem(
      EXERCISE_COOLDOWN_STORAGE_KEY,
      JSON.stringify({ cooldownEndsAt: deadline } satisfies StoredCooldown),
    );
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException) return false;
    return false;
  }
}
