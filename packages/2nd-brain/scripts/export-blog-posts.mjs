#!/usr/bin/env node
// Exports blog_posts from Postgres to markdown files with YAML front matter.
//
// Why this exists: 41 published posts (~33,800 words) live only in a Supabase table.
// As files in git they are greppable, diffable, reviewable, feedable to an agent as voice
// corpus, and renderable by whatever front end gets chosen later. In a database they are
// hostage to a running service and an API.
//
// Usage:
//   DATABASE_URL="postgresql://..." node packages/2nd-brain/scripts/export-blog-posts.mjs
//
// Idempotent. Re-running overwrites by slug, so it doubles as a sync.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

// Resolve against this file, not the cwd, so the script works from any directory.
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "blog");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required. Do not hardcode it, and do not commit it.");
  process.exit(1);
}

// Direct connection, not the transaction pooler, so prepared statements are fine.
const sql = postgres(connectionString, { max: 2, idle_timeout: 10 });

// YAML-safe scalar. JSON.stringify produces a valid double-quoted YAML string.
const yamlValue = (v) => {
  if (v === null || v === undefined) return '""';
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(String(v));
};

const isoDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const frontMatter = (post) =>
  [
    "---",
    `title: ${yamlValue(post.title)}`,
    `slug: ${yamlValue(post.slug)}`,
    `excerpt: ${yamlValue(post.excerpt)}`,
    `category: ${yamlValue(post.category)}`,
    `published: ${yamlValue(post.published)}`,
    `published_at: ${yamlValue(isoDate(post.publishedAt))}`,
    `created_at: ${yamlValue(isoDate(post.createdAt))}`,
    `updated_at: ${yamlValue(isoDate(post.updatedAt))}`,
    `reading_time: ${yamlValue(post.readingTime)}`,
    `image_url: ${yamlValue(post.imageUrl)}`,
    `source: ${yamlValue("supabase:blog_posts")}`,
    `source_id: ${yamlValue(post.id)}`,
    "---",
    "",
  ].join("\n");

// Slugs come from the app, but never trust one as a path segment.
const safeName = (slug, id) => {
  const cleaned = String(slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || `post-${id}`;
};

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true });

  const posts = await sql`
    SELECT id, title, slug, excerpt, body, "imageUrl", category,
           "readingTime", published, "publishedAt", "createdAt", "updatedAt"
    FROM blog_posts
    ORDER BY "publishedAt" NULLS LAST, "createdAt"`;

  const seen = new Map();
  let written = 0;
  let empty = 0;

  for (const post of posts) {
    if (!post.body || !post.body.trim()) {
      console.warn(`  empty body, skipped: ${post.slug ?? post.id}`);
      empty += 1;
      continue;
    }

    let name = safeName(post.slug, post.id);
    if (seen.has(name)) {
      // Collision: keep both rather than silently dropping one.
      const n = seen.get(name) + 1;
      seen.set(name, n);
      console.warn(`  duplicate slug "${name}", writing as ${name}-${n}`);
      name = `${name}-${n}`;
    } else {
      seen.set(name, 1);
    }

    const file = join(OUT_DIR, `${name}.md`);
    await writeFile(file, frontMatter(post) + post.body.trim() + "\n", "utf8");
    written += 1;
  }

  const words = posts.reduce((n, p) => n + (p.body ? p.body.split(/\s+/).length : 0), 0);
  console.log(`\nExported ${written} posts to content/blog/ (${words.toLocaleString()} words).`);
  if (empty) console.log(`${empty} row(s) had no body and were skipped.`);
  console.log("Review the diff, commit, then the posts no longer depend on Supabase.");

  await sql.end();
};

main().catch(async (err) => {
  console.error("Export failed:", err.message);
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
