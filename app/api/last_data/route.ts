// app/api/last_data/route.ts
/* Ini buat minibar minibar gitu */
export const revalidate = 50; // (ganti sesuai kebutuhan)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}
function qTable(name: string) {
  return isMsSql() ? `dbo.[${name}]` : `\`${name}\``;
}
function qTs() {
  return isMsSql() ? `[timestamp]` : `\`timestamp\``;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get("table");
    const agoHours = Number(searchParams.get("agoHours") ?? 12);

    if (!table) {
      return NextResponse.json({ error: "table required" }, { status: 400 });
    }

    if (isMsSql()) {
      // ------- MSSQL -------
      const curr = await db.query<any>(
        `
        SELECT TOP (1) *
        FROM ${qTable(table)}
        ORDER BY ${qTs()} DESC
        `
      );

      const past = await db.query<any>(
        `
        SELECT TOP (1) *
        FROM ${qTable(table)}
        WHERE ${qTs()} <= DATEADD(hour, -?, SYSDATETIME())
        ORDER BY ${qTs()} DESC
        `,
        [agoHours]
      );

      return NextResponse.json(
        { current: curr[0] ?? null, past: past[0] ?? null, agoHours },
        {
          headers: {
            "Cache-Control":
              "public, max-age=0, s-maxage=120, stale-while-revalidate=30",
          },
        }
      );
    } else {
      // ------- MySQL -------
      const curr = await db.query<any>(
        `
        SELECT * FROM ${qTable(table)}
        ORDER BY ${qTs()} DESC
        LIMIT 1
        `
      );

      const past = await db.query<any>(
        `
        SELECT * FROM ${qTable(table)}
        WHERE ${qTs()} <= (NOW() - INTERVAL ? HOUR)
        ORDER BY ${qTs()} DESC
        LIMIT 1
        `,
        [agoHours]
      );

      return NextResponse.json(
        { current: curr[0] ?? null, past: past[0] ?? null, agoHours },
        {
          headers: {
            "Cache-Control":
              "public, max-age=0, s-maxage=120, stale-while-revalidate=30",
          },
        }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
