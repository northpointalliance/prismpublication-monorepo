// Request id + security headers. Unchanged from the Deno version apart from the Env type.
import type { MiddlewareHandler } from "hono";
import type { Ctx, Env } from "./env";

export const baseMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const incoming = c.req.header("x-request-id");
  const requestId = (incoming ?? crypto.randomUUID()).slice(0, 64);
  c.set("requestId", requestId);
  await next();
  c.header("X-Request-Id", requestId);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};

export const fail = (c: Ctx, status: number, error: string, extra?: Record<string, unknown>) =>
  c.json({ error, ...(extra ?? {}) }, status as 400);

export const readJson = async (c: Ctx): Promise<unknown> => {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
};

// Timing-safe compare, ported from _shared/crypto.ts. Workers has WebCrypto natively.
export const secureEqual = (a: string, b: string): boolean => {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ab.byteLength; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
};

// Admin guard. Reads the secret from the binding rather than a module constant.
export const requireAdminKey: MiddlewareHandler<Env> = async (c, next) => {
  const supplied = c.req.header("x-admin-key") ?? "";
  if (!c.env.ADMIN_API_KEY || !secureEqual(supplied, c.env.ADMIN_API_KEY)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};
