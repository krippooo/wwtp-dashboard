// app/api/notifications/route.ts
/* API helper buat notification system */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function isMsSql() {
  return (process.env.DB_TYPE ?? "mysql") === "mssql";
}
function qTable(name: string) {
  return isMsSql() ? `dbo.[${name}]` : `\`${name}\``;
}
function qCol(name: string) {
  return isMsSql() ? `[${name}]` : `\`${name}\``;
}

export async function GET(_req: NextRequest) {
  try {
    // sekarang + 7 hari (sesuai kode asli)
    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    const endDateYMD = next7Days.toISOString().split("T")[0]; // YYYY-MM-DD

    let rows: any[];

    if (isMsSql()) {
      // MSSQL: tanggal hari ini → CAST(GETDATE() AS DATE)
      rows = await db.query<any>(
        `
        SELECT ${qCol("id")}, ${qCol("title")}, ${qCol("due_date")},
               ${qCol("status")}, ${qCol("pic_maintenance")}
        FROM ${qTable("tasks")}
        WHERE ${qCol("due_date")} IS NOT NULL
          AND ${qCol("due_date")} BETWEEN CAST(GETDATE() AS DATE) AND ?
          AND ${qCol("status")} <> 'done'
        ORDER BY ${qCol("due_date")} ASC
        `,
        [endDateYMD]
      );
    } else {
      // MySQL: tanggal hari ini → CURDATE()
      rows = await db.query<any>(
        `
        SELECT ${qCol("id")}, ${qCol("title")}, ${qCol("due_date")},
               ${qCol("status")}, ${qCol("pic_maintenance")}
        FROM ${qTable("tasks")}
        WHERE ${qCol("due_date")} IS NOT NULL
          AND ${qCol("due_date")} BETWEEN CURDATE() AND ?
          AND ${qCol("status")} <> 'done'
        ORDER BY ${qCol("due_date")} ASC
        `,
        [endDateYMD]
      );
    }

    const notifications = rows.map((r) => ({
      date: r.due_date,
      title: r.title,
      status: r.status,
      pic: r.pic_maintenance,
    }));

    return NextResponse.json(notifications);
  } catch (err) {
    console.error("[UPCOMING TASKS ERROR]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
