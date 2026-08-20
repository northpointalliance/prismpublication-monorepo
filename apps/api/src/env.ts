// Worker bindings and Hono context types. Replaces the Deno module-global config.
// Routes read secrets from `c.env.NAME` instead of importing constants.
import type { Context } from "hono";
import type { Sql } from "./db";

export type Bindings = {
  HYPERDRIVE: Hyperdrive;
  BLOG_IMAGES: R2Bucket;
  AD_IMAGES: R2Bucket;
  WEBHOOK_QUEUE: Queue<WebhookJob>;
  PAYOUT_QUEUE: Queue<PayoutJob>;

  // wrangler.jsonc vars
  API_CORS_ORIGIN: string;
  REQUIRE_SDK_HMAC: string;

  // wrangler secret put
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ADMIN_API_KEY: string;
  PRISM_API_KEY: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  OPENAI_API_KEY?: string;
  LOVABLE_API_KEY?: string;
  PAYPAL_WEBHOOK_ID?: string;
};

export type WebhookJob = Record<string, unknown>;
export type PayoutJob = { payoutRequestId: string };

export type PortalUser = { id: string; email: string; name: string };

export type PortalWorkspace = {
  user: PortalUser;
  organization: { id: string; name: string; type: string; [k: string]: unknown };
  membership: { role: string; [k: string]: unknown };
};

export type SdkAuth = {
  mode: "master" | "bot";
  rawToken: string;
  botId?: string;
  botPublicId?: string;
  keyId?: string;
};

// Hono generic. `sql` is set per request by the withDb middleware.
export type Env = {
  Bindings: Bindings;
  Variables: {
    sql: Sql;
    requestId: string;
    rawBody: string;
    portalUser?: PortalUser;
    portalWorkspace?: PortalWorkspace;
    sdkAuth?: SdkAuth;
  };
};

export type Ctx = Context<Env>;

// CPM rate keys in platform_settings (cents per 1000 impressions). True constants, not env.
export const CPM_TEXT_KEY = "cpm_text_cents";
export const CPM_CARD_KEY = "cpm_card_cents";
export const CPM_BANNER_KEY = "cpm_banner_cents";
export const DEFAULT_CPM_TEXT = 1000;
export const DEFAULT_CPM_CARD = 2000;
export const DEFAULT_CPM_BANNER = 1500;
