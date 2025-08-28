'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Row = Record<string, any> | null;
type DataCtx = {
  t700Now: Row; t700Past24h: Row;
  t500Now: Row; t500Past24h: Row;
  reload: () => void;
};

const Ctx = createContext<DataCtx | null>(null);

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used within <DataProvider>');
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [t700Now, setT700Now] = useState<Row>(null);
  const [t700Past24h, setT700Past24h] = useState<Row>(null);
  const [t500Now, setT500Now] = useState<Row>(null);
  const [t500Past24h, setT500Past24h] = useState<Row>(null);

  const load = async () => {
    const ts = Date.now();
    const [p700, p500] = await Promise.all([
      fetch(`/api/last_data?table=t700&agoHours=24&_=${ts}`, { cache: 'no-store' }).then(r=>r.json()),
      fetch(`/api/last_data?table=t500&agoHours=24&_=${ts}`, { cache: 'no-store' }).then(r=>r.json()),
    ]);
    // ekspektasi: { current, past }
    setT700Now(p700?.current ?? null);
    setT700Past24h(p700?.past ?? null);
    setT500Now(p500?.current ?? null);
    setT500Past24h(p500?.past ?? null);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 120_000); // 2 menit
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return (
    <Ctx.Provider value={{ t700Now, t700Past24h, t500Now, t500Past24h, reload: load }}>
      {children}
    </Ctx.Provider>
  );
}
