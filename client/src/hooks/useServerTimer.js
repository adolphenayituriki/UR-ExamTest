import { useEffect, useRef, useState } from 'react';

export function useServerTimer({ serverNow, endsAt, running = true, onExpire }) {
  const [remaining, setRemaining] = useState(0);
  const offsetRef = useRef(0);
  const syncRef = useRef({ endsAt: 0, running: false });
  const expireRef = useRef(onExpire);
  const firedRef = useRef(false);

  expireRef.current = onExpire;

  useEffect(() => {
    if (!endsAt) return undefined;
    const offset = serverNow
      ? Date.now() - new Date(serverNow).getTime()
      : offsetRef.current;
    offsetRef.current = offset;
    syncRef.current = { endsAt: new Date(endsAt).getTime(), running };

    const tick = () => {
      if (!syncRef.current.endsAt) return;
      const left = Math.max(
        0,
        Math.ceil(
          (syncRef.current.endsAt - (Date.now() - offsetRef.current)) / 1000
        )
      );
      setRemaining(left);
      if (left <= 0 && syncRef.current.running && !firedRef.current) {
        firedRef.current = true;
        expireRef.current?.();
      }
    };

    if (remaining > 0) firedRef.current = false;
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverNow, endsAt, running]);

  return remaining;
}
