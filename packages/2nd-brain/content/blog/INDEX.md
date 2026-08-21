# Blog corpus audit

41 published posts in the Supabase `blog_posts` table, 2026-01-12 to 2026-08-18. Roughly 33,800
words total. Audited 2026-08-21 against the house content standard, which sets a hard floor of 800
words and a pillar target of 2,900.

## Headline findings

1. **12 of 41 posts clear the 800 word floor.** The other 29 are below it, and 25 of those are
   under 750 words. The shortest is 152 words.
2. **Nothing reaches the 2,900 word pillar target.** The longest post is 1,867 words.
3. **The quality break is a date, not a topic.** Every post that clears 800 words was published on
   or after 2026-06-29. Everything from 2026-01-12 through 2026-06-03 is under 750 words. Something
   changed in late June and the later work is three to five times longer.
4. **All 41 posts are about contextual advertising for AI chatbots**, which is the product being
   parked. As a corpus for a repositioned site this is a liability, not an asset.
5. **The voice is not the owner's.** Sampled bodies read as generic LLM SEO copy ("Once upon a time,
   Google AdSense was the unspoken hero of the internet economy"). Several titles contain em dashes,
   which the house style forbids. Compare against the owner's own LinkedIn writing, which is
   unmistakably human. Do not treat this corpus as voice training data.

## Posts that clear the 800 word floor

| Words | Published | Category | Slug |
|---|---|---|---|
| 1867 | 2026-07-19 | Wellness | wellness-chatbot-monetization-contextual-2026 |
| 1604 | 2026-08-11 | Wellness | fitness-chatbot-contextual-partners-2026 |
| 1477 | 2026-08-18 | Travel | travel-chatbot-free-tier-limits-2026 |
| 1458 | 2026-07-16 | Wellness | wellness-chatbot-api-costs-2026 |
| 1366 | 2026-06-30 | Publishers | ai-app-publisher-monetization-2026 |
| 1118 | 2026-07-24 | Publishers | b2c-chatbot-conversation-scoring-customer-experience-2026 |
| 1023 | 2026-07-30 | Publishers | lifestyle-chatbot-revenue-without-paywall-2026 |
| 1012 | 2026-06-30 | Strategy | contextual-ads-ai-chatbots |
| 996 | 2026-07-02 | Industry | ai-ad-platforms-vs-independent-publishers-2026 |
| 934 | 2026-06-29 | Ad Matching Works | how-ad-matching-works |
| 860 | 2026-07-21 | Publishers | prism-signals-conversation-scoring-2026 |
| 850 | 2026-07-27 | Publishers | personal-ai-assistant-unit-economics-2026 |

## Posts below the floor

Near misses worth extending rather than cutting, 600 to 799 words:

| Words | Published | Slug |
|---|---|---|
| 755 | 2026-07-29 | travel-chatbot-inference-costs-2026 |
| 737 | 2026-07-31 | travel-chat-intent-advertising-2026 |
| 732 | 2026-05-10 | best-practices-for-monetizing-chatbot-sessions-with-ads-without-killing-user-trust |
| 695 | 2026-07-20 | what-ai-chat-ads-actually-are |
| 608 | 2026-08-03 | mental-health-chatbot-inference-revenue-2026 |

Thin, 400 to 599 words, 9 posts: why-chatbot-operators-are-ditching-subscriptions-for-ad-revenue
(591), how-ad-matching-actually-happens (568), what-contextual-ads-in-chatbots-actually-are-and-why-they-work-differently
(547), advertisers-it-s-time-to-rethink-where-the-conversation-is-happening (498),
long-tail-keywords-are-the-secret-interface-between-humans-and-llms (461),
the-death-of-the-cookie-and-the-rise-of-conversational-intent (441),
sponsored-responses-vs-real-answers-who-do-you-trust-in-a-chatbot (423),
how-native-ads-in-ai-chatbots-actually-work (411), why-subscriptions-alone-won-t-save-your-chatbot-business (400).

Very thin, under 400 words, 15 posts: how-to-monetize-chatbot-sessions (362),
the-right-ad-at-the-right-moment-inside-ai (333), google-had-a-busy-week (311),
how-adsense-is-sneaking-into-chatbots (287), what-advertisers-should-be-asking (270),
everyone-s-talking-about-targeting-ads (265), intent-signals-for-conversational-ads (220),
publisher-ad-load-without-conversation-fatigue (192), what-chatbot-operators-need-to-understand (189),
why-chatbot-context-is-high-intent-territory (178), why-the-question-is-the-ad (173),
you-still-rank-nobody-finds-you-here-s-why (168), creative-patterns-for-native-chatbot-ads (161),
charging-users-10-month-for-your-ai-chatbot (156), openai-adding-shopping-to-chatgpt (152).

## What survives a repositioning

If the site moves away from the ad marketplace and toward go-to-market and token economics, the
posts about LLM unit costs transfer because the subject is real and audience-agnostic. The ad
marketplace marketing does not transfer.

Likely keepers, subject to a rewrite in the owner's actual voice:

- wellness-chatbot-api-costs-2026 (1458), inference cost structure
- travel-chatbot-free-tier-limits-2026 (1477), free tier economics
- personal-ai-assistant-unit-economics-2026 (850), unit economics
- travel-chatbot-inference-costs-2026 (755), inference cost
- mental-health-chatbot-inference-revenue-2026 (608), cost against revenue
- ai-app-publisher-monetization-2026 (1366), partially, the economics half

That is 6 posts of the 41. Everything else is either too thin to rank, too tied to a parked
product, or both.

## Recommendation

Do not build a site around this corpus. Export it for the record, keep the six economics pieces as
raw material for rewrites, and treat the rest as archive. The publishing engine should be pointed at
new work in the owner's own voice, seeded from his LinkedIn writing, which is where the actual voice
lives.

## Reproducing this

```
cd packages/2nd-brain
npm install
$env:DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
npm run export:blog
```

Writes one markdown file per slug into this directory with YAML front matter. Idempotent, so it
doubles as a sync after admin panel edits.
