// components/MultiLineCleanWithRangeSelect.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/component/ui/select";
import { Label } from "@/component/ui/label";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const formatLocalDatetime = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Tank = "t500" | "t700";
type Row = {
  t: string;
  cod?: number | null;
  pH?: number | null;
  Temperature?: number | null;
  tss?: number | null;
};

const METRICS: Record<Tank, Array<keyof Row>> = {
  t500: ["cod", "tss"],
  t700: ["cod", "pH", "Temperature", "tss"],
};

// Warna
const COLORS: Record<string, string> = {
  cod: '#2c6e49',
  pH: '#6610F2',
  Temperature: '#DD0426',
  tss: '#F17105',
};

// Satuan
const UNIT: Record<string, string> = {
  cod: "mg/L",
  pH: "",
  Temperature: "°C",
  tss: "mg/L",
};

// Nama tampil di legend
const LABEL: Record<string, string> = {
  cod: "COD",
  pH: "pH",
  Temperature: "Suhu",
  tss: "TSS",
};

const iso = (d: Date) => d.toISOString();

export default function MultiLineCleanWithRangeSelect() {
  const [tank, setTank] = useState<Tank>("t700");
  const [range, setRange] = useState<string>("60m");
  const [start, setStart] = useState(new Date(Date.now() - 60 * 60 * 1000));
  const [end, setEnd] = useState(new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [useCustom, setUseCustom] = useState(false); // apakah pakai custom atau preset
  const [customStart, setCustomStart] = useState(start); //activated kalau usecustom terpenuhi
  const [customEnd, setCustomEnd] = useState(end);
  
  const cols = METRICS[tank];

  // Ubah range -> hitung start/end
useEffect(() => {
  if (useCustom) {
    setStart(customStart);
    setEnd(customEnd);
    return;
  }

  const now = new Date();
  const map: Record<string, number> = {
    "30m": 30, "60m": 60,
    "6h": 360, "12h": 720, "24h": 1440,
    "3d": 4320, "7d": 10080,
  };
  const mins = map[range] ?? 60;
  setEnd(now);
  setStart(new Date(now.getTime() - mins * 60 * 1000));
}, [range, customStart, customEnd]);


  async function fetchSeries() {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

    setLoading(true);
    try {
      const q = new URLSearchParams({ table: tank, start: fmt(start), end: fmt(end) });
      const res = await fetch(`/api/chartpage?${q.toString()}`, { cache: "no-store" });
      const json = await res.json();
      setRows(Array.isArray(json.rows) ? json.rows : []);
    } catch (e) {
      console.error("fetch /api/chartpage failed", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tank, start.getTime(), end.getTime()]);

const legendItems = useMemo(
  () =>
    (cols as string[]).map((k) => {
      const name = LABEL[k] ?? k;                // harus sama dg series.name
      return {
        name,
        icon: "roundRect",
        itemStyle: { color: COLORS[k], borderColor: COLORS[k] }, // ikon legend = warna line
      };
    }),
  [cols]
);

const option = useMemo(() => {
  const unitsOnChart = new Set(cols.map((k) => UNIT[k as string] ?? ""));
  const yUnit = unitsOnChart.size === 1 ? [...unitsOnChart][0] : "";

  const series = (cols as string[]).map((k) => {
    const name = LABEL[k] ?? k;
    return {
      id: k,                         // bantu ECharts identifikasi seri
      name,                          // harus match legendItems[].name
      type: "line",
      color: COLORS[k],              // ⬅️ penting: warna seri “utama”
      showSymbol: false,
      smooth: 0.35,
      sampling: "lttb",
      connectNulls: false,
      lineStyle: { width: 2 },       // warna diambil dari `color` di atas
      emphasis: { focus: "series" },
      data: rows.map((r) => [r.t, (r as any)[k] ?? null]),
    };
  });

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { top: 28, right: 14, bottom: 28, left: 48 },

    xAxis: {
      type: "time",
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#64748b" },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#64748b",
      },
      splitLine: { show: true, lineStyle: { type: "dashed", color: "rgba(100,116,139,.2)" } },
    },

    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", lineStyle: { color: "rgba(148,163,184,.6)", width: 1 } },
      backgroundColor: "rgba(15,23,42,.92)",
      borderWidth: 0,
      padding: 8,
      textStyle: { color: "#f8fafc" },
      formatter: (params: any) => {
        if (!Array.isArray(params)) return "";
        const ts = params[0]?.axisValueLabel ?? "";
        const lines = params
          .filter((p) => p?.data?.[1] != null)
          .map((p) => {
            const name: string = p.seriesName;
            const key = Object.keys(LABEL).find((k) => LABEL[k] === name) || name;
            const unit = UNIT[key] ?? "";
            const val = Number(p.data[1]).toFixed(2);
            return `${p.marker} ${name} : ${val}${unit ? " " + unit : ""}`;
          });
        return [`<div style="margin-bottom:4px;">${ts}</div>`, ...lines].join("<br/>");
      },
    },

    legend: {
      top: 0,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      icon: "roundRect",
      textStyle: { color: "#334155" },
      inactiveColor: "rgba(148,163,184,.6)",
      data: legendItems,   // ⬅️ ikon legend pakai warna seri
    },

    dataZoom: [{ type: "inside", throttle: 50 }],
    series,
  } as echarts.EChartsCoreOption;
}, [cols, rows, legendItems]);


  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-end gap-2 md:gap-3">
        {/* Tank selector */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="tank" className="text-[11px] md:text-xs font-medium text-black opacity-70">Opsi Tank</Label> 
          <Select value={tank} onValueChange={(v) => setTank(v as Tank)}>
            <SelectTrigger className="w-24 h-9 px-2 text-xs bg-foreground text-white">
              <SelectValue placeholder="Tank" />
           </SelectTrigger>
           <SelectContent>
              <SelectItem value="t500">T-500</SelectItem>
              <SelectItem value="t700">T-700</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dropdown range waktu */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="range" className="text-[11px] md:text-xs font-medium text-black opacity-70">Rentang Waktu</Label>
          <Select value={useCustom ? "custom" : range} onValueChange={(v) => {
            if(v==='custom') {
              setUseCustom(true);
              setStart(customStart);
              setEnd(customEnd);
              fetchSeries();
            } else{
              setUseCustom(false);
              setRange(v)
            }
          }}>
            <SelectTrigger id ='Range' className="w-24 h-9 px-2 text-xs bg-foreground text-white">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30m">Last 30m</SelectItem>
              <SelectItem value="60m">Last 1h</SelectItem>
              <SelectItem value="6h">Last 6h</SelectItem>
              <SelectItem value="12h">Last 12h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="3d">Last 3 day</SelectItem>
              <SelectItem value="7d">Last 7 day</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          </div>

        {useCustom && (
          <div className="order-3 basis-full sm:order-none sm:basis-auto grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="start" className="text-[11px] md:text-xs font-medium text-black opacity-70">Start Time</Label>
            <input
              id = 'start' type="datetime-local"
              value={formatLocalDatetime(customStart)}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setCustomStart(d);
              }}
              className="border border-background rounded text-black px-2 py-1 text-xs w-full sm:w-[180px]"
            />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="end" className="text-[11px] md:text-xs font-medium text-black opacity-70">End Time</Label>
            <input
              id = 'end' type="datetime-local"
              value={formatLocalDatetime(customEnd)}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!isNaN(d.getTime())) setCustomEnd(d);
              }}
              className="border border-background rounded text-black px-2 py-1 text-xs w-full sm:w-[180px]"
            />
          </div>
          </div>
        )}

        <button
          onClick={fetchSeries}
          className="bg-green-600 hover:bg-green-800 order-2 sm:order-none ml-auto px-3 py-2 h-9 rounded-lg text-xs md:text-sm  text-white"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="h-[340px] border-2 border-background rounded-xl">
        <ReactECharts option={option} style={{ width: "100%", height: "100%" }} 
          key={`ts-${tank}-${legendItems.map(i => i.name).join(",")}`}
          notMerge={true}
        />
      </div>
  </div>
  );
}
