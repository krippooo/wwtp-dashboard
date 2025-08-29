// API helper buat notification system 

import { NextRequest, NextResponse } from "next/server";
import { pool } from '@/lib/db'

// Helper untuk format tanggal
function formatDate(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function GET(req: NextRequest) {
  try {
// hitung tanggal sekarang + 7 hari
    const now = new Date();
    const next3Days = new Date();
    next3Days.setDate(now.getDate() + 7); // 3 hari ke depan
    const formattedNext3Days = next3Days.toISOString().split('T')[0]; // format YYYY-MM-DD

// Ambil tasks dengan due_date antara sekarang dan 3 hari ke depan, yang belum selesai
    const [rows] = await pool.query(
      `
      SELECT id, title, due_date, status, pic_maintenance
      FROM tasks
      WHERE due_date IS NOT NULL
        AND status != 'done'
        AND (
          due_date BETWEEN CURDATE() AND ?
          OR due_date < CURDATE()
        )
      ORDER BY due_date ASC
      `,
      [formattedNext3Days]
    );


// Format hasil query menjadi struktur yang bisa ditampilkan di notifikasi
    const notifications = (rows as any[]).map((r) => ({
      date: r.due_date,
      title: r.title,
      status: r.status,
      pic: r.pic_maintenance,
    }));

    return NextResponse.json(notifications);

    } catch (err) {
      console.error("\[UPCOMING TASKS ERROR]", err);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
