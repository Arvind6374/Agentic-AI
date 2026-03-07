import { useState, useCallback } from 'react';

const KEY = 'arthashastra_qhist';

export function useQueryHistory() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  });

  const addToHistory = useCallback((result) => {
    setHistory(prev => {
      const next = [{ ...result, timestamp: new Date().toISOString() }, ...prev].slice(0, 100);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { history, addToHistory };
}
