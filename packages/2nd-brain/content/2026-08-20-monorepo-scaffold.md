---
date: 2026-08-20
project: prismpublication
event: Scaffold prismpublication-monorepo for Cloudflare Pages
event_type: Agent prompt
outcome: Created .cursorrules, AGENTS.md, apps/main-site, apps/tools/convomargin, packages/2nd-brain
prompt_excerpt: prismpublication-monorepo tree with apps and packages, Cloudflare roots
estimated_cost_usd: 0.21
tags: [monorepo, cloudflare, scaffold, static-site]
---

## What was asked

Stand up a new monorepo matching a supplied directory tree, with static HTML app roots served entirely from Cloudflare Pages and no Vercel.

## What was done

- Wrote `.cursorrules` and `AGENTS.md` verbatim from the operator.
- Created `apps/main-site/` with the supplied `index.html` project index page.
- Added `css/base.css` (tokens, reset, element typography) and `css/layout.css` (structure and components), each under 100 lines per the tree.
- Rendered `blog/token-optimization.html` because the hub links to it, plus `blog/index.html` so `/blog/` does not 404.
- Placed a Pages configuration README at `apps/tools/convomargin/` rather than copying the site, since it already exists in three locations.
- Defined three shared schemas in `packages/2nd-brain/schemas/`: prompt log, blog post, project trace.

## What is still open

- **Not decided:** whether the existing React app at `c:\Sources\repo\prismpublication` gets retired, or kept for the `/app/*` portals. The portals need Supabase Auth and cannot be static HTML.
- The live blog lives in the Postgres `blog_posts` table. Moving to rendered HTML needs a generator, or the admin publish flow stops working.
- Convo Margin still has three homes. Pick one before copying files in.
- No git remote yet. No Cloudflare Pages project created for this root.
