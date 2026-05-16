'use client';

import { useEffect } from 'react';

/** Registers the offline-safe service worker in supported browsers. */
export function RegisterServiceWorker(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    });
  }, []);

  return null;
}
