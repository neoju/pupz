import { Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";

import { Button } from "@/components/ui/button";

type ColorScheme = "light" | "dark";

const colorSchemeStorageKey = "pupz-color-scheme";

function getStoredColorScheme(): ColorScheme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const stored = window.localStorage.getItem(colorSchemeStorageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyColorScheme(colorScheme: ColorScheme) {
  const root = document.documentElement;
  root.dataset.theme = colorScheme;
  root.classList.toggle("dark", colorScheme === "dark");
  root.style.colorScheme = colorScheme;
}

export default function RootLayout() {
  const location = useLocation();
  const [colorScheme, setColorScheme] =
    useState<ColorScheme>(getStoredColorScheme);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    applyColorScheme(colorScheme);
  }, [colorScheme]);

  useLayoutEffect(() => {
    const scrollToHash = () => {
      const targetId = window.location.hash.slice(1);
      if (targetId) {
        document
          .getElementById(targetId)
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      }
    };

    const frame = window.requestAnimationFrame(scrollToHash);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  const toggleColorScheme = () => {
    const nextColorScheme = colorScheme === "dark" ? "light" : "dark";
    setColorScheme(nextColorScheme);
    applyColorScheme(nextColorScheme);
    window.localStorage.setItem(colorSchemeStorageKey, nextColorScheme);
  };

  return (
    <div
      className={`site-shell flex min-h-svh flex-col overflow-x-hidden bg-pupz-canvas${
        location.pathname === "/exercise/push-up" ? " is-exercise-route" : ""
      }`}
    >
      <header className={isScrolled ? "site-header is-scrolled" : "site-header"}>
        <a className="brand-mark" href="/" aria-label="pupz home">
          pupz
        </a>

        <nav aria-label="Main navigation" className="hero-nav">
          <a href="/#challenge">Challenge</a>
          <a href="/#progress">Progress</a>
          <a href="/#method">Method</a>
          <a href="/#download">About</a>
        </nav>

        <Button
          className="rounded-[10px] hover:cursor-pointer"
          variant="outline"
          size="icon-sm"
          type="button"
          aria-label={`Switch to ${colorScheme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={colorScheme === "light"}
          title={`Switch to ${colorScheme === "dark" ? "light" : "dark"} mode`}
          onClick={toggleColorScheme}
        >
          {colorScheme === "dark" ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </Button>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="site-footer w-full">
        <p>
          One plan. Every day. <span>Real results.</span>
        </p>
        <p>© {new Date().getFullYear()} pupz</p>
      </footer>
    </div>
  );
}
