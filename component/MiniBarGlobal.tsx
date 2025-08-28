'use client';

import { usePathname } from 'next/navigation';
import MiniBar from '@/component/minibar';
import { useData } from '@/component/providers/DataProvider';

export default function MiniBarGlobal() {
  const pathname = usePathname();
  const { t700Now, t700Past24h, t500Now, t500Past24h } = useData();

  if (pathname === '/') return null; // hide di main page

  return (
    <div className="px-3 py-2 bg-background">
      <MiniBar
        items={[
          { tank: 'T700', label: 'COD', unit: 'mg/L', now: t700Now?.cod, past: t700Past24h?.cod },
          { tank: 'T700', label: 'TSS', unit: 'mg/L', now: t700Now?.tss, past: t700Past24h?.tss },
          { tank: 'T700', label: 'pH', unit: '', now: t700Now?.pH, past: t700Past24h?.pH },
          { tank: 'T700', label: 'Suhu', unit: '°C', now: t700Now?.temperature, past: t700Past24h?.temperature },
          { tank: 'T500', label: 'COD', unit: 'mg/L', now: t500Now?.cod, past: t500Past24h?.cod },
          { tank: 'T500', label: 'TSS', unit: 'mg/L', now: t500Now?.tss, past: t500Past24h?.tss },
        ]}
      />
    </div>
  );
}
