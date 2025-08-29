import { NextRequest, NextResponse } from "next/server";
import { pool } from '@/lib/db'
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
try {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!table || !start || !end || !(table === "t700" || table === "t500")) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const [rows] = await pool.query(
    `SELECT *, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as formatted_timestamp FROM \`${table}\` WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC`,
  [start, end]
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${table.toUpperCase()} Export`);

  if (rows.length === 0) {
    sheet.addRow(['No data found for selected range.']);
  } else {
    sheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
    }));
    rows.forEach((row) => {
      sheet.addRow(row);
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename=${table} ${start} s.d ${end}.xlsx`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  } catch (err) {
  console.error("\[EXPORT ERROR]", err);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
