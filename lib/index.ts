// lib/index.ts
import { db } from "@/lib/db";

async function main() {
  try {
    const result = await db.query("SELECT 1 as test");
    console.log("DB Connected", result);
  } catch (err) {
    console.error("DB Connection Failed", err);
  }
}

main();
