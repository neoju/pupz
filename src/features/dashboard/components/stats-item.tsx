import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ExerciseStat = {
  readonly name: string;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly current: number;
  readonly goal: number;
  readonly unit: string;
  readonly detail: string;
};

type StatsItemProps = {
  readonly stat: ExerciseStat;
  readonly featured?: boolean;
};

export default function StatsItem({ stat, featured = false }: StatsItemProps) {
  const Icon = stat.icon;
  const progress = Math.min((stat.current / stat.goal) * 100, 100);

  return (
    <Card
      className={cn(
        "min-h-45 justify-between bg-pupz-canvas-raised py-6 ring-0",
        featured &&
          "row-span-2 min-h-94 bg-pupz-accent text-pupz-accent-ink max-[520px]:row-span-1",
      )}
    >
      <CardHeader className="px-6 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                featured
                  ? "bg-pupz-accent-ink/15"
                  : "bg-pupz-accent/10 text-pupz-accent",
              )}
            >
              <Icon aria-hidden="true" />
            </div>

            <div>
              <Badge
                className={cn(
                  "h-5 rounded-md px-1.5 text-[0.6875rem] uppercase tracking-[0.12em]",
                  featured
                    ? "bg-pupz-accent-ink/15 text-pupz-accent-ink hover:bg-pupz-accent-ink/15"
                    : "bg-pupz-accent/10 text-pupz-accent hover:bg-pupz-accent/10",
                )}
                variant="ghost"
              >
                {stat.label}
              </Badge>
              <h3 className="mt-1 font-pupz-display text-2xl font-bold tracking-[-0.04em]">
                {stat.name}
              </h3>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-8 pt-0",
          featured && "flex-1 justify-between gap-6",
        )}
      >
        <p
          className={cn(
            "m-0 font-pupz-display font-extrabold tracking-[-0.08em] tabular-nums",
            featured
              ? "text-[clamp(3.5rem,8vw,7rem)] leading-[0.85]"
              : "text-[clamp(2.75rem,5vw,5rem)] leading-[0.9]",
          )}
        >
          {String(stat.current).padStart(2, "0")}
          <span
            className={cn(
              "text-pupz-accent",
              featured && "text-pupz-accent-ink",
            )}
          >
            <span className="sr-only"> of </span> / {stat.goal}
          </span>
        </p>

        {featured && (
          <div className="grid grid-cols-2 gap-6 border-t border-pupz-accent-ink/15 pt-4">
            <div>
              <p className="m-0 font-pupz-display text-3xl leading-none font-bold tabular-nums">
                {Math.round(progress)}
                <span className="text-base">%</span>
              </p>
              <p className="mt-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-pupz-accent-ink/90">
                Complete
              </p>
            </div>
            <div className="border-l border-pupz-accent-ink/15 pl-6">
              <p className="m-0 font-pupz-display text-3xl leading-none font-bold tabular-nums">
                {Math.max(0, stat.goal - stat.current)}
              </p>
              <p className="mt-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-pupz-accent-ink/90">
                {stat.unit} left
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Progress
            aria-label={`${stat.name} progress: ${Math.round(progress)}%`}
            className={cn(
              "gap-0 [&_[data-slot=progress-track]]:h-1 [&_[data-slot=progress-track]]:bg-pupz-ink/15 [&_[data-slot=progress-indicator]]:bg-pupz-accent",
              featured &&
                "[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-pupz-accent-ink/20 [&_[data-slot=progress-indicator]]:bg-pupz-accent-ink",
            )}
            value={progress}
          />
          <p
            className={cn(
              "text-sm",
              featured ? "text-pupz-accent-ink/90" : "text-pupz-ink-dim",
            )}
          >
            {stat.detail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
