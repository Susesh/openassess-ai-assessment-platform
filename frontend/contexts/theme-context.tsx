"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
  customColors: ThemeColors;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  previewTheme: (theme: Theme, colors?: Partial<ThemeColors>) => void;
  applyPreview: () => void;
  cancelPreview: () => void;
  isPreviewing: boolean;
  resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default color palettes
const defaultLightColors: ThemeColors = {
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#10B981",
  background: "#F5F6F7",
  surface: "#FFFFFF",
  text: "#2B2E33",
  border: "#C1C4C8",
};

const defaultDarkColors: ThemeColors = {
  primary: "#60A5FA",
  secondary: "#A78BFA",
  accent: "#34D399",
  background: "#0D0E10",
  surface: "#1A1D23",
  text: "#F9FAFB",
  border: "#2D3139",
};

// Simple encryption for localStorage (for production, use proper encryption)
const encrypt = (data: string): string => {
  return btoa(data); // Base64 encoding (not true encryption, but obfuscates)
};

const decrypt = (data: string): string => {
  try {
    return atob(data);
  } catch {
    return data;
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [customColors, setCustomColorsState] = useState<ThemeColors>(defaultLightColors);
  const [previewColors, setPreviewColors] = useState<ThemeColors | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load theme from localStorage with decryption
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      try {
        setThemeState(decrypt(savedTheme) as Theme);
      } catch {
        setThemeState("system");
      }
    }

    // Load custom colors from localStorage
    const savedColors = localStorage.getItem("customColors");
    if (savedColors) {
      try {
        setCustomColorsState(JSON.parse(decrypt(savedColors)));
      } catch {
        setCustomColorsState(defaultLightColors);
      }
    }
  }, []);

  const applyThemeColors = useCallback((themeMode: "light" | "dark", colors: ThemeColors) => {
    const root = document.documentElement;
    
    // Apply smooth transition
    root.style.setProperty("--transition-duration", "300ms");
    
    // Apply custom colors
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-secondary", colors.secondary);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-background", colors.background);
    root.style.setProperty("--color-surface", colors.surface);
    root.style.setProperty("--color-text", colors.text);
    root.style.setProperty("--color-border", colors.border);

    // Apply theme-specific palette
    if (themeMode === "dark") {
      root.style.setProperty("--color-palette-light", colors.background);
      root.style.setProperty("--color-palette-border", colors.border);
      root.style.setProperty("--color-palette-muted", "#9CA3AF");
      root.style.setProperty("--color-palette-dark", colors.text);
      root.style.setProperty("--glass-bg", `rgba(26, 29, 35, 0.8)`);
      root.style.setProperty("--glass-border", "rgba(255, 255, 255, 0.1)");
    } else {
      root.style.setProperty("--color-palette-light", colors.background);
      root.style.setProperty("--color-palette-border", colors.border);
      root.style.setProperty("--color-palette-muted", "#7B7F85");
      root.style.setProperty("--color-palette-dark", colors.text);
      root.style.setProperty("--glass-bg", `rgba(255, 255, 255, 0.7)`);
      root.style.setProperty("--glass-border", "rgba(255, 255, 255, 0.18)");
    }

    // Apply data attribute
    root.setAttribute("data-theme", themeMode);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    let resolvedTheme: "light" | "dark";
    
    if (theme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolvedTheme = theme;
    }

    setActualTheme(resolvedTheme);

    // Use preview colors if previewing, otherwise use custom colors
    const colorsToApply = isPreviewing && previewColors ? previewColors : customColors;
    const resolvedColors = resolvedTheme === "dark" 
      ? { ...defaultDarkColors, ...colorsToApply }
      : { ...defaultLightColors, ...colorsToApply };

    applyThemeColors(resolvedTheme, resolvedColors);

    // Save to localStorage with encryption
    if (!isPreviewing) {
      localStorage.setItem("theme", encrypt(theme));
    }
  }, [theme, mounted, customColors, isPreviewing, previewColors, applyThemeColors]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const setCustomColors = useCallback((colors: Partial<ThemeColors>) => {
    setCustomColorsState(prev => {
      const updated = { ...prev, ...colors };
      // Save to localStorage with encryption
      localStorage.setItem("customColors", encrypt(JSON.stringify(updated)));
      return updated;
    });
  }, []);

  const previewTheme = useCallback((previewTheme: Theme, colors?: Partial<ThemeColors>) => {
    setIsPreviewing(true);
    if (colors) {
      const baseColors = previewTheme === "dark" ? defaultDarkColors : defaultLightColors;
      setPreviewColors({ ...baseColors, ...colors });
    }
    setThemeState(previewTheme);
  }, []);

  const applyPreview = useCallback(() => {
    if (previewColors) {
      setCustomColors(previewColors);
    }
    setIsPreviewing(false);
    setPreviewColors(null);
  }, [previewColors, setCustomColors]);

  const cancelPreview = useCallback(() => {
    setIsPreviewing(false);
    setPreviewColors(null);
    // Revert to saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      try {
        setThemeState(decrypt(savedTheme) as Theme);
      } catch {
        setThemeState("system");
      }
    }
  }, []);

  const resetCustomColors = useCallback(() => {
    const defaultColors = actualTheme === "dark" ? defaultDarkColors : defaultLightColors;
    setCustomColors(defaultColors);
  }, [actualTheme, setCustomColors]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const resolvedTheme = mediaQuery.matches ? "dark" : "light";
      setActualTheme(resolvedTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme, 
        actualTheme,
        customColors,
        setCustomColors,
        previewTheme,
        applyPreview,
        cancelPreview,
        isPreviewing,
        resetCustomColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
