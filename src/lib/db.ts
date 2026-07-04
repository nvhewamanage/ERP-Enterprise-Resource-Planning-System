import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

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

/**
 * Runs `fn` inside a single BEGIN/COMMIT transaction, all on the same
 * connection. `fn` receives a `queryInTx` helper (same signature as `query`)
 * bound to that connection — use it for every statement inside the callback
 * so they all participate in the same transaction. Rolls back on any error.
 *
 * Example (see purchase-order.service.ts for a real one):
 *   await withTransaction(async (q) => {
 *     await q("UPDATE products SET quantity_on_hand = quantity_on_hand + $1 WHERE id = $2", [qty, id]);
 *     await q("INSERT INTO ledger_entries (...) VALUES (...)", [...]);
 *   });
 */
export async function withTransaction<T>(
  fn: (
    queryInTx: <R extends QueryResultRow = QueryResultRow>(
      text: string,
      params?: unknown[]
    ) => Promise<QueryResult<R>>,
    client: PoolClient
  ) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  const queryInTx = <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
    client.query<R>(text, params as never[]);

  try {
    await client.query("BEGIN");
    const result = await fn(queryInTx, client);
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
