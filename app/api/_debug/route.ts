import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [[env]]: any = await db.query("SELECT DATABASE() AS db, USER() AS user, @@hostname AS host, @@port AS port, @@version AS version");
    const [[cnt]]: any = await db.query("SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'tasks'");
    const [[rows]]: any = await db.query("SELECT COUNT(*) AS n FROM tasks").catch(() => [{ n: null }]);
    return NextResponse.json({ env, has_tasks_table: !!cnt?.count, task_rows: rows?.n ?? null });
  } catch (e:any) {
    console.error('GET /api/_debug/db error:', e);
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 });
  }
}