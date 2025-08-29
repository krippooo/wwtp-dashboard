//ini route untuk page data/chart

export const revalidate = 90; // cache TTL 90 detik

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const TABLES = {
t500: ["cod", "tss"],
t700: ["cod", "pH", "Temperature", "tss"],
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = (searchParams.get("table") || "").toLowerCase();
    const start = searchParams.get("start");
    const end = searchParams.get("end");


  // validasi
  if (!TABLES[table as keyof typeof TABLES]) {
    return NextResponse.json({ error: "invalid table" }, { status: 400 });
  }
  if (!start || !end) {
    return NextResponse.json({ error: "start & end required (ISO)" }, { status: 400 });
  }

  const cols = TABLES[table as keyof typeof TABLES];
  const startDt = new Date(start);
  const endDt = new Date(end);

  // hitung bucket untuk limit titik chart
  const rangeSec = Math.max(1, (endDt.getTime() - startDt.getTime()) / 1000);
  const maxPoints = 300;
  const bucketSec = Math.max(1, Math.ceil(rangeSec / maxPoints));

  // SELECT AVG untuk tiap kolom
  const avgCols = cols.map(c => `AVG(${c}) AS ${c}`).join(", ");

  const sql = `
    SELECT 
      FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(timestamp) / ?) * ?) AS t,
      ${avgCols}
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    GROUP BY t
    ORDER BY t ASC
  `;

  const [rows]: any = await pool.query(sql, [bucketSec, bucketSec, startDt, endDt]);

  return NextResponse.json({ table, cols, bucketSec, rows });
  } catch (e) {
  console.error("GET /api/chartpage error:", e);
  return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
