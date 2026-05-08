"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const themeChangeEvent = "themechange";

const controls: Array<{
  value: Theme;
  label: string;
  icon: ReactNode;
}> = [
  { value: "light", label: "라이트 모드", icon: <SunIcon /> },
  { value: "dark", label: "다크 모드", icon: <MoonIcon /> },
  { value: "system", label: "시스템 모드", icon: <MonitorIcon /> },
];

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
}

function readTheme(): Theme {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedTheme = localStorage.getItem("theme");
  return savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
    ? savedTheme
    : "system";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readTheme() === "system") {
      applyTheme("system");
    }
    callback();
  };

  window.addEventListener("storage", onChange);
  window.addEventListener(themeChangeEvent, onChange);
  media.addEventListener("change", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(themeChangeEvent, onChange);
    media.removeEventListener("change", onChange);
  };
}

export function ThemeControls() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "system");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function selectTheme(nextTheme: Theme) {
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {controls.map((control) => (
        <button
          key={control.value}
          type="button"
          aria-label={control.label}
          aria-pressed={theme === control.value}
          title={control.label}
          className={cn(
            "group flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-in-out hover:text-black dark:hover:text-white",
            theme === control.value && "text-black dark:text-white",
          )}
          onClick={() => selectTheme(control.value)}
        >
          {control.icon}
        </button>
      ))}
    </div>
  );
}
