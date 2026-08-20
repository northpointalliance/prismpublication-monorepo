---
date: 2026-08-20
project: 2nd-brain
event: Transformer attention and stopword cost analysis
event_type: Agent prompt
outcome: Published blog/token-optimization.html with seven question-based sections
prompt_excerpt: Optimizing Transformer Attention & Stopwords
estimated_cost_usd: 0.18
tags: [tokens, attention, tokenizer, margin, llm-theory]
blog_slug: token-optimization
---

## What was asked

Whether stripping stopwords from prompts is worth the engineering time, and how to reason about attention cost against an actual invoice.

## What was done

Worked through the gap between attention cost and billed cost:

- Attention is quadratic in sequence length, but provider billing is linear in tokens. Cutting 15 percent of tokens shrinks the attention matrix about 28 percent and the invoice about 15 percent.
- BPE vocabularies map common stopwords to single tokens. Stripping them removes the cheapest tokens and can raise total count when the remaining text retokenizes badly.
- Ranked the compression techniques that survive production: delete unread context, cap retrieval passages, cache the static system prompt, summarize history, and only then touch phrasing.
- Documented leave-one-out ablation against a frozen eval set as the way to find dead context without model internals.
- Defined a prompt budget as a hard token ceiling per named block, asserted in CI.

## What is still open

- No first-party measurements yet. Every number in the post is modeled from public rates, and the post says so.
- The prompt budget example is illustrative. Needs a real allocation from live traffic before it is presented as a benchmark.
- Worth a follow-up on output token cost, which is billed three to five times input and got one sentence here.
