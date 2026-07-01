import { Pool, type QueryResult, type QueryResultRow } from "pg";

// Single shared connection pool for the whole app.
// Every module's service/repository layer imports `query` from here —
// nobody talks to Postgres directly except through this file.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params as never[]);
  if (process.env.NODE_ENV === "development") {
    console.log("executed query", { text, duration: Date.now() - start, rows: result.rowCount });
  }
  return result;
}

// For multi-statement transactions (e.g. payroll runs touching several tables)
export async function withTransaction<T>(
  fn: (client: Pool) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client as unknown as Pool);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
