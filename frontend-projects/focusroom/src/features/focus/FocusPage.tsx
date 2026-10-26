
import {
  Clock3,
  Coffee,
  NotebookPen,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

const timerTicks = Array.from(
  { length: 60 },
  (_, index) => index
);

export default function FocusPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page heading */}
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-[#E06A6A]">
          <Sparkles size={16} />
          <span>YOUR QUIET SPACE</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Time to focus.
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#C9BDB8]">
          Settle in, clear your mind, and make progress
          on what matters.
        </p>
      </header>

      {/* Main workspace */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(290px,0.85fr)]">
        {/* TIMER PANEL */}
        <section className="flex min-h-142.5 flex-col rounded-3xl border border-[#4B4344] bg-[#2A2324] p-6 md:p-8">
          {/* Session heading */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#744849] bg-[#5B2F31]/50 px-3 py-1.5 text-xs font-medium text-[#F07A79]">
                <span className="h-2 w-2 rounded-full bg-[#E06A6A]" />
                Focus Session
              </div>

              <h2 className="text-xl font-semibold">
                Deep work
              </h2>

              <p className="mt-1 text-sm text-[#9B8F8A]">
                Your time is yours.
              </p>
            </div>

            <button
              type="button"
              disabled
              aria-label="Timer settings coming soon"
              className="cursor-not-allowed rounded-xl border border-[#4B4344] p-3 text-[#9B8F8A]"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {/* Circular timer */}
          <div className="flex flex-1 flex-col items-center justify-center py-10">
            <div className="relative h-65 w-65 sm:h-72.5 sm:w-72.5">
              <svg
                viewBox="0 0 300 300"
                className="h-full w-full"
                aria-hidden="true"
              >
                {/* Inner timer face */}
                <circle
                  cx="150"
                  cy="150"
                  r="106"
                  fill="#382D2F"
                />

                <circle
                  cx="150"
                  cy="150"
                  r="106"
                  fill="none"
                  stroke="#5B4143"
                  strokeWidth="1"
                />

                {/* Dial markers */}
                {timerTicks.map((index) => {
                  const major = index % 5 === 0;

                  return (
                    <line
                      key={index}
                      x1="150"
                      y1={major ? "10" : "16"}
                      x2="150"
                      y2="27"
                      transform={`rotate(${index * 6} 150 150)`}
                      stroke={
                        index < 15
                          ? "#E06A6A"
                          : "#756B67"
                      }
                      strokeWidth={major ? 2.5 : 1.5}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Countdown display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mb-3 text-xs font-medium tracking-[0.2em] text-[#C9BDB8] uppercase">
                  Ready
                </span>

                <span className="text-5xl font-semibold tracking-tight text-[#F2ECE8] tabular-nums sm:text-6xl">
                  25:00
                </span>

                <span className="mt-4 text-sm text-[#9B8F8A]">
                  Focus mode
                </span>
              </div>
            </div>

            {/* Duration details */}
            <div className="mt-7 flex items-center gap-2 rounded-full border border-[#4B4344] bg-[#322B2C] px-4 py-2 text-sm text-[#C9BDB8]">
              <Clock3 size={15} />
              <span>25 minute session</span>
            </div>
          </div>

          {/* Timer controls - visual preview */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              disabled
              aria-label="Reset timer coming soon"
              className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full bg-[#3A3334] text-[#9B8F8A]"
            >
              <RotateCcw size={19} />
            </button>

            <button
              type="button"
              disabled
              aria-label="Start timer coming soon"
              className="flex h-16 w-16 cursor-not-allowed items-center justify-center rounded-full bg-[#E06A6A] text-[#1E1919] opacity-70 shadow-[0_8px_28px_rgba(224,106,106,0.18)]"
            >
              <Play size={25} fill="currentColor" />
            </button>

            <button
              type="button"
              disabled
              aria-label="Break mode coming soon"
              className="flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full bg-[#3A3334] text-[#9B8F8A]"
            >
              <Coffee size={19} />
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-[#9B8F8A]">
            Timer controls will be enabled next.
          </p>
        </section>

        {/* NOTES PANEL */}
        <section className="flex min-h-142.5 flex-col rounded-3xl border border-[#4B4344] bg-[#2A2324] p-6 md:p-8">
          {/* Notes heading */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B2F31]/60 text-[#E06A6A]">
              <NotebookPen size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Session Notes
              </h2>

              <p className="text-xs text-[#9B8F8A]">
                Capture your thoughts
              </p>
            </div>
          </div>

          {/* Notes preview */}
          <div className="flex flex-1 flex-col rounded-2xl border border-[#4B4344]/60 bg-[#322B2C] p-5">
            <p className="text-sm leading-7 text-[#9B8F8A]">
              What are you working on today?
            </p>

            <p className="mt-4 text-sm leading-7 text-[#756B67]">
              This space will hold your thoughts,
              discoveries, ideas, and reflections
              throughout each focus session.
            </p>

            <div className="flex-1" />

            <div className="border-t border-[#4B4344] pt-4">
              <span className="text-xs text-[#9B8F8A]">
                Notes editor coming soon
              </span>
            </div>
          </div>

          {/* Bottom card */}
          <div className="mt-5 rounded-2xl border border-[#4B4344] bg-[#322B2C] p-4">
            <div className="flex items-center gap-2 text-[#E06A6A]">
              <Sparkles size={16} />
              <span className="text-sm font-medium">
                A gentle reminder
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#C9BDB8]">
              Progress doesn't have to be loud.
              Small moments of concentration add up.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
