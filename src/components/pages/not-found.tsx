import { ArrowRight, Compass } from "lucide-react";
import { Link } from "react-router";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./not-found.css";

export default function NotFoundPage() {
  return (
    <section
      className="not-found relative mt-0 flex min-h-[min(760px,88svh)] items-center overflow-hidden bg-pupz-canvas isolate md:mt-20"
      aria-labelledby="not-found-title"
    >
      <div className="relative z-1 mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-6 pb-16 pt-[clamp(10rem,18vh,12rem)] lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)] lg:gap-[clamp(3rem,10vw,6rem)] lg:px-[clamp(3rem,9vw,8rem)]">
        <div className="not-found-content relative z-1 max-w-[34rem] self-center">
          <p className="mb-4 text-xs font-bold tracking-[0.16em] text-pupz-accent uppercase">
            Off the daily plan
          </p>
          <h1
            className="max-w-[9ch] font-pupz-display text-[clamp(4rem,8vw,7rem)] leading-[0.86] font-extrabold tracking-[-0.08em] text-pupz-ink uppercase text-balance"
            id="not-found-title"
          >
            This rep went missing.
          </h1>
          <p className="my-6 mb-8 max-w-[30rem] text-[clamp(1rem,1.4vw,1.125rem)] leading-[1.5] text-pupz-ink-muted text-pretty">
            The page you were looking for has moved, or it never made it into
            the set. Let&apos;s get you back to something useful.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-12 gap-4 rounded-[10px] bg-pupz-accent px-6 text-xs font-bold tracking-[0.08em] text-pupz-accent-ink uppercase transition-[background-color,transform,box-shadow] hover:bg-pupz-accent/90 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_color-mix(in_srgb,var(--color-accent)_18%,transparent)] active:translate-y-px active:scale-[0.985]",
              )}
              to="/"
            >
              Back to the start
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center gap-2 text-xs font-bold tracking-[0.08em] text-pupz-ink-muted uppercase transition-[color,transform] hover:-translate-y-0.5 hover:text-pupz-ink"
              to="/#progress"
            >
              Check your progress
              <Compass aria-hidden="true" data-icon="inline-end" />
            </Link>
          </div>
        </div>

        <div className="not-found-route" aria-hidden="true">
          <div className="not-found-route-grid" />
          <span className="not-found-route-number">404</span>
          <span className="not-found-route-label">ROUTE INTERRUPTED</span>
          <span className="not-found-route-point not-found-route-point-start" />
          <span className="not-found-route-point not-found-route-point-end" />
          <svg
            className="not-found-route-line"
            viewBox="0 0 420 300"
            fill="none"
          >
            <path d="M42 248C110 248 100 98 190 98s67 126 188-34" />
          </svg>
          <div className="not-found-route-meta">
            <span>SET STATUS</span>
            <strong>PAUSED</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
