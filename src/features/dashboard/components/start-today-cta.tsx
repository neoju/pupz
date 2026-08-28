import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./start-today-cta.css";

export function StartTodayCta() {
  return (
    <section
      className="cta-section relative mx-auto flex min-h-100 max-w-360 flex-col items-start justify-end gap-8 overflow-hidden bg-pupz-canvas-raised px-6 py-24 lg:flex-row lg:items-end lg:justify-between lg:px-[clamp(3rem,9vw,8rem)]"
      id="download"
      aria-labelledby="cta-title"
    >
      <div>
        <p className="mb-4 text-xs font-bold tracking-[0.16em] text-pupz-accent uppercase">
          Ready when you are
        </p>
        <h2
          className="relative z-1 max-w-[34rem] font-pupz-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.93] font-bold tracking-[-0.07em] text-pupz-ink text-balance"
          id="cta-title"
        >
          Your next good day starts with one small choice.
        </h2>
      </div>
      <div className="relative z-1 flex flex-col items-start gap-6 lg:flex-row lg:items-center">
        <p className="max-w-48 m-0 text-sm leading-[1.5] text-pupz-ink-muted">
          Come back tomorrow, check in, and keep building your rhythm.
        </p>
        <a
          className={cn(
            buttonVariants({ size: "lg" }),
            "min-h-12 gap-4 rounded-[10px] bg-pupz-accent px-6 text-xs font-bold tracking-[0.08em] text-pupz-accent-ink uppercase transition-[background-color,transform,box-shadow] hover:bg-pupz-accent/90 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] active:translate-y-px active:scale-[0.985]",
          )}
          href="#challenge"
        >
          Start a set
          <ArrowUpRight aria-hidden="true" data-icon="inline-end" />
        </a>
      </div>
    </section>
  );
}
