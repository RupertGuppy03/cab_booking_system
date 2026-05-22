/**
 * Student: Rupert Guppy (23196925)
 * File: usePersistentState.js
 * Description: Drop-in replacement for useState that mirrors state to sessionStorage.
 *              State persists across React Router navigation within the same browser tab
 *              and clears automatically when the tab is closed.
 * Functions: usePersistentState
 */

import { useState, useEffect } from 'react';

/** Behaves like useState but reads from and writes to sessionStorage under the given key. */
export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(state)); }
    catch {}
  }, [key, state]);

  return [state, setState];
}
