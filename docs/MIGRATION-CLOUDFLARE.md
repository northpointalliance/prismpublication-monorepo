# Supabase and Vercel to Cloudflare

Runbook for moving prismpublication.com off Supabase and Vercel entirely. Decisions already made:
Neon Postgres behind Hyperdrive, Better Auth on Workers, the existing React app at the apex domain.

## Target architecture

| Concern | Was | Now |
|---|---|---|
| Marketing site + portals | Vite SPA on Vercel | Cloudflare Pages, apex `prismpublication.com` |
| REST API, ~40 endpoints | Supabase Edge Functions (Deno) | Worker `prism-api`, `api.prismpublication.com` |
| Postgres, 14 tables | Supabase Postgres 17 | Neon Postgres via Hyperdrive |
| Auth | Supabase Auth | Better Auth, tables in Neon |
| Async jobs | pgmq + pg_cron + `queue-worker` | Cloudflare Queues consumer |
| Images | Supabase Storage buckets | R2 `prism-blog-images`, `prism-ad-images` |
| Payments | PayPal REST, creds in `platform_settings` | unchanged |

`pgmq` and `pg_cron` do not exist on Neon and are not needed. Queues pushes batches to the
consumer, so nothing polls on a timer and the `drain-queues` cron job retires.

## Order of work

Phases 1 to 4 change nothing user-facing. The live Supabase stack keeps serving traffic until
phase 6. Do not touch DNS before phase 5 verifies green.

### Phase 1. Provision Cloudflare resources

```bash
# Hyperdrive in front of Neon. Use the Neon pooled connection string.
wrangler hyperdrive create prism-neon \
  --connection-string="postgresql://USER:PASS@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
# Copy the returned id into apps/api/wrangler.jsonc

wrangler r2 bucket create prism-blog-images
wrangler r2 bucket create prism-ad-images

wrangler queues create prism-webhook-processing
wrangler queues create prism-payout-processing
wrangler queues create prism-webhook-dlq
wrangler queues create prism-payout-dlq
```

### Phase 2. Move the schema and data to Neon

Dump from the **direct** Supabase connection on port 5432, not the 6543 transaction pooler.
Restrict to `public` so the dump does not carry `pgmq`, `cron`, or `auth` objects.

```bash
pg_dump "postgresql://postgres.botnabfogcjrkpmdjgpr:PASS@aws-1-eu-west-2.pooler.supabase.com:5432/postgres" \
  --schema=public --no-owner --no-privileges --no-publications --no-subscriptions \
  -Fc -f prism.dump

pg_restore --no-owner --no-privileges -d "postgresql://...neon.tech/neondb?sslmode=require" prism.dump
```

Then re-apply `supabase/rls.sql` against Neon. The original threat model was an anon key reachable
from the browser; Neon has no such key, so deny-all RLS is now defense in depth rather than the
only thing standing between the public internet and the tables. Keep it anyway.

Verify row counts table by table before continuing. `ads`, `ad_events`, and `wallet_transactions`
are the ones that matter for money.

### Phase 3. Port the API, 23 files

The runtime port is trivial: 7 Deno calls total (`Deno.env.get` in `config.ts`, `paypal.ts`,
`email.ts`, `signals.ts`, `query-fan-out`, plus `Deno.serve` in two entry files). Hono 4.6.14 is
already Workers native and needs no changes.

The real work is the database handle. There are **119 `sql` call sites across 23 files**. A Worker
cannot hold one module-global client because outbound sockets are scoped to a single request
context. The recipe per file:

1. Delete `import { sql } from "../_shared/db.ts"`.
2. Inside a route handler, use `c.get("sql")` (set by `withDb`).
3. For shared helpers (`ads.ts`, `audit.ts`, `money.ts`, `bot-metrics.ts`, `payout-processor.ts`,
   `webhook-handlers.ts`, `portal.ts`, `sdk-auth.ts`, `paypal.ts`), add `sql: Sql` as the first
   parameter and pass it down from the caller.
