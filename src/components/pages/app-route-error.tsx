import { isRouteErrorResponse, useRouteError } from "react-router";

import { buttonVariants } from "@/components/ui/button";

export function AppRouteError() {
  const error = useRouteError();
  const detail = isRouteErrorResponse(error)
    ? error.statusText || `Request returned ${error.status}`
    : error instanceof Error
      ? error.message
      : "The page could not load.";

  return (
    <section className="flex min-h-[70svh] items-center justify-center px-6 text-center">
      <div className="flex max-w-md flex-col gap-6">
        <p className="font-mono text-sm font-medium tracking-[0.3em] text-pupz-ink-dim uppercase">
          Something went wrong
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="font-pupz-display text-5xl font-bold tracking-[-0.06em] text-pupz-ink">
            We couldn&apos;t load this page.
          </h1>
          <p className="text-pupz-ink-muted">{detail}</p>
        </div>
        <a
          className={buttonVariants({ className: "self-center bg-pupz-accent text-pupz-accent-ink hover:bg-pupz-accent/90" })}
          href="/"
        >
          Return home
        </a>
      </div>
    </section>
  );
}
