// prism-api Worker. Replaces the Supabase `api`, `queue-worker`, and `query-fan-out` functions.
// Same Hono app contract as before, so the frontend keeps calling /api/* unchanged.
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Env } from "./env";
import { withDb } from "./db";
import { handleQueueBatch } from "./queue";
import { baseMiddleware } from "./middleware";
import health from "./routes/health";

const app = new Hono<Env>();

app.use("*", async (c, next) =>
  cors({
    origin: (c.env.API_CORS_ORIGIN ?? "*").split(",").map((s) => s.trim()).filter(Boolean),
    allowHeaders: [
      "authorization", "x-user-email", "x-admin-key", "content-type", "apikey",
      "x-request-id", "x-prism-timestamp", "x-prism-signature",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })(c, next),
);

app.use("*", baseMiddleware);
app.use("*", withDb);

// Ported. Mount order matches the Supabase version so paths do not shift.
app.route("/api", health);

// TODO port, in dependency order. Each route file moves `sql` to `c.get("sql")`
// and reads secrets from `c.env` instead of importing config constants.
// app.route("/api/auth", auth);          // -> Better Auth handler, see auth.ts
// app.route("/api/blog", blog);
// app.route("/api/leads", leads);
// app.route("/api/me", me);
// app.route("/api/advertiser", advertiser);
// app.route("/api/wallet", wallet);
// app.route("/api/publisher", publisher);
// app.route("/api/payouts", payouts);
// app.route("/api/admin", admin);
// app.route("/api/demo", demo);
// app.route("/api/chat", chat);
// app.route("/api/webhooks", webhooks);
// app.route("/api", sdk);                // /api/ads + /api/track/:eventType
// app.route("/api/signals", signals);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("Unhandled error", { requestId: c.get("requestId"), err });
  return c.json({ error: "Internal error" }, 500);
});

export default {
  fetch: app.fetch,
  queue: handleQueueBatch,
} satisfies ExportedHandler<Bindings>;
