// app/api/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}
function qTable(name: string) {
  return isMsSql() ? `dbo.[${name}]` : `\`${name}\``;
}

//opsional, bakal dihapus kalau misal udah fix
function fmtTimestampExpr() {
  // alias kolom jadi 'formatted_timestamp'
  return isMsSql()
    // ISO 8601 sampai detik: 2025-08-26 09:15:30
    ? `CONVERT(VARCHAR(19), [timestamp], 120) AS formatted_timestamp`
    : `DATE_FORMAT(\`timestamp\`, '%Y-%m-%d %H:%i:%s') AS formatted_timestamp`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = (searchParams.get("table") || "").toLowerCase();
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!table || !start || !end || !["t700", "t500"].includes(table)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const sql = `
      SELECT
        *,
        ${fmtTimestampExpr()}
      FROM ${qTable(table)}
      WHERE ${isMsSql() ? "[timestamp]" : "`timestamp`"} BETWEEN ? AND ?
      ORDER BY ${isMsSql() ? "[timestamp]" : "`timestamp`"} ASC
    `;

    const rows = await db.query<any>(sql, [start, end]);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${table.toUpperCase()} Export`);

    if (!rows || rows.length === 0) {
      sheet.addRow(["No data found for selected range."]);
    } else {
      sheet.columns = Object.keys(rows[0]).map((key) => ({
        header: key,
        key,
      }));
      for (const row of rows) sheet.addRow(row);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename=${table} ${start} s.d ${end}.xlsx`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err) {
    console.error("[EXPORT ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
