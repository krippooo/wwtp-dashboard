'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/component/ui/card';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

type Source = 't700' | 't500';

type Point = {
  timestamp: string | number | Date;
  source: Source;
  cod?: number | null;
  tss?: number | null;
  pH?: number | null;           // gunakan kapital H kalau di DB memang begitu
  temperature?: number | null;  // konsisten: pakai "temperature"
};

const SERIES: Array<{ key: keyof Point; label: string }> = [
  { key: 'cod',         label: 'COD' },
  { key: 'tss',         label: 'TSS' },
  { key: 'pH',          label: 'pH' },
  { key: 'temperature', label: 'Suhu' },
];

const UNIT: Record<string, string> = {
  cod: 'mg/L',
  tss: 'mg/L',
  pH: '',
  temperature: '°C',
};

const COLORS: Record<Source, Record<string, string>> = {
  t700: { cod: '#2c6e49', tss: '#F17105', pH: '#6610F2', temperature: '#DD0426' },
  t500: { cod: '#2c6e49', tss: '#F17105', pH: '#6610F2', temperature: '#DD0426' },
};

function keyFromLabel(label: string): keyof typeof UNIT | undefined {
  const entry = SERIES.find(s => s.label === label);
  return entry?.key;
}

export default function AnalyticsChart() {
  const [rows, setRows] = useState<Point[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [resT700, resT500] = await Promise.all([
          fetch('/api/chartdata?table=t700'),
          fetch('/api/chartdata?table=t500'),
        ]);
        const [jsonT700, jsonT500] = await Promise.all([resT700.json(), resT500.json()]);
        const t700 = (jsonT700 ?? []).map((d: any) => ({ ...d, source: 't700' as const }));
        const t500 = (jsonT500 ?? []).map((d: any) => ({ ...d, source: 't500' as const }));

        // --- normalisasi properti supaya konsisten ---
        const norm = (d: any): Point => ({
          timestamp: d.timestamp,               // pastikan API kirim ISO/number
          source: d.source,
          cod: toNum(d.cod),
          tss: toNum(d.tss),
          pH: toNum(d.pH ?? d.ph),              // fallback kalau API pakai "ph"
          temperature: toNum(d.temperature ?? d.temp),
        });

        setRows([...t700, ...t500].map(norm));
      } catch (e) {
        console.error('Fetch error:', e);
      }
    })();
  }, []);

  const dataBySource = useMemo(() => ({
    t700: rows.filter(r => r.source === 't700'),
    t500: rows.filter(r => r.source === 't500'),
  }), [rows]);

  const latestDate = (src: Source) => {
    const list = dataBySource[src];
    if (!list.length) return null;
    const max = list.reduce<number>((acc, cur) => {
      const t = new Date(cur.timestamp).getTime();
      return Number.isFinite(t) ? Math.max(acc, t) : acc;
    }, 0);
    return max ? new Date(max) : null;
  };

  const renderOne = (src: Source) => {
    const data = dataBySource[src];
    if (!data.length) return null;

    // Lebar dinamis: 60px per titik, min 320
    const chartWidth = Math.max(data.length * 60, 320);

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{src.toUpperCase()}</CardTitle>
              <CardDescription>Monitoring kualitas air {src.toUpperCase()}</CardDescription>
            </div>
            {latestDate(src) && (
              <div className="text-right">
                <div className="text-sm font-medium text-black">Pembacaan terakhir</div>
                <div className="text-xs text-muted-foreground">
                  {format(latestDate(src)!, 'HH:mm:ss, MMM dd, yyyy')}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div style={{ width: chartWidth, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                >
                  <CartesianGrid />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(v) => safeFormatTime(v)}
                    interval="preserveStartEnd"
                    minTickGap={40}
                    tick={{ fontSize: 12 }}
                    tickMargin={6}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickMargin={6}
                  />
                  <Tooltip
                    labelFormatter={(v) => safeFormatTime(v)}
                    formatter={(value: any, name: string) => {
                    const key = keyFromLabel(name) ?? '';
                    const unit = UNIT[key] ?? '';
                    return [`${value ?? '-'} ${unit}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {SERIES.map(({ key, label }) =>
                    data.some(d => isFiniteNum(d[key])) ? (
                      <Line
                        key={`${src}-${String(key)}`}
                        dataKey={String(key)}
                        name={label}
                        stroke={COLORS[src][String(key)] ?? '#000'}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="w-full lg:w-1/2">{renderOne('t700')}</div>
      <div className="w-full lg:w-1/2">{renderOne('t500')}</div>
    </div>
  );
}

/* helpers */
function toNum(x: any): number | null {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function isFiniteNum(x: any): boolean {
  return Number.isFinite(Number(x));
}

function labelFor(k: string) {
  switch (k) {
    case 'cod': return 'COD';
    case 'tss': return 'TSS';
    case 'pH': return 'pH';
    case 'temperature': return 'Suhu';
    default: return k;
  }
}

function safeFormatTime(v: any) {
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? format(d, 'HH:mm:ss') : '-';
}
