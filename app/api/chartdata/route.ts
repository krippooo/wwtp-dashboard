// app/api/last_data/route.ts
/* API: buat munculin trend 10 data terakhir di dashboard
   Usage:
   - /api/last_data?table=t700
   - /api/last_data?table=t500
   - /api/last_data?table=t700 (10 bucket terakhir)
*/
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // ← adaptor dual-DB yang kita buat sebelumnya

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = (searchParams.get("table") || "").toLowerCase();
  const bucket = (searchParams.get("bucket") || "").toLowerCase(); // "10m" optional
  const limit = 10;

  if (table !== "t700" && table !== "t500") {
    return NextResponse.json({ error: "invalid table" }, { status: 400 });
  }

  try {
    if (table === "t700") {
      const rows = isMsSql()
        ? await db.query(
            `
            SELECT TOP (?)
              [timestamp], cod, pH, tss, temperature AS temp
            FROM dbo.t700
            ORDER BY [timestamp] DESC
            `,
            [limit]
          )
        : await db.query(
            `
            SELECT timestamp, cod, pH, tss, temperature AS temp
            FROM t700
            ORDER BY timestamp DESC
            LIMIT ?
            `,
            [limit]
          );
      return NextResponse.json([...rows].reverse());
    }

    if (table === "t500") {
      const rows = isMsSql()
        ? await db.query(
            `
            SELECT TOP (?)
              [timestamp], cod, tss
            FROM dbo.t500
            ORDER BY [timestamp] DESC
            `,
            [limit]
          )
        : await db.query(
            `
            SELECT timestamp, cod, tss
            FROM t500
            ORDER BY timestamp DESC
            LIMIT ?
            `,
            [limit]
          );
      return NextResponse.json([...rows].reverse());
    }

    // fallback (harusnya gak nyampe sini)
    return NextResponse.json({ error: "unhandled" }, { status: 500 });
  } catch (e: any) {
    console.error("last_data error:", e?.message || e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
