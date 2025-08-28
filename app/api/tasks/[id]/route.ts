// app/api/tasks/[id]/route.ts
/* Edit/Delete section */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isMsSql() {
  return (process.env.DB_TYPE ?? 'mysql') === 'mssql';
}
function qTable(name: string) {
  return isMsSql() ? `dbo.[${name}]` : `\`${name}\``;
}
function qCol(name: string) {
  return isMsSql() ? `[${name}]` : `\`${name}\``;
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }   // ⬅️ inline type (bukan alias)
) {
  try {
    const id = Number(context.params);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

    const body = await req.json();

    const fields: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) { fields.push(`${qCol('title')} = ?`); values.push(body.title); }
    if (body.description !== undefined) { fields.push(`${qCol('description')} = ?`); values.push(body.description); }
    if (body.status !== undefined) { fields.push(`${qCol('status')} = ?`); values.push(body.status); }

    if (body.due_date !== undefined) {
      if (body.due_date === null || body.due_date === '') {
        fields.push(`${qCol('due_date')} = NULL`);
      } else {
        const d = new Date(body.due_date);
        if (isNaN(d.getTime())) return NextResponse.json({ error: 'invalid due_date' }, { status: 400 });
        const dueSql = d.toISOString().slice(0, 19).replace('T', ' ');
        fields.push(`${qCol('due_date')} = ?`);
        values.push(dueSql);
      }
    }

    // PIC logic
    if (body.status !== undefined && body.status !== 'done') {
      fields.push(`${qCol('pic_lapangan')} = NULL`);
    } else if (body.pic_lapangan !== undefined) {
      if (body.pic_lapangan === null || body.pic_lapangan === '') {
        fields.push(`${qCol('pic_lapangan')} = NULL`);
      } else {
        fields.push(`${qCol('pic_lapangan')} = ?`);
        values.push(String(body.pic_lapangan).trim());
      }
    }

    if (!fields.length) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });

    const sql = `UPDATE ${qTable('tasks')} SET ${fields.join(', ')} WHERE ${qCol('id')} = ?`;
    values.push(id);
    await db.exec(sql, values);

    const rows = await db.query<any>(`SELECT * FROM ${qTable('tasks')} WHERE ${qCol('id')} = ?`, [id]);
    return NextResponse.json(rows[0] ?? null);
  } catch (e: any) {
    console.error('PUT /api/tasks/[id] error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  cont: { params: Promise<{ id: string }> }   // ⬅️ inline type juga
) {
  try {
    const id = Number(cont.params);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

    await db.exec(`DELETE FROM ${qTable('tasks')} WHERE ${qCol('id')} = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /api/tasks/[id] error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
