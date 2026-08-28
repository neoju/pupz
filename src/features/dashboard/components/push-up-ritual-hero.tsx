import { ArrowRight, ChevronDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import "./push-up-ritual-hero.css";

export function PushUpRitualHero() {
  return (
    <section
      className="hero relative flex min-h-[min(880px,92svh)] items-end overflow-hidden bg-pupz-canvas px-6 pb-16 pt-[clamp(9rem,18vh,12rem)] isolate"
      id="challenge"
      aria-labelledby="hero-title"
    >
      <img
        className="hero-media absolute inset-0 size-full object-cover object-center"
        src="/hero-workout.png"
        alt="Athlete doing a push-up on a mat in a sunlit living room"
        width="1672"
        height="941"
        fetchPriority="high"
        decoding="async"
      />
      <div className="hero-content relative z-2 w-full max-w-[53.75rem]">
        <p className="mb-4 text-xs font-bold tracking-[0.16em] text-pupz-accent uppercase">
          Daily push-up challenge
        </p>
        <h1
          className="max-w-[56.25rem] font-pupz-display text-[clamp(3.5rem,8.4vw,8rem)] leading-[0.86] font-extrabold tracking-[-0.08em] text-pupz-ink uppercase text-balance"
          id="hero-title"
        >
          Build your
          <br />
          push-up ritual.
        </h1>
        <p className="my-6 mb-8 max-w-[34rem] text-[clamp(1rem,1.4vw,1.125rem)] leading-[1.5] text-pupz-ink-muted">
          A simple daily plan that gets stronger with you. Start where you are,
          show up tomorrow, and let the reps add up.
        </p>
        <a
          className={cn(
            buttonVariants({ size: "lg" }),
            "min-h-12 gap-4 rounded-[10px] bg-pupz-accent px-6 text-xs font-bold tracking-[0.08em] text-pupz-accent-ink uppercase transition-[background-color,transform,box-shadow] hover:bg-pupz-accent/90 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] active:translate-y-px active:scale-[0.985]",
          )}
          href="#progress"
        >
          Start today
          <ArrowRight aria-hidden="true" data-icon="inline-end" />
        </a>
      </div>

      <Card
        className="metric-panel absolute right-6 bottom-16 z-3 w-[min(250px,calc(100%-48px))] overflow-hidden rounded-[18px] bg-pupz-hero-panel/80 p-0 text-pupz-ink backdrop-blur-lg"
        aria-label="Today's push-up progress"
      >
        <CardHeader className="p-6 pb-0">
          <p className="m-0 text-xs font-bold tracking-[0.13em] text-pupz-ink-muted uppercase">
            Today
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-6 pt-0">
          <p className="my-4 mb-2 flex items-baseline gap-2 font-pupz-display text-5xl leading-none font-extrabold tracking-[-0.08em] tabular-nums">
            18 <span className="text-pupz-accent">/</span> 30
          </p>
          <p className="mb-4 m-0 text-[0.6875rem] font-bold tracking-[0.13em] text-pupz-ink-dim uppercase">
            Push-ups
          </p>
          <Progress
            aria-label="Push-up progress"
            className="gap-0 [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:bg-pupz-ink/20 [&_[data-slot=progress-indicator]]:bg-pupz-accent"
            value={60}
          />
        </CardContent>
      </Card>

      <a
        className="absolute right-6 bottom-6 z-2 inline-flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.1em] text-pupz-ink-dim uppercase transition-colors hover:text-pupz-ink max-[800px]:hidden"
        href="#progress"
      >
        Scroll to progress
        <ChevronDown aria-hidden="true" data-icon="inline-end" />
      </a>
    </section>
  );
}
