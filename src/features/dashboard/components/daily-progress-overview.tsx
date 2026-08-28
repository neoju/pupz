import { Activity, Dumbbell, Flame } from "lucide-react";

import StatsItem, { type ExerciseStat } from "./stats-item";

const stats: readonly ExerciseStat[] = [
  {
    name: "Today's target",
    icon: Activity,
    label: "Today",
    current: 18,
    goal: 30,
    unit: "reps",
    detail: "12 reps left to close out your set.",
  },
  {
    name: "Current streak",
    icon: Flame,
    label: "Consistency",
    current: 6,
    goal: 7,
    unit: "days",
    detail: "One more day keeps the rhythm going.",
  },
  {
    name: "This week",
    icon: Dumbbell,
    label: "Volume",
    current: 98,
    goal: 120,
    unit: "reps",
    detail: "Push-ups completed this week.",
  },
];

export function DailyProgressOverview() {
  return (
    <section
      className="mx-auto grid max-w-360 grid-cols-1 gap-12 border-b border-pupz-line px-6 py-24 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)] lg:gap-[clamp(3rem,10vw,9rem)] lg:px-[clamp(3rem,9vw,8rem)]"
      id="progress"
      aria-labelledby="progress-title"
    >
      <div>
        <p className="mb-4 text-xs font-bold tracking-[0.16em] text-pupz-accent uppercase">
          Your baseline
        </p>
        <h2
          className="max-w-[22rem] font-pupz-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.93] font-bold tracking-[-0.07em] text-pupz-ink text-balance"
          id="progress-title"
        >
          A little progress, every day.
        </h2>
        <p className="mt-6 max-w-[30rem] text-base leading-[1.6] text-pupz-ink-muted">
          Keep the target close. pupz makes the next set obvious, then gets out
          of your way so you can do the work.
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-4 min-[521px]:grid-cols-2"
        aria-label="Challenge statistics"
      >
        <StatsItem featured stat={stats[0]} />
        <StatsItem stat={stats[1]} />
        <StatsItem stat={stats[2]} />
      </div>
    </section>
  );
}
