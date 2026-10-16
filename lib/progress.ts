"use client";
import { useEffect, useState, useCallback } from "react";
const KEY = "wetlab-sim-v1";
export type StepRec = { points: number; attempts: number };
export type State = { steps: Record<string, StepRec>; blocks: Record<string, { lost: number }> };
const empty: State = { steps: {}, blocks: {} };
export function load(): State { try { return JSON.parse(localStorage.getItem(KEY) || "") || empty; } catch { return empty; } }
export function useProgress() {
  const [s, setS] = useState<State>(empty); const [ready, setReady] = useState(false);
  useEffect(() => { setS(load()); setReady(true); }, []);
  const update = useCallback((fn: (s: State) => State) => { setS(prev => { const n = fn(prev); localStorage.setItem(KEY, JSON.stringify(n)); return n; }); }, []);
  const reset = useCallback(() => { localStorage.removeItem(KEY); setS(empty); }, []);
  return { s, update, reset, ready };
}
export const MAX = 10;
