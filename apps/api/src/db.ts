// Postgres over Hyperdrive. The single most important difference from the Deno version:
// a Worker cannot hold one module-global client, because outbound sockets are scoped to a
// single request context. Every invocation gets its own handle, closed via waitUntil.
import postgres from "postgres";
import type { MiddlewareHandler } from "hono";
import type { Bindings, Env } from "./env";

export type Sql = ReturnType<typeof postgres>;

// fetch_types: false saves a round trip per connection; Hyperdrive already pools upstream.
// prepare: false is kept from the Supabase pooler config and stays correct here.
const OPTIONS = {
  max: 5,
  fetch_types: false,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 15,
} as const;

export const createSql = (env: Bindings): Sql =>
  postgres(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL ?? "", OPTIONS);

// Attaches a request-scoped `sql` to the Hono context. Mount before any route that queries.
// Routes migrate from `sql`...`` to `c.get("sql")`...``.
export const withDb: MiddlewareHandler<Env> = async (c, next) => {
  const sql = createSql(c.env);
  c.set("sql", sql);
  try {
    await next();
  } finally {
    // Do not await: let the response return, then drain the socket.
    c.executionCtx.waitUntil(sql.end({ timeout: 5 }));
  }
};

// For the queue consumer and scheduled handlers, which have no Hono context.
export const withSql = async <T>(
  env: Bindings,
  ctx: ExecutionContext,
  run: (sql: Sql) => Promise<T>,
): Promise<T> => {
  const sql = createSql(env);
  try {
    return await run(sql);
  } finally {
    ctx.waitUntil(sql.end({ timeout: 5 }));
  }
};