4. Replace config constant imports with `c.env.ADMIN_API_KEY`, `c.env.PRISM_API_KEY`, and so on.
5. Drop `.ts` from relative imports.

Highest-volume files, in the order worth doing them: `admin.ts` (39 sites), `publisher.ts` (20),
`payouts.ts` (9), `advertiser.ts` (9), `webhook-handlers.ts` (5), `wallet.ts` (4),
`payout-processor.ts` (4). Everything else is 3 or fewer.

`storage.ts` swaps the Supabase Storage client for the R2 bindings in `src/storage.ts`.
`queue.ts` swaps `pgmq.send` for `env.WEBHOOK_QUEUE.send`.

### Phase 4. Better Auth

```bash
cd apps/api
npx @better-auth/cli@latest generate --config src/auth.ts
npx @better-auth/cli@latest migrate --config src/auth.ts
```

That creates `user`, `session`, `account`, and `verification` in Neon. Existing accounts live in
Supabase `auth.users`, whose `encrypted_password` column holds bcrypt hashes. Two options:

- **Import the hashes.** Better Auth accepts a custom `password.verify`, so you can accept bcrypt
  on first login and rehash to the default afterwards. Nobody is locked out.
- **Force a reset.** Simpler, but requires working outbound email on day one and will lose users
  who never complete it.

Prefer the import. Either way the frontend `supabase.auth.*` calls in `src/lib/` are replaced by
the Better Auth client, and `x-user-email` disappears from the API contract because the session
carries identity.

### Phase 5. Deploy and verify, no DNS change yet

```bash
cd apps/api
wrangler secret put BETTER_AUTH_SECRET   # openssl rand -hex 32
wrangler secret put ADMIN_API_KEY        # rotate, do not reuse
wrangler secret put PRISM_API_KEY        # rotate, do not reuse
wrangler secret put RESEND_API_KEY
wrangler deploy

curl https://prism-api.<subdomain>.workers.dev/api/health   # expect database: connected
```

Copy Storage objects into R2 with rclone or a one-off script, then diff object counts.

Point a Pages preview at `VITE_API_BASE_URL=https://prism-api.<subdomain>.workers.dev` and walk
the full flows: advertiser creates an ad, admin approves, SDK requests an ad, track an impression,
publisher requests a payout.

### Phase 6. Cutover

DNS already sits with Cloudflare, so this is fast and reversible.

1. Add the custom domain `api.prismpublication.com` to the Worker.
2. Create the Pages project from `main`, build command `npm run build`, output `dist`, and set
   `VITE_API_BASE_URL=https://api.prismpublication.com`.
3. Move the apex to Pages.
4. Watch `wrangler tail prism-api` for the first hour.

Rollback is repointing the apex back to Vercel and `VITE_API_BASE_URL` back to the Supabase
function URL. Keep both live for a week before deleting anything.

## Secrets

No secret values belong in either repository. `secrets/ROTATE_ME.md` in the old repo records that
plaintext env files were committed and never purged from history, and that the database password is
still live and unrotated. Since every value is being re-entered during this migration, rotate as
you go: the DB password dies with Supabase, and `ADMIN_API_KEY` and `PRISM_API_KEY` are currently
dev placeholders that were never replaced. Re-issue `PRISM_API_KEY` to SDK consumers.

`.dev.vars` is gitignored. Only `.dev.vars.example`, holding names, is committed.

## Open items

- `apps/main-site/` is a static project hub, but the apex is going to the React app. The hub needs
  its own path or subdomain, or it should be retired.
- The blog lives in the Postgres `blog_posts` table and is rendered by the SPA. That works
  unchanged after the move, so the static `blog/*.html` files in `apps/main-site` are a parallel
  system. Pick one.
- `server/src/` (legacy Express) is not being ported. Delete it rather than moving it.
- `query-fan-out` calls the Lovable gateway. Consider Workers AI or AI Gateway instead, which would
  drop an external dependency and give caching plus spend limits.
