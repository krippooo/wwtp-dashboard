// API buat import excel ke tasks, ini editable depends ke nama tabel"nya \*/}

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().split('T')[0]; // YYYY-MM-DD
};

export async function POST(req: NextRequest) {
  try {
    const tasks = await req.json();
    const tasksMapped = tasks.map((t: { [x: string]: string; }) => ({
    title: t["Description"],
    pic_maintenance: t["PIC Maintenance"],
    description: t["Description of functional location"],
    date: fmtDate(t["Basic Start Date"])
    }));

    const values = tasksMapped.map(t => [
      t.title, t.pic_maintenance, t.description, t.date
    ]);

    const sql = `
      INSERT INTO tasks (title, pic_maintenance, description, due_date)
      VALUES ?
    `;
    console.log(values);
    await pool.query(sql, [values]);

    return NextResponse.json({ success: true, inserted: tasks.length });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
