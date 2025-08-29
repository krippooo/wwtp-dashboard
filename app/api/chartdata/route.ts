{/*Ini api buat munculin trend 10 data terakhir di dashboard*/}

import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");

{/*ini bisa ga ya biar dia kek order by timestamp tp every 10 minutes gitu (tapi ini ga penting" amat sih cm kek what if) */}
if (table === "t700") {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT timestamp, cod, pH, tss, temperature AS temp FROM t700 ORDER BY timestamp DESC LIMIT 10`
  );
  return NextResponse.json(rows.reverse());
}

if (table === "t500") {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT timestamp, cod, tss FROM t500 ORDER BY timestamp DESC LIMIT 10`
  );
  return NextResponse.json(rows.reverse());
}
}
