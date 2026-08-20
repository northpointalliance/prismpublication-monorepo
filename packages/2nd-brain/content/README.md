# packages/2nd-brain/content

Raw markdown prompt logs. One file per agent session, named `YYYY-MM-DD-slug.md`.

These are the source material for posts in `apps/main-site/blog/`. Agents read from here when generating an article, per `AGENTS.md`.

## Format

YAML front matter validated against [`../schemas/prompt-log.schema.json`](../schemas/prompt-log.schema.json), followed by free-form notes.

```markdown
---
date: 2026-08-20
project: prismpublication
event: Short title for the session
event_type: Agent prompt
outcome: What shipped, with commit SHAs where relevant
prompt_excerpt: First words of the operator prompt, verbatim
estimated_cost_usd: 0.15
tags: [tokens, attention]
blog_slug: token-optimization
---

## What was asked

## What was done

## What is still open
```

## Rules

- No secrets, API keys, or client names in `prompt_excerpt`.
- `estimated_cost_usd` is modeled at mid-tier rates, not invoiced. Label it as modeled anywhere it surfaces publicly.
- A log becomes a post only when `blog_slug` is set and the rendered HTML exists.
- Logs with a `blog_slug` should also appear as a row in the matching Convo Margin project trace.
