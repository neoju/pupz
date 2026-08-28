import { Fragment } from "react";

import { Separator } from "@/components/ui/separator";

const principles = [
  [
    "01",
    "Small enough to repeat",
    "A focused daily target makes consistency feel possible, even on busy days.",
  ],
  [
    "02",
    "Clear enough to trust",
    "See exactly what is left, what you have done, and when your streak is safe.",
  ],
  [
    "03",
    "Strong enough to stick",
    "Build capacity gradually without turning every workout into a performance.",
  ],
] as const;

export function ChallengeMethod() {
  return (
    <section
      className="mx-auto grid max-w-360 grid-cols-1 gap-12 border-b border-pupz-line px-6 py-24 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)] lg:gap-[clamp(3rem,10vw,9rem)] lg:px-[clamp(3rem,9vw,8rem)]"
      id="method"
      aria-labelledby="method-title"
    >
      <div>
        <p className="mb-4 text-xs font-bold tracking-[0.16em] text-pupz-accent uppercase">
          The method
        </p>
        <h2
          className="max-w-[22rem] font-pupz-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.93] font-bold tracking-[-0.07em] text-pupz-ink text-balance"
          id="method-title"
        >
          The plan is simple on purpose.
        </h2>
      </div>

      <ol className="m-0 list-none p-0">
        {principles.map(([index, title, description], principleIndex) => (
          <Fragment key={index}>
            <li className="mb-8 grid grid-cols-[56px_minmax(0,1fr)] gap-6 p-4">
              <span className="text-xs font-bold tracking-[0.12em] text-pupz-accent">
                {index}
              </span>
              <div>
                <h3 className="mb-2 font-pupz-display text-2xl font-bold tracking-[-0.04em] text-pupz-ink">
                  {title}
                </h3>
                <p className="max-w-[28rem] text-[0.9375rem] leading-[1.6] text-pupz-ink-muted">
                  {description}
                </p>
              </div>
            </li>
            {principleIndex < principles.length - 1 && (
              <Separator className="bg-pupz-line" />
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
