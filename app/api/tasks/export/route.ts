// app/api/tasks-export/route.ts
/* API buat export log maintenance yang ada di tasks */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
function isYMD(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}
function qTable(name: string) {
  return isMsSql() ? `dbo.[${name}]` : `\`${name}\``;
}
function qCol(name: string) {
  return isMsSql() ? `[${name}]` : `\`${name}\``;
}
function orderByStatusExpr() {
  // urutan custom: todo → in_progress → blocked → done
  return isMsSql()
    ? `
      CASE ${qCol("status")}
        WHEN 'todo' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'blocked' THEN 3
        WHEN 'done' THEN 4
        ELSE 5
      END
    `
    : `FIELD(${qCol("status")}, 'todo','in_progress','blocked','done')`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start"); // YYYY-MM-DD
    const end   = searchParams.get("end");   // YYYY-MM-DD

    if (!start || !end || !isYMD(start) || !isYMD(end)) {
      return bad("Invalid parameters. Use ?start=YYYY-MM-DD&end=YYYY-MM-DD");
    }

    // Inclusive range: 00:00:00 s.d. 23:59:59
    const startTs = `${start} 00:00:00`;
    const endTs   = `${end} 23:59:59`;

    const rows = await db.query<any>(
      `
      SELECT
        ${qCol("id")},
        ${qCol("title")},
        ${qCol("description")},
        ${qCol("due_date")},
        ${qCol("status")},
        ${qCol("pic_lapangan")}
      FROM ${qTable("tasks")}
      WHERE ${qCol("due_date")} IS NOT NULL
        AND ${qCol("due_date")} BETWEEN ? AND ?
      ORDER BY
        ${orderByStatusExpr()},
        ${qCol("due_date")} ASC,
        ${qCol("id")} ASC
      `,
      [startTs, endTs]
    );

    // Build Excel
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Tasks");

    sheet.columns = [
      { header: "ID",               key: "id",               width: 8  },
      { header: "Title",            key: "title",            width: 30 },
      { header: "Description",      key: "description",      width: 40 },
      { header: "Due Date",         key: "due_date",         width: 16 },
      { header: "Status",           key: "status",           width: 16 },
      { header: "PIC Lapangan",     key: "pic_lapangan",     width: 20 },
      { header: "PIC Maintenance",  key: "pic_maintenance",  width: 20 },
    ];

    const fmtDateYMD = (d: any) => {
      if (!d) return "";
      if (typeof d === "string") return d.slice(0, 10); // "YYYY-MM-DD..."
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };

    if (!rows || rows.length === 0) {
      sheet.addRow({ title: "No data found for selected range." });
    } else {
      for (const r of rows) {
        sheet.addRow({
          id: r.id,
          title: r.title,
          description: r.description ?? "",
          due_date: fmtDateYMD(r.due_date),
          status: String(r.status ?? "").replace(/_/g, " "),
          pic_lapangan: r.pic_lapangan ?? "",
          // kolom opsional kalau ada di DB (abaikan kalau tidak ada)
          pic_maintenance: r.pic_maintenance ?? "",
        });
      }
    }

    const buffer = await wb.xlsx.writeBuffer();
    const filename = `tasks ${start} s.d ${end}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename=${filename}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[TASKS EXPORT ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
