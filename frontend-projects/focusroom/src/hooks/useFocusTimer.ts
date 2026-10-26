
import { useEffect, useState } from "react";

// Available focus durations
export const FOCUS_DURATION_PRESETS = [15, 25, 45, 60] as const;

const DEFAULT_DURATION_MS = 25 * 60 * 1000;
const STORAGE_KEY = "focusroom.focus-timer.v1";

type TimerStatus = "idle" | "running" | "paused" | "completed";

type TimerSnapshot = {
  status: TimerStatus;
  durationMs: number;
  remainingMs: number;
  endsAt: number | null;
};

// Create a new timer with the selected duration
function initialTimer(
  durationMs = DEFAULT_DURATION_MS
): TimerSnapshot {
  return {
    status: "idle",
    durationMs,
    remainingMs: durationMs,
    endsAt: null,
  };
}

// Mark a session as completed
function completedTimer(durationMs: number): TimerSnapshot {
  return {
    status: "completed",
    durationMs,
    remainingMs: 0,
    endsAt: null,
  };
}

// Restore saved timer state
function loadTimer(): TimerSnapshot {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return initialTimer();
    }

    const saved = JSON.parse(stored) as Partial<TimerSnapshot>;

    const statuses: TimerStatus[] = [
      "idle",
      "running",
      "paused",
      "completed",
    ];

    // Support snapshots from the previous timer version
    const durationMs = saved.durationMs ?? DEFAULT_DURATION_MS;

    if (
      !saved.status ||
      !statuses.includes(saved.status) ||
      typeof durationMs !== "number" ||
      !Number.isFinite(durationMs) ||
      !FOCUS_DURATION_PRESETS.some(
        (minutes) => minutes * 60 * 1000 === durationMs
      ) ||
      typeof saved.remainingMs !== "number" ||
      !Number.isFinite(saved.remainingMs) ||
      saved.remainingMs < 0 ||
      saved.remainingMs > durationMs
    ) {
      return initialTimer();
    }

    if (saved.status === "running") {
      if (
        typeof saved.endsAt !== "number" ||
        !Number.isFinite(saved.endsAt)
      ) {
        return initialTimer(durationMs);
      }

      if (saved.endsAt <= Date.now()) {
        return completedTimer(durationMs);
      }

      return {
        status: "running",
        durationMs,
        remainingMs: saved.remainingMs,
        endsAt: saved.endsAt,
      };
    }

    if (saved.status === "idle") {
      return initialTimer(durationMs);
    }

    if (saved.status === "completed") {
      return completedTimer(durationMs);
    }

    if (saved.remainingMs === 0) {
      return completedTimer(durationMs);
    }

    return {
      status: "paused",
      durationMs,
      remainingMs: saved.remainingMs,
      endsAt: null,
    };
  } catch {
    return initialTimer();
  }
}

export function useFocusTimer() {
  const [timer, setTimer] = useState<TimerSnapshot>(loadTimer);
  const [now, setNow] = useState(() => Date.now());

  // Keep display synchronized with the real clock
  useEffect(() => {
    if (
      timer.status !== "running" ||
      timer.endsAt === null
    ) {
      return;
    }

    const deadline = timer.endsAt;

    const update = () => {
      const current = Date.now();

      setNow(current);

      if (current >= deadline) {
        setTimer((previous) => {
          if (
            previous.status !== "running" ||
            previous.endsAt !== deadline
          ) {
            return previous;
          }

          return completedTimer(previous.durationMs);
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

  // Persist timer state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(timer)
      );
    } catch {
      // Timer remains functional without storage.
    }
  }, [timer]);

  // Calculate remaining time
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

  // Dynamic progress based on selected duration
  const progress = Math.min(
    1,
    Math.max(0, 1 - remainingMs / timer.durationMs)
  );

  const durationMinutes = timer.durationMs / (60 * 1000);

  // START / RESUME
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
        status: "running",
        durationMs: previous.durationMs,
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
      if (
        previous.status !== "running" ||
        previous.endsAt === null
      ) {
        return previous;
      }

      const remaining = Math.max(
        0,
        previous.endsAt - current
      );

      if (remaining === 0) {
        return completedTimer(previous.durationMs);
      }

      return {
        status: "paused",
        durationMs: previous.durationMs,
        remainingMs: remaining,
        endsAt: null,
      };
    });
  }

  // RESET
  function reset() {
    setNow(Date.now());

    setTimer((previous) =>
      initialTimer(previous.durationMs)
    );
  }

  // CHANGE FOCUS DURATION
  function setDuration(minutes: number) {
    if (
      !FOCUS_DURATION_PRESETS.some(
        (preset) => preset === minutes
      )
    ) {
      return;
    }

    const durationMs = minutes * 60 * 1000;

    setNow(Date.now());

    setTimer((previous) => {
      // Never replace an active or paused session
      if (
        previous.status === "running" ||
        previous.status === "paused"
      ) {
        return previous;
      }

      return initialTimer(durationMs);
    });
  }

  return {
    status: timer.status,
    durationMinutes,
    remainingMs,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    setDuration,
  };
}

export type FocusTimer = ReturnType<typeof useFocusTimer>;
