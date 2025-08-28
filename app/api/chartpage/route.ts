// app/api/chartpage/route.ts
export const revalidate = 90; // cache TTL 90 detik

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TABLES = {
  t500: ["cod", "tss"],
  t700: ["cod", "pH", "Temperature", "tss"],
} as const;

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}

// helper quoting identifier per dialek (kolom/alias di SELECT tetap seperti input)
function qCol(col: string) {
  return isMsSql() ? `[${col}]` : `\`${col}\``;
}
function qTable(table: string) {
  return isMsSql() ? `dbo.[${table}]` : `\`${table}\``;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = (searchParams.get("table") || "").toLowerCase();
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!(table in TABLES)) {
      return NextResponse.json({ error: "invalid table" }, { status: 400 });
    }
    if (!start || !end) {
      return NextResponse.json({ error: "start & end required (ISO)" }, { status: 400 });
    }

    const cols = TABLES[table as keyof typeof TABLES];
    const startDt = new Date(start);
    const endDt = new Date(end);

    // batas titik chart
    const rangeSec = Math.max(1, (endDt.getTime() - startDt.getTime()) / 1000);
    const maxPoints = 300;
    const bucketSec = Math.max(1, Math.ceil(rangeSec / maxPoints));

    // AVG untuk tiap kolom, alias pakai nama asli (biar frontend tetap cocok)
    const avgCols = cols.map((c) => `AVG(${qCol(c)}) AS ${isMsSql() ? `[${c}]` : `\`${c}\``}`).join(", ");

    let sqlText: string;
    let params: any[];

    if (isMsSql()) {
      // MSSQL: bucket pakai epoch 1970-01-01, grup & order ASC
      // NOTE: pakai '?' karena adaptor db akan translate ke @p0, @p1, ...
      sqlText = `
        SELECT
          DATEADD(second, (DATEDIFF(second, '1970-01-01', [timestamp]) / ?) * ?, '1970-01-01') AS t,
          ${avgCols}
        FROM ${qTable(table)}
        WHERE [timestamp] BETWEEN ? AND ?
        GROUP BY DATEADD(second, (DATEDIFF(second, '1970-01-01', [timestamp]) / ?) * ?, '1970-01-01')
        ORDER BY t ASC
      `;
      params = [bucketSec, bucketSec, startDt, endDt, bucketSec, bucketSec];
    } else {
      // MySQL: bucket pakai UNIX_TIMESTAMP
      sqlText = `
        SELECT
          FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(\`timestamp\`)/?)*?) AS t,
          ${avgCols}
        FROM ${qTable(table)}
        WHERE \`timestamp\` BETWEEN ? AND ?
        GROUP BY t
        ORDER BY t ASC
      `;
      params = [bucketSec, bucketSec, startDt, endDt];
    }

    const rows = await db.query<any>(sqlText, params);

    return NextResponse.json({ table, cols, bucketSec, rows });
  } catch (e) {
    console.error("GET /api/chartpage error:", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
