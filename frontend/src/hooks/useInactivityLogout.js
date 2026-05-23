import { useEffect, useRef, useCallback } from 'react';

export default function useInactivityLogout(onWarning, inactivityMs = 120000) {
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onWarning, inactivityMs);
  }, [onWarning, inactivityMs]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      stop();
    };
  }, [reset, stop]);

  return { reset, stop };
}
