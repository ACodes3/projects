import { useEffect, useState } from "react";

export const FOCUS_DURATION_PRESETS = [15, 25, 45, 60] as const;

export type TimerMode = "focus" | "shortBreak" | "longBreak";
type TimerStatus = "idle" | "running" | "paused" | "completed";

const MINUTE_MS = 60 * 1000;
const DEFAULT_FOCUS_DURATION_MS = 25 * MINUTE_MS;
const SHORT_BREAK_MS = 5 * MINUTE_MS;
const LONG_BREAK_MS = 15 * MINUTE_MS;

const STORAGE_KEY = "focusroom.focus-timer.v1";

type TimerSnapshot = {
  mode: TimerMode;
  status: TimerStatus;
  focusDurationMs: number;
  durationMs: number;
  remainingMs: number;
  endsAt: number | null;
};

function isValidFocusDuration(value: unknown): value is number {
  return (
    typeof value === "number" &&
    FOCUS_DURATION_PRESETS.some((minutes) => minutes * MINUTE_MS === value)
  );
}

function getModeDuration(mode: TimerMode, focusDurationMs: number): number {
  switch (mode) {
    case "shortBreak":
      return SHORT_BREAK_MS;

    case "longBreak":
      return LONG_BREAK_MS;

    default:
      return focusDurationMs;
  }
}

function initialTimer(
  mode: TimerMode = "focus",
  focusDurationMs = DEFAULT_FOCUS_DURATION_MS,
): TimerSnapshot {
  const durationMs = getModeDuration(mode, focusDurationMs);

  return {
    mode,
    status: "idle",
    focusDurationMs,
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
  };
}

function completedTimer(previous: TimerSnapshot): TimerSnapshot {
  return {
    ...previous,
    status: "completed",
    remainingMs: 0,
    endsAt: null,
  };
}

function loadTimer(): TimerSnapshot {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return initialTimer();

    const saved = JSON.parse(stored) as Partial<TimerSnapshot>;

    if (!saved || typeof saved !== "object") {
      return initialTimer();
    }

    const modes: TimerMode[] = ["focus", "shortBreak", "longBreak"];

    const statuses: TimerStatus[] = ["idle", "running", "paused", "completed"];

    // Older snapshots don't contain a mode.
    const mode = saved.mode ?? "focus";

    if (!modes.includes(mode)) {
      return initialTimer();
    }

    // Preserve the user's previous focus duration.
    const focusDurationMs = isValidFocusDuration(saved.focusDurationMs)
      ? saved.focusDurationMs
      : isValidFocusDuration(saved.durationMs)
        ? saved.durationMs
        : DEFAULT_FOCUS_DURATION_MS;

    const durationMs = getModeDuration(mode, focusDurationMs);

    if (
      !saved.status ||
      !statuses.includes(saved.status) ||
      typeof saved.remainingMs !== "number" ||
      !Number.isFinite(saved.remainingMs) ||
      saved.remainingMs < 0 ||
      saved.remainingMs > durationMs
    ) {
      return initialTimer(mode, focusDurationMs);
    }

    const restored: TimerSnapshot = {
      mode,
      status: saved.status,
      focusDurationMs,
      durationMs,
      remainingMs: saved.remainingMs,
      endsAt: null,
    };

    if (saved.status === "idle") {
      return initialTimer(mode, focusDurationMs);
    }

    if (saved.status === "completed") {
      return completedTimer(restored);
    }

    if (saved.status === "paused") {
      if (saved.remainingMs === 0) {
        return completedTimer(restored);
      }

      return restored;
    }

    // Restore a running session.
    if (typeof saved.endsAt !== "number" || !Number.isFinite(saved.endsAt)) {
      return initialTimer(mode, focusDurationMs);
    }

    if (saved.endsAt <= Date.now()) {
      return completedTimer(restored);
    }

    return {
      ...restored,
      status: "running",
      endsAt: saved.endsAt,
    };
  } catch {
    return initialTimer();
  }
}

export function useFocusTimer() {
  const [timer, setTimer] = useState<TimerSnapshot>(loadTimer);
  const [now, setNow] = useState(() => Date.now());

  // Synchronize the countdown with actual clock time.
  useEffect(() => {
    if (timer.status !== "running" || timer.endsAt === null) {
      return;
    }

    const deadline = timer.endsAt;

    const update = () => {
      const current = Date.now();

      setNow(current);

      if (current >= deadline) {
        setTimer((previous) => {
          if (previous.status !== "running" || previous.endsAt !== deadline) {
            return previous;
          }

          return completedTimer(previous);
        });
      }
    };

    const interval = window.setInterval(update, 250);

    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
    };
  }, [timer.status, timer.endsAt]);

  // Persist timer state.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } catch {
      // Timer remains usable without storage.
    }
  }, [timer]);

  // Remaining time is calculated from the deadline.
  const remainingMs =
    timer.status === "running" && timer.endsAt !== null
      ? Math.max(0, timer.endsAt - now)
      : timer.remainingMs;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;

  const progress = Math.min(1, Math.max(0, 1 - remainingMs / timer.durationMs));

  const durationMinutes = timer.durationMs / MINUTE_MS;

  // START OR RESUME
  function start() {
    const current = Date.now();
    setNow(current);

    setTimer((previous) => {
      if (previous.status === "running") {
        return previous;
      }

      const remaining =
        previous.status === "paused"
          ? previous.remainingMs
          : previous.durationMs;

      return {
        ...previous,
        status: "running",
        remainingMs: remaining,
        endsAt: current + remaining,
      };
    });
  }

  // PAUSE
  function pause() {
    const current = Date.now();
    setNow(current);

    setTimer((previous) => {
      if (previous.status !== "running" || previous.endsAt === null) {
        return previous;
      }

      const remaining = Math.max(0, previous.endsAt - current);

      if (remaining === 0) {
        return completedTimer(previous);
      }

      return {
        ...previous,
        status: "paused",
        remainingMs: remaining,
        endsAt: null,
      };
    });
  }

  // RESET CURRENT MODE
  function reset() {
    setNow(Date.now());

    setTimer((previous) =>
      initialTimer(previous.mode, previous.focusDurationMs),
    );
  }

  // CHANGE FOCUS DURATION
  function setDuration(minutes: number) {
    if (!FOCUS_DURATION_PRESETS.some((preset) => preset === minutes)) {
      return;
    }

    const durationMs = minutes * MINUTE_MS;

    setTimer((previous) => {
      if (
        previous.mode !== "focus" ||
        previous.status === "running" ||
        previous.status === "paused"
      ) {
        return previous;
      }

      return initialTimer("focus", durationMs);
    });
  }

  // SWITCH BETWEEN FOCUS AND BREAK MODES
  function setMode(mode: TimerMode) {
    const modes: TimerMode[] = ["focus", "shortBreak", "longBreak"];

    if (!modes.includes(mode)) return;

    setTimer((previous) => {
      // Protect active or paused sessions.
      if (
        previous.status === "running" ||
        previous.status === "paused" ||
        previous.mode === mode
      ) {
        return previous;
      }

      return initialTimer(mode, previous.focusDurationMs);
    });
  }

  return {
    mode: timer.mode,
    status: timer.status,
    durationMinutes,
    remainingMs,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    setDuration,
    setMode,
  };
}

export type FocusTimer = ReturnType<typeof useFocusTimer>;
