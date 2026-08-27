"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { SymptomId } from "./data";
import { key, today } from "./dates";
import { buildHistory, DEFAULT_PROFILE, type Entry, type Profile } from "./seed";

const STORAGE = "marlow.v1";

type State = { profile: Profile; entries: Record<string, Entry> };

type Store = State & {
  ready: boolean;
  todayKey: string;
  todayEntry: Entry | undefined;
  setProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
  saveCheckIn: (severities: Partial<Record<SymptomId, number>>, note?: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

function seeded(profile: Profile): State {
  return { profile, entries: buildHistory(profile) };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => seeded(DEFAULT_PROFILE));
  const [ready, setReady] = useState(false);

  // hydrate on the client only, so nothing date-dependent renders on the server
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed?.profile && parsed?.entries) setState(parsed);
      }
    } catch {
      /* a corrupt cache is not worth an error screen */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE, JSON.stringify(state));
    } catch {
      /* private browsing — the demo still works, it just won't persist */
    }
  }, [state, ready]);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const completeOnboarding = useCallback((patch: Partial<Profile>) => {
    setState((s) => {
      const profile = { ...s.profile, ...patch, onboarded: true };
      // rebuild the history against whatever she actually chose, so Patterns
      // and the report have something to say on day one of the demo
      return { profile, entries: buildHistory(profile) };
    });
  }, []);

  const saveCheckIn = useCallback(
    (severities: Partial<Record<SymptomId, number>>, note?: string) => {
      const k = key(today());
      setState((s) => ({
        ...s,
        entries: { ...s.entries, [k]: { date: k, severities, note: note?.trim() || undefined } },
      }));
    },
    []
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE);
    } catch {}
    setState(seeded(DEFAULT_PROFILE));
  }, []);

  const todayKey = ready ? key(today()) : "";
  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      todayKey,
      todayEntry: state.entries[todayKey],
      setProfile,
      completeOnboarding,
      saveCheckIn,
      reset,
    }),
    [state, ready, todayKey, setProfile, completeOnboarding, saveCheckIn, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
