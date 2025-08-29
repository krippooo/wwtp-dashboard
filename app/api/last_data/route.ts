// app/api/last\_data/route.ts
// Ini buat minibar minibar gitu
export const revalidate = 50; // (ganti sesuai kebutuhan)

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const agoHours = Number(searchParams.get("agoHours") ?? 12);
  if (!table) return NextResponse.json({ error: "table required" }, { status: 400 });

  const [currRows]: any = await pool.query(
    `SELECT * FROM \`${table}\` ORDER BY timestamp DESC LIMIT 1`
  );
  const [pastRows]: any = await pool.query(
    `SELECT * FROM \`${table}\`
     WHERE timestamp <= (NOW() - INTERVAL 24 HOUR)
     ORDER BY timestamp DESC LIMIT 1`,
    [agoHours]
  );

  // optional: kontrol header manual (bagus untuk Vercel/CDN)
  return NextResponse.json(
    { current: currRows[0] ?? null, past: pastRows[0] ?? null, agoHours },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=30" } }
  );

  } catch (e) {
  console.error(e);
  return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
