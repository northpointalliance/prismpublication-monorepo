#!/usr/bin/env node
// Renders a validated post JSON into markdown with YAML frontmatter.
//
// Split is deliberate: layer 1 (the answer and the CTA) goes into FRONTMATTER so the site template
// places it above the fold, and layers 2 and 3 go into the BODY beneath. The model never decides
// placement, and it never writes CTA copy: it emits a cta_id which is resolved here from the
// library, so editing an offer once updates every post on the next render.
//
// Usage:
//   node scripts/render-post.mjs drafts/us-entity-before-vc.json
//   node scripts/render-post.mjs drafts/us-entity-before-vc.json --out content/posts

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIBRARY = join(HERE, "..", "data", "cta-library.json");

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith("--"));
const outFlag = args.indexOf("--out");
const outDir = outFlag > -1 ? resolve(args[outFlag + 1]) : join(HERE, "..", "content", "posts");

if (!inputPath) {
  console.error("Usage: node scripts/render-post.mjs <post.json> [--out <dir>]");
  process.exit(1);
}

const q = (v) => JSON.stringify(String(v));

// Minimal YAML emitter. Every scalar is a JSON double-quoted string, which is valid YAML.
const toYaml = (value, indent = 0) => {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return `${pad}[]`;
    return value
      .map((item) =>
        item !== null && typeof item === "object"
          ? `${pad}-\n${toYaml(item, indent + 2)}`
          : `${pad}- ${q(item)}`,
      )
      .join("\n");
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) =>
        v !== null && typeof v === "object"
          ? `${pad}${k}:\n${toYaml(v, indent + 2)}`
          : `${pad}${k}: ${typeof v === "boolean" || typeof v === "number" ? v : q(v)}`,
      )
      .join("\n");
  }
  return `${pad}${q(value)}`;
};

const renderMatrix = (m) => {
  const out = [`## ${m.heading}`, ""];
  if (m.table) {
    out.push(`| ${m.table.columns.join(" | ")} |`);
    out.push(`|${m.table.columns.map(() => "---").join("|")}|`);
    for (const row of m.table.rows) out.push(`| ${row.join(" | ")} |`);
  } else {
    for (const b of m.bullets) out.push(`- ${b}`);
  }
  out.push("");
  return out.join("\n");
};

const renderSection = (s) => {
  const out = [`## ${s.section_h2}`, "", s.content.trim(), "", `**TLDR:** ${s.tldr}`, ""];
  const cited = s.authorities
    .map((a) => (a.href ? `[${a.name}](${a.href})` : a.name) + (a.detail ? `, ${a.detail}` : ""))
    .join(" · ");
  out.push(`*Sources: ${cited}*`, "");
  return out.join("\n");
};

const main = async () => {
  const post = JSON.parse(await readFile(resolve(inputPath), "utf8"));
  const library = JSON.parse(await readFile(LIBRARY, "utf8"));

  const offer = library.offers.find((o) => o.id === post.cta_id);
  if (!offer) {
    console.error(`Unknown cta_id "${post.cta_id}". Known: ${library.offers.map((o) => o.id).join(", ")}`);
    process.exit(1);
  }

  // Layer 1 lives in frontmatter so the template, not the model, controls above-the-fold placement.
  const frontmatter = {
    title: post.title,
    slug: post.slug,
    description: post.meta_description,
    updated_at: post.updated_at,
    layout: "front-loaded-post",
    direct_answer: post.executive_summary.direct_answer,
    key_takeaways: post.executive_summary.key_takeaways,
    cta: {
      id: offer.id,
      headline: offer.headline,
      body: offer.body,
      button_text: offer.button_text,
      button_link: offer.button_link,
      friction_reducer: offer.friction_reducer,
    },
    faq: post.faq_schema_items,
    source_log: post.source_log,
  };

  const body = [
    renderMatrix(post.decision_matrix),
    ...post.deep_context_body.map(renderSection),
    "## Frequently asked questions",
    "",
    ...post.faq_schema_items.flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
    // Engines read this directly. Keep it in the body so it survives any template change.
    "<script type=\"application/ld+json\">",
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faq_schema_items.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    }),
    "</script>",
    "",
  ].join("\n");

  await mkdir(outDir, { recursive: true });
  const file = join(outDir, `${post.slug}.md`);
  await writeFile(file, `---\n${toYaml(frontmatter)}\n---\n\n${body}`, "utf8");

  const words = [
    post.executive_summary.direct_answer,
    ...post.deep_context_body.map((s) => `${s.content} ${s.tldr}`),
  ].join(" ").trim().split(/\s+/).length;

  console.log(`Rendered ${file}`);
  console.log(`Offer: ${offer.name}`);
  console.log(`Sections: ${post.deep_context_body.length}   FAQ: ${post.faq_schema_items.length}   Words: ${words}`);
  if (words < 800) console.log(`WARNING: ${words} words is under the 800 floor.`);
};

main().catch((err) => {
  console.error("Render failed:", err.message);
  process.exit(1);
});
