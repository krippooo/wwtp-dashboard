// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isMsSql() {
  return (process.env.DB_TYPE ?? 'mysql') === 'mssql';
}

export async function GET() {
  try {
    if (isMsSql()) {
      // MSSQL: boolean expr → CASE
      const rows = await db.query<any>(
        `
        SELECT *
        FROM dbo.tasks
        ORDER BY 
          CASE WHEN [due_date] IS NULL THEN 1 ELSE 0 END, 
          [due_date] ASC, 
          [id] DESC
        `
      );
      return NextResponse.json(rows);
    } else {
      // MySQL
      const rows = await db.query<any>(
        `SELECT * FROM \`tasks\` ORDER BY due_date IS NULL, due_date ASC, id DESC`
      );
      return NextResponse.json(rows);
    }
  } catch (e: any) {
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

    // Normalisasi tanggal → string 'YYYY-MM-DD HH:mm:ss' (aman utk MySQL; MSSQL terima ISO/Date juga)
    let dueSql: string | null = null;
    if (due_date) {
      const d = new Date(due_date);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'invalid due_date' }, { status: 400 });
      }
      dueSql = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    // PIC hanya disimpan jika status 'done'
    const picSql =
      status === 'done' && typeof pic_lapangan === 'string' && pic_lapangan.trim()
        ? pic_lapangan.trim()
        : null;

    let id: number;

    if (isMsSql()) {
      // MSSQL: gunakan OUTPUT INSERTED.id untuk dapatkan IDENTITY
      const inserted = await db.query<{ id: number }>(
        `
        INSERT INTO dbo.tasks ([title], [description], [due_date], [status], [pic_lapangan])
        OUTPUT INSERTED.id
        VALUES (?, ?, ?, ?, ?)
        `,
        [title, description, dueSql, status, picSql]
      );
      id = inserted[0]?.id as number;
    } else {
      // MySQL: insertId dari OkPacket
      const res = await db.query<any>(
        `INSERT INTO \`tasks\` (\`title\`, \`description\`, \`due_date\`, \`status\`, \`pic_lapangan\`)
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, dueSql, status, picSql]
      );
      id = (res as any).insertId;
    }

    // Ambil row yang baru dibuat
    const row = await db.query<any>(
      isMsSql()
        ? `SELECT * FROM dbo.tasks WHERE [id] = ?`
        : `SELECT * FROM \`tasks\` WHERE \`id\` = ?`,
      [id]
    );

    return NextResponse.json(row[0], { status: 201 });
  } catch (e: any) {
    console.error('POST /api/tasks error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
