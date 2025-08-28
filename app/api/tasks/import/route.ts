// app/api/tasks/import/route.ts
/* API buat import excel ke tasks, editable tergantung nama kolom excel */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}

// YYYY-MM-DD (null kalau invalid)
const fmtDate = (d: any): string | null => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt.toISOString().split("T")[0];
};

export async function POST(req: NextRequest) {
  try {
    const tasks = await req.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "body must be a non-empty array" }, { status: 400 });
    }

    // Map kolom sesuai header Excel kamu
    // Ubah key kalau header excel beda especially yang "PIC Maintenance"
    const mapped = tasks.map((t: Record<string, any>) => ({
      title: String(t["Description"] ?? "").trim(),
      pic_maintenance: (t["PIC Maintenance"] ?? "")?.toString().trim() || null,
      description: (t["Description of functional location"] ?? "")?.toString().trim() || null,
      due_date: fmtDate(t["Basic Start Date"]),
    }));

    // filter baris kosong (tanpa title)
    const cleaned = mapped.filter(r => r.title.length > 0);

    if (cleaned.length === 0) {
      return NextResponse.json({ error: "no valid rows (missing titles)" }, { status: 400 });
    }

    let inserted = 0;

    if (isMsSql()) {
      // ---------- MSSQL: bulk via SELECT ... UNION ALL SELECT ----------
      // Build query seperti:
      // INSERT INTO dbo.tasks ([title],[pic_maintenance],[description],[due_date])
      // SELECT ?, ?, ?, ?
      // UNION ALL SELECT ?, ?, ?, ?
      // ...
      const rows = cleaned;
      const parts: string[] = [];
      const params: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        parts.push(i === 0 ? "SELECT ?, ?, ?, ?" : "UNION ALL SELECT ?, ?, ?, ?");
        const r = rows[i];
        params.push(r.title, r.pic_maintenance, r.description, r.due_date);
      }

      const sqlText = `
        INSERT INTO dbo.[tasks] ([title], [pic_maintenance], [description], [due_date])
        ${parts.join("\n")}
      `;
      await db.exec(sqlText, params);
      inserted = rows.length;
    } else {
      // ---------- MySQL: bulk VALUES ? ----------
      // MySQL menerima bentuk: VALUES [[a,b,c,d],[...],...]
      const values = cleaned.map((r) => [r.title, r.pic_maintenance, r.description, r.due_date]);
      const sql = `
        INSERT INTO \`tasks\` (\`title\`, \`pic_maintenance\`, \`description\`, \`due_date\`)
        VALUES ?
      `;
      await db.query(sql, [values]);
      inserted = cleaned.length;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (e: any) {
    console.error("POST /api/tasks/import error:", e?.message || e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
