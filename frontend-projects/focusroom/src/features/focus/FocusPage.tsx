import { useEffect, useState } from "react";

import {
  Clock3,
  Coffee,
  NotebookPen,
  Play,
  Pause,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Timer,
} from "lucide-react";

import { useOutletContext } from "react-router";

import { FOCUS_DURATION_PRESETS } from "../../hooks/useFocusTimer";
import type { FocusTimer, TimerMode } from "../../hooks/useFocusTimer";

const timerTicks = Array.from({ length: 60 }, (_, index) => index);

const SESSION_TITLE_KEY = "focusroom.session-title.v1";
const DEFAULT_SESSION_TITLE = "Deep work";

const sessionModes = [
  { id: "focus", label: "Focus", icon: Timer },
  { id: "shortBreak", label: "Short break", icon: Coffee },
  { id: "longBreak", label: "Long break", icon: Coffee },
] as const;

function loadSessionTitle(): string {
  try {
    const saved = localStorage.getItem(SESSION_TITLE_KEY);
    return saved?.trim().slice(0, 60) || DEFAULT_SESSION_TITLE;
  } catch {
    return DEFAULT_SESSION_TITLE;
  }
}

export default function FocusPage() {
  const {
    mode,
    status,
    durationMinutes,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    setDuration,
    setMode,
  } = useOutletContext<FocusTimer>();

  const [sessionTitle, setSessionTitle] = useState(loadSessionTitle);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_TITLE_KEY, sessionTitle);
    } catch {
      // Continue if localStorage is unavailable.
    }
  }, [sessionTitle]);

  function handleTitleBlur() {
    setSessionTitle(sessionTitle.trim() || DEFAULT_SESSION_TITLE);
  }

  const isRunning = status === "running";
  const isSessionActive = status === "running" || status === "paused";
  const isBreak = mode !== "focus";

  const modeLabel =
    mode === "focus"
      ? "Focus Session"
      : mode === "shortBreak"
        ? "Short Break"
        : "Long Break";

  const statusLabel =
    status === "running" && isBreak
      ? "Resting"
      : {
          idle: "Ready",
          running: "Focusing",
          paused: "Paused",
          completed: "Complete",
        }[status];

  const statusMessage = isBreak
    ? {
        idle: "Ready for a little rest?",
        running: "Rest is productive, too.",
        paused: "Your break is paused.",
        completed: "Break complete. Feeling refreshed?",
      }[status]
    : {
        idle: "Ready when you are. Begin your focus session.",
        running: "One thing at a time. You've got this.",
        paused: "Take your time. Resume whenever you're ready.",
        completed: "Session complete. Beautiful work!",
      }[status];

  const playButtonLabel = isRunning
    ? "Pause timer"
    : status === "paused"
      ? "Resume timer"
      : status === "completed"
        ? "Start new session"
        : "Start timer";

  const quickSwitchLabel = isBreak
    ? "Switch to focus mode"
    : "Switch to short break";

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* PAGE HEADER */}
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-[#E06A6A]">
          <Sparkles size={16} />
          <span className="tracking-widest uppercase">Your quiet space</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {isBreak ? "Time to recharge." : "Time to focus."}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#C9BDB8]">
          {isBreak
            ? "Step away for a moment. You've earned some rest."
            : "Settle in, clear your mind, and make progress on what matters."}
        </p>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,0.85fr)]">
        {/* TIMER PANEL */}
        <section className="flex min-h-[570px] min-w-0 flex-col rounded-3xl border border-[#4B4344] bg-[#2A2324] p-6 md:p-8">
          {/* SESSION HEADER */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#744849] bg-[#5B2F31]/50 px-3 py-1.5 text-xs font-medium text-[#F07A79]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRunning ? "animate-pulse bg-[#E06A6A]" : "bg-[#A95D4F]"
                  }`}
                />
                {modeLabel}
              </div>

              {/* SESSION TITLE */}
              {mode === "focus" ? (
                <div className="mt-1">
                  <label htmlFor="session-title" className="sr-only">
                    Session title
                  </label>

                  <input
                    id="session-title"
                    type="text"
                    value={sessionTitle}
                    onChange={(event) => setSessionTitle(event.target.value)}
                    onBlur={handleTitleBlur}
                    maxLength={60}
                    placeholder="What are you working on?"
                    autoComplete="off"
                    className="
                      w-full max-w-sm rounded-lg
                      border border-transparent
                      bg-transparent px-2 py-2
                      text-xl font-semibold
                      text-[#F2ECE8]
                      outline-none
                      transition-colors duration-200
                      placeholder:text-[#756B67]
                      hover:border-[#4B4344]
                      focus:border-[#E06A6A]
                      focus:bg-[#322B2C]
                    "
                  />

                  <p className="mt-1 px-2 text-xs text-[#9B8F8A]">
                    Your time is yours. Click to edit your session.
                  </p>
                </div>
              ) : (
                <div className="mt-1 px-2">
                  <h2 className="py-2 text-xl font-semibold">
                    {mode === "shortBreak" ? "A little pause" : "A longer rest"}
                  </h2>

                  <p className="mt-1 text-xs text-[#9B8F8A]">
                    Take care of yourself between sessions.
                  </p>
                </div>
              )}
            </div>

            {/* FUTURE SETTINGS */}
            <button
              type="button"
              disabled
              aria-label="Timer settings coming soon"
              title="Timer settings coming soon"
              className="cursor-not-allowed rounded-xl border border-[#4B4344] p-3 text-[#9B8F8A] opacity-50"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* SESSION MODE SELECTOR */}
          <div className="mt-6 border-t border-[#4B4344] pt-5">
            <p className="mb-3 text-xs font-medium text-[#C9BDB8]">
              Session mode
            </p>

            <fieldset
              disabled={isSessionActive}
              className="grid grid-cols-3 gap-2"
            >
              <legend className="sr-only">Choose session mode</legend>

              {sessionModes.map((option) => {
                const selected = mode === option.id;
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setMode(option.id as TimerMode)}
                    aria-pressed={selected}
                    className={`
                      flex flex-col items-center justify-center
                      gap-2 rounded-xl border px-2 py-3
                      text-center text-xs font-medium
                      transition-all duration-200
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                      ${
                        selected
                          ? "border-[#E06A6A] bg-[#5B2F31] text-[#F07A79]"
                          : "border-[#4B4344] bg-[#322B2C] text-[#C9BDB8] hover:border-[#756B67] hover:text-[#F2ECE8]"
                      }
                    `}
                  >
                    <Icon size={17} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </fieldset>
          </div>

          {/* FOCUS DURATION PRESETS */}
          {mode === "focus" && (
            <div className="mt-5 pb-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[#C9BDB8]">
                  Focus duration
                </p>

                <span className="text-xs text-[#9B8F8A]">Select your pace</span>
              </div>

              <fieldset
                disabled={isSessionActive}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                <legend className="sr-only">Choose focus duration</legend>

                {FOCUS_DURATION_PRESETS.map((minutes) => {
                  const selected = durationMinutes === minutes;

                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setDuration(minutes)}
                      aria-pressed={selected}
                      className={`
                        rounded-2xl border px-3 py-4
                        text-sm font-medium
                        transition-all duration-200
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        ${
                          selected
                            ? "border-[#E06A6A] bg-[#5B2F31] text-[#F07A79]"
                            : "border-[#4B4344] bg-[#322B2C] text-[#C9BDB8] hover:border-[#756B67] hover:text-[#F2ECE8]"
                        }
                      `}
                    >
                      {minutes} min
                    </button>
                  );
                })}
              </fieldset>
            </div>
          )}

          {/* BREAK INFORMATION */}
          {isBreak && (
            <div className="mt-5 rounded-xl border border-[#4B4344] bg-[#322B2C] p-4">
              <p className="text-sm text-[#C9BDB8]">
                {mode === "shortBreak"
                  ? "A quick reset. Stretch, hydrate, and give your mind a moment."
                  : "A longer pause. Rest your eyes, move around, and recharge."}
              </p>
            </div>
          )}

          {isSessionActive && (
            <p className="mt-4 text-center text-xs text-[#9B8F8A]">
              Reset the timer to change modes or duration.
            </p>
          )}

          {/* TIMER CENTER AREA */}
          <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-6">
            {/* CIRCULAR TIMER */}
            <div className="relative h-[240px] w-[240px] sm:h-[270px] sm:w-[270px]">
              <svg
                viewBox="0 0 300 300"
                className="h-full w-full"
                aria-hidden="true"
              >
                <circle cx="150" cy="150" r="106" fill="#382D2F" />

                <circle
                  cx="150"
                  cy="150"
                  r="106"
                  fill="none"
                  stroke="#5B4143"
                  strokeWidth="1"
                />

                {timerTicks.map((index) => {
                  const major = index % 5 === 0;
                  const active = index < Math.floor(progress * 60);

                  return (
                    <line
                      key={index}
                      x1="150"
                      y1={major ? "10" : "16"}
                      x2="150"
                      y2="27"
                      transform={`rotate(${index * 6} 150 150)`}
                      stroke={active ? "#E06A6A" : "#756B67"}
                      strokeWidth={major ? 2.5 : 1.5}
                      strokeLinecap="round"
                      className="transition-colors duration-300"
                    />
                  );
                })}
              </svg>

              {/* COUNTDOWN */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mb-3 text-xs font-medium tracking-[0.2em] text-[#C9BDB8] uppercase">
                  {statusLabel}
                </span>

                <span
                  role="timer"
                  aria-label={`${formattedTime} remaining`}
                  className="text-5xl font-semibold tracking-tight text-[#F2ECE8] tabular-nums sm:text-6xl"
                >
                  {formattedTime}
                </span>

                <span className="mt-4 text-sm text-[#9B8F8A]">
                  {isBreak ? "Break mode" : "Focus mode"}
                </span>
              </div>
            </div>

            {/* CURRENT DURATION */}
            <div className="flex items-center gap-2 rounded-full border border-[#4B4344] bg-[#322B2C] px-4 py-2 text-sm text-[#C9BDB8]">
              <Clock3 size={15} />

              <span>
                {durationMinutes} minute{" "}
                {mode === "focus"
                  ? "focus session"
                  : mode === "shortBreak"
                    ? "short break"
                    : "long break"}
              </span>
            </div>

            {/* TIMER CONTROLS */}
            <div className="flex items-center justify-center gap-4">
              {/* RESET */}
              <button
                type="button"
                onClick={reset}
                disabled={status === "idle"}
                aria-label="Reset timer"
                title="Reset timer"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3A3334] text-[#F2ECE8] transition-all hover:bg-[#4B4344] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={19} />
              </button>

              {/* START / PAUSE / RESUME */}
              <button
                type="button"
                onClick={isRunning ? pause : start}
                aria-label={playButtonLabel}
                title={playButtonLabel}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E06A6A] text-[#1E1919] shadow-[0_8px_28px_rgba(224,106,106,0.18)] transition-all hover:scale-105 hover:bg-[#F07A79] active:scale-95"
              >
                {isRunning ? (
                  <Pause size={25} fill="currentColor" />
                ) : (
                  <Play size={25} fill="currentColor" />
                )}
              </button>

              {/* QUICK BREAK / FOCUS SWITCH */}
              <button
                type="button"
                onClick={() => setMode(isBreak ? "focus" : "shortBreak")}
                disabled={isSessionActive}
                aria-label={quickSwitchLabel}
                title={quickSwitchLabel}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3A3334] text-[#F2ECE8] transition-all hover:bg-[#4B4344] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isBreak ? <Timer size={19} /> : <Coffee size={19} />}
              </button>
            </div>

            {/* STATUS MESSAGE */}
            <p role="status" className="text-center text-xs text-[#9B8F8A]">
              {statusMessage}
            </p>
          </div>
        </section>

        {/* SESSION NOTES PANEL */}
        <section className="flex min-h-[570px] min-w-0 flex-col rounded-3xl border border-[#4B4344] bg-[#2A2324] p-6 md:p-8">
          {/* NOTES HEADER */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B2F31]/60 text-[#E06A6A]">
              <NotebookPen size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">Session Notes</h2>

              <p className="text-xs text-[#9B8F8A]">Capture your thoughts</p>
            </div>
          </div>

          {/* NOTES PREVIEW */}
          <div className="flex flex-1 flex-col rounded-2xl border border-[#4B4344]/60 bg-[#322B2C] p-5">
            <p className="text-sm leading-7 text-[#9B8F8A]">
              What are you working on today?
            </p>

            <p className="mt-4 text-sm leading-7 text-[#756B67]">
              This space will hold your thoughts, discoveries, ideas, and
              reflections throughout each focus session.
            </p>

            <div className="flex-1" />

            <div className="border-t border-[#4B4344] pt-4">
              <span className="text-xs text-[#9B8F8A]">
                Notes editor coming soon
              </span>
            </div>
          </div>

          {/* GENTLE REMINDER */}
          <div className="mt-5 rounded-2xl border border-[#4B4344] bg-[#322B2C] p-4">
            <div className="flex items-center gap-2 text-[#E06A6A]">
              <Sparkles size={16} />

              <span className="text-sm font-medium">A gentle reminder</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#C9BDB8]">
              Progress doesn't have to be loud. Small moments of concentration
              add up.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
