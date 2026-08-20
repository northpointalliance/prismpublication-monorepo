// Better Auth replaces Supabase Auth. It owns its own tables in Neon, so the portal no longer
// depends on a Supabase project for sign-in, and password reset stops going through the
// Supabase SMTP path that currently returns 500.
//
// Generate the required tables once against Neon:
//   npx @better-auth/cli@latest generate --config src/auth.ts
//   npx @better-auth/cli@latest migrate --config src/auth.ts
// That creates: user, session, account, verification.
import { betterAuth } from "better-auth";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Bindings } from "./env";

// Env-dependent, so it cannot be a module singleton. One instance per request.
export const createAuth = (env: Bindings) => {
  const pool = new Pool({
    connectionString: env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL,
    max: 3,
  });

  return betterAuth({
    database: {
      db: new Kysely({ dialect: new PostgresDialect({ pool }) }),
      type: "postgres",
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendMail(env, user.email, "Reset your Prism password", url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail(env, user.email, "Confirm your Prism account", url);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: (env.API_CORS_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  });
};

// Resend over fetch. No SDK needed on Workers.
const sendMail = async (env: Bindings, to: string, subject: string, url: string) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject,
      html: `<p>${subject}.</p><p><a href="${url}">Continue</a></p>`,
    }),
  });
  if (!res.ok) {
    console.error("Resend send failed", res.status, await res.text());
    throw new Error("Email send failed");
  }
};
