// Edit/Delete section

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

type Params = { params: { id: string } };

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
    if (body.due_date !== undefined) {
      if (body.due_date === null || body.due_date === '') { fields.push('due_date = NULL'); }
      else {
        const d = new Date(body.due_date);
        if (isNaN(d.getTime())) return NextResponse.json({ error: 'invalid due_date' }, { status: 400 });
        fields.push('due_date = ?');
        values.push(d.toISOString().slice(0,19).replace('T',' '));
      }
    }

// PIC logic: jika status diubah ke selain 'done', kosongkan PIC
    if (body.status !== undefined && body.status !== 'done') {
      fields.push('pic_lapangan = NULL');
    } else if (body.pic_lapangan !== undefined) {
      if (body.pic_lapangan === null || body.pic_lapangan === '') { fields.push('pic_lapangan = NULL'); }
      else { fields.push('pic_lapangan = ?'); values.push(String(body.pic_lapangan).trim()); }
    }

    if (!fields.length) 
      return NextResponse.json({ error: 'no fields to update' }, { status: 400 });

    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    await pool.execute(sql, values);

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return NextResponse.json(rows[0] ?? null);

    } catch (e: any) {
    console.error('PUT /api/tasks/[id] error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
    } catch (e: any) {
    console.error('DELETE /api/tasks/[id] error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}
