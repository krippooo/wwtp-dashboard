// lib/db.ts
import mysql from "mysql2/promise";
import sql from "mssql";

export interface DB {
  query<T = any>(q: string, params?: any[]): Promise<T[]>;
  exec(q: string, params?: any[]): Promise<void>;
}

const DB_TYPE = process.env.DB_TYPE ?? "mysql";

// -- cache pools in dev to avoid too many connections on HMR
const g = globalThis as any;

// ---------- MySQL POOL ----------
async function getMySqlPool() {
  if (!g.__MYSQL_POOL__) {
    g.__MYSQL_POOL__ = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT ?? 3306),
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return g.__MYSQL_POOL__ as mysql.Pool;
}

// ---------- MSSQL POOL ----------
let mssqlPoolPromise: Promise<sql.ConnectionPool> | null = null;

async function getMsSqlPool() {
  if (!mssqlPoolPromise) {
    const pool = new sql.ConnectionPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      server: process.env.DB_HOST!,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT ?? 1433),
      options: {
        encrypt: false,              // true untuk Azure
        trustServerCertificate: true // true untuk lokal
      },
    });
    mssqlPoolPromise = pool.connect();
    // cache di global untuk dev hot-reload:
    (globalThis as any).__MSSQL_POOL_PROMISE__ = mssqlPoolPromise;
  }
  return mssqlPoolPromise!;
}

// ---------- Utils: param mapping for MSSQL ----------
/**
 * Convert "SELECT ... WHERE a=? AND b IN (?)"
 * to "SELECT ... WHERE a=@p0 AND b IN (@p1,@p2,...)"
 * and flatten params (including array for IN (?)).
 */
function prepareMsQuery(q: string, params: any[] = []) {
  let paramIndex = 0;
  const namedParams: { name: string; value: any }[] = [];
  const chunks = q.split("?");

  let text = chunks[0];
  for (let i = 1; i < chunks.length; i++) {
    const val = params[paramIndex++];
    if (Array.isArray(val)) {
      const names = val.map((v, j) => {
        const name = `p${namedParams.length}`;
        namedParams.push({ name, value: v });
        return `@${name}`;
      });
      text += names.join(",") + chunks[i];
    } else {
      const name = `p${namedParams.length}`;
      namedParams.push({ name, value: val });
      text += `@${name}` + chunks[i];
    }
  }
  return { text, namedParams };
}

// Best-effort MSSQL type inference (good enough for most cases)
function inferMsType(value: any) {
  if (value === null || value === undefined) return sql.NVarChar; // will pass null
  switch (typeof value) {
    case "number":
      // integer vs float
      return Number.isInteger(value) ? sql.Int : sql.Float;
    case "boolean":
      return sql.Bit;
    case "object":
      if (value instanceof Date) return sql.DateTime2;
      if (Buffer.isBuffer(value)) return sql.VarBinary(sql.MAX);
      // JSON object/array → store as NVARCHAR(MAX)
      return sql.NVarChar(sql.MAX);
    default:
      // string
      // (if very long, we still let mssql handle it; could switch to MAX by length)
      return sql.NVarChar(sql.MAX);
  }
}

// ---------- Public DB API ----------
export const db: DB = {
  async query<T = any>(q: string, params: any[] = []): Promise<T[]> {
    if (DB_TYPE === "mysql") {
      const pool = await getMySqlPool();
      const [rows] = await pool.query(q, params);
      return rows as T[];
    } else if (DB_TYPE === "mssql") {
      const pool = await getMsSqlPool();
      const { text, namedParams } = prepareMsQuery(q, params);
      const req = pool.request();
      for (const p of namedParams) {
        const t = inferMsType(p.value);
        req.input(p.name, t, p.value ?? null);
      }
      const res = await req.query(text);
      return res.recordset as T[];
    } else {
      throw new Error("Unsupported DB_TYPE");
    }
  },

  async exec(q: string, params: any[] = []): Promise<void> {
    // same as query() but ignore returned rows
    if (DB_TYPE === "mysql") {
      const pool = await getMySqlPool();
      await pool.query(q, params);
      return;
    } else if (DB_TYPE === "mssql") {
      const pool = await getMsSqlPool();
      const { text, namedParams } = prepareMsQuery(q, params);
      const req = pool.request();
      for (const p of namedParams) {
        const t = inferMsType(p.value);
        req.input(p.name, t, p.value ?? null);
      }
      await req.query(text);
      return;
    } else {
      throw new Error("Unsupported DB_TYPE");
    }
  },
};
