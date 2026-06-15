"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const storageKey = "powerpicks-theme";

function getStoredTheme(): Theme {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = getStoredTheme();
      setTheme(storedTheme);
      applyTheme(storedTheme);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function chooseTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div className="theme-toggle" aria-label="Theme mode">
      <button
        type="button"
        aria-pressed={theme === "light"}
        data-active={theme === "light"}
        onClick={() => chooseTheme("light")}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        data-active={theme === "dark"}
        onClick={() => chooseTheme("dark")}
      >
        Dark
      </button>
    </div>
  );
}
