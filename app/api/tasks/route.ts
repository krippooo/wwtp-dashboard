// API buat page tasks

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
try {
  const [rows] = await pool.query('SELECT \* FROM tasks ORDER BY due\_date IS NULL, due\_date ASC, id DESC');
  return NextResponse.json(rows);
  } catch (e:any) {
  console.error('GET /api/tasks error:', e);
  return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description = null, due_date = null, status = 'todo', pic_lapangan = null } = body || {};


    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

// Convert incoming date (YYYY-MM-DD or ISO) to MySQL DATETIME string
    let dueSql: string | null = null;
    if (due_date) {
      const d = new Date(due_date);
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'invalid due_date' }, { status: 400 });
      dueSql = d.toISOString().slice(0, 19).replace('T', ' ');
    }

// PIC hanya disimpan jika status 'done'
    const picSql = status === 'done' && typeof pic_lapangan === 'string' && pic_lapangan.trim() ? pic_lapangan.trim() : null;

    const [result] = await pool.execute(
      'INSERT INTO tasks (title, description, due_date, status, pic_lapangan) VALUES (?,?,?,?,?)',
      [title, description, dueSql, status, picSql]
    );

    const id = (result as any).insertId;
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return NextResponse.json(rows[0], { status: 201 });

    } catch (e: any) {
    console.error('POST /api/tasks error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
