// /component/dashboard/minibar.tsx
'use client';

type MetricItem = {
  label: string;          // "COD", "TSS", ...
  unit?: string;          // "mg/L", "°C", ...
  tank: string;           // "T700" | "T500"
  now?: number | null;    // nilai sekarang
  past?: number | null;   // nilai 24 jam lalu
};

function fmt(v?: number | null) {
  return v == null ? '—' : Number.isFinite(v) ? +(+v).toFixed(2) : '—';
}

function pctChange(now?: number | null, past?: number | null) {
  if (now == null || past == null || past === 0) return null;
  return ((now - past) / past) * 100;
}

function Pill({ item }: { item: MetricItem }) {
  const pct = pctChange(item.now, item.past);

  return (
    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm border bg-card
+   shrink-0 snap-start w-[calc(50vw-0.5rem)] max-w-[260px] sm:w-auto sm:min-w-[200px]
+   first:ml-2 last:mr-2">
      <div className="min-w-[80px]">
        <div className="text-[11px] text-gray-500">{item.tank} {item.label}</div>
        <div className="text-sm font-semibold">
          {fmt(item.now)}{item.unit ? ` ${item.unit}` : ''}
        </div>
      </div>

      {/* Hanya teks persentase, tanpa bar */}
      <div className="text-xs text-gray-600 whitespace-nowrap ml-3">
        {pct == null ? '—' : `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`}
        <span className="text-gray-400"> / 24h</span>
      </div>
    </div>
  );
}

export default function MiniBar({ items }: { items: MetricItem[] }) {
  return (
    <div className="flex flex-nowrap gap-3 overflow-x-auto snap-x snap-mandatory scroll-px-2
  [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((it, i) => <Pill key={i} item={it} />)}
    </div>
  );
}
