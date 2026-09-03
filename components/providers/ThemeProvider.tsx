"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeCtx = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const STORAGE_KEY = "midora-theme";
const Ctx = createContext<ThemeCtx | null>(null);

function readSystemPref(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    /* localStorage disabled */
  }
  return "system";
}

function applyResolved(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Flip color-scheme too so form controls / scrollbars follow.
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start deterministic ("system") so SSR and first client render match.
  // Real value is hydrated from localStorage in the effect below.
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolvedState] = useState<ResolvedTheme>("light");

  // Mount: read localStorage, sync state to whatever the pre-hydration
  // script already applied to <html>.
  useEffect(() => {
    const stored = readStoredMode();
    const next: ResolvedTheme = stored === "system" ? readSystemPref() : stored;
    setModeState(stored);
    setResolvedState(next);
    applyResolved(next);
  }, []);

  // Any subsequent mode change: apply + subscribe to system pref if needed.
  useEffect(() => {
    const next: ResolvedTheme = mode === "system" ? readSystemPref() : mode;
    setResolvedState(next);
    applyResolved(next);

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolvedState(r);
      applyResolved(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
    setModeState(m);
  }, []);

  const toggle = useCallback(() => {
    // Cycle light → dark → system → light
    setMode(mode === "light" ? "dark" : mode === "dark" ? "system" : "light");
  }, [mode, setMode]);

  const value = useMemo<ThemeCtx>(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback so components outside the provider don't crash during
    // SSR or early hydration — they'll just render the light default.
    return {
      mode: "system",
      resolved: "light",
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
