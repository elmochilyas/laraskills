| Metadata | |
|---|---|
| KU ID | ku-05 |
| Subdomain | relevance-and-ranking |
| Topic | Personalized Ranking |
| Source | Industry |
| Maturity | Stable |

## Overview

Personalized ranking tailors search results to individual users based on their preferences, browsing history, purchase history, and click behavior. Methods include signal boosting (user-specific attributes), user embedding (user vector for similarity), and learning-to-rank with user features.

## Core Concepts

- **Signal Boosting**: Boost results matching user preferences (category, author, brand)
- **User Embedding**: Generate user vector from interaction history, compare to item embeddings
- **Behavioral Signals**: Click-through rate, dwell time, purchase history, favorites
- **Session Context**: Current session behavior (recent views, cart contents)
- **Cold Start**: New users with no history — fall back to global ranking

## When To Use

- E-commerce with returning users
- Content platforms with personalized feeds
- SaaS products with user-specific contexts
- Any search where user preferences improve relevance

## When NOT To Use

- Anonymous/public search (no user identification)
- Very small user base (insufficient signal)
- Privacy regulations limit behavioral data collection

## Best Practices

1. **Start with signal boosting**: Simplest to implement and understand.
2. **Use fallback for cold start**: Global ranking for users without history.
3. **Monitor personalization impact**: Ensure it improves, not harms, search quality.
4. **Respect privacy**: Allow users to opt out, comply with regulations.
5. **A/B test personalization**: Measure CTR improvement vs non-personalized.

## Related Topics

- K031 (Custom ranking rules)
- K062 (Cross-encoder re-ranking)
- K022 (Algolia A/B testing)

## AI Agent Notes

- Personalization is advanced — implement global ranking first
- Algolia has built-in personalization; self-hosted requires custom implementation
- For agents: start with signal boosting before user embedding

## Verification

- [ ] Personalization signals identified
- [ ] Boosting implementation tested
- [ ] Cold start handled with fallback
- [ ] Privacy compliance verified
- [ ] A/B test showing improvement
