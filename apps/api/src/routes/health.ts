// GET /api/health — first thing to verify after deploying the Worker.
// Confirms the Hyperdrive binding actually reaches Neon.
import { Hono } from "hono";
import type { Env } from "../env";

const health = new Hono<Env>();

health.get("/health", async (c) => {
  let database = "unknown";
  try {
    const rows = await c.get("sql")`SELECT 1 AS ok`;
    database = rows.length ? "connected" : "empty";
  } catch (err) {
    console.error("Health check DB probe failed", err);
    database = "error";
  }

  return c.json({
    status: database === "connected" ? "ok" : "degraded",
    database,
    runtime: "cloudflare-workers",
    requestId: c.get("requestId"),
    timestamp: new Date().toISOString(),
  }, database === "connected" ? 200 : 503);
});

export default health;
