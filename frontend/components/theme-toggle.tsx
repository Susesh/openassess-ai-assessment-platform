"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

export function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#C1C4C8] bg-[#F5F6F7] p-1">
      <button
        onClick={() => setTheme("light")}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
          theme === "light" ? "bg-[#2B2E33] text-[#F5F6F7]" : "text-[#7B7F85] hover:text-[#2B2E33]"
        }`}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
          theme === "system" ? "bg-[#2B2E33] text-[#F5F6F7]" : "text-[#7B7F85] hover:text-[#2B2E33]"
        }`}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
          theme === "dark" ? "bg-[#2B2E33] text-[#F5F6F7]" : "text-[#7B7F85] hover:text-[#2B2E33]"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
