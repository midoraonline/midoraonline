import { create } from "zustand";

const STORAGE_KEY = "midora:presence:online_count";

function readCachedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeCachedCount(n: number) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(n));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

type PresenceState = {
  onlineCount: number;
  lastNonZero: number;
  hydrated: boolean;
  setCount: (n: number) => void;
};

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineCount: 0,
  lastNonZero: 0,
  hydrated: false,
  setCount: (n) => {
    const prev = get();
    // Ignore transient drops to 0 — usually reconnect flicker.
    // Only accept 0 if the tracker has confirmed hydration and no non-zero yet.
    if (n === 0 && prev.lastNonZero > 0) return;
    if (n === prev.onlineCount) return;
    if (n > 0) writeCachedCount(n);
    set({
      onlineCount: n,
      lastNonZero: n > 0 ? n : prev.lastNonZero,
      hydrated: true,
    });
  },
}));

export function hydratePresenceFromCache() {
  if (typeof window === "undefined") return;
  const cached = readCachedCount();
  if (cached > 0) {
    usePresenceStore.setState({
      onlineCount: cached,
      lastNonZero: cached,
      hydrated: false,
    });
  }
}
