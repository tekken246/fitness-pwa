'use client';

import { useEffect, useState } from 'react';

const REST_KEY = 'fittrack:restSeconds';
const DEFAULT_REST_SECONDS = 120;

/** Device-level rest-timer target (seconds), persisted in localStorage. */
export function useRestSeconds(): [number, (value: number) => void] {
  const [restSeconds, setRestSeconds] = useState<number>(DEFAULT_REST_SECONDS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(REST_KEY);
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed > 0) {
        setRestSeconds(parsed);
      }
    } catch {
      // ignore unavailable storage
    }
  }, []);

  const update = (value: number): void => {
    const clamped = Math.max(15, Math.min(600, Math.round(value)));
    setRestSeconds(clamped);
    try {
      window.localStorage.setItem(REST_KEY, String(clamped));
    } catch {
      // ignore unavailable storage
    }
  };

  return [restSeconds, update];
}
