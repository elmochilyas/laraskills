| Metadata | |
|---|---|
| KU ID | ku-06 |
| Subdomain | relevance-and-ranking |
| Topic | Learning to Rank |
| Source | Academic / Industry |
| Maturity | Mature (ML research) |

## Overview

Learning to Rank (LTR) uses machine learning to optimize search result ordering. Approaches: pointwise (predict relevance score), pairwise (predict which of two items is better), listwise (optimize entire ranking). LTR uses features from queries, documents, and user interactions to train a ranking model.

## Core Concepts

- **Pointwise**: Predict absolute relevance score per query-document pair
- **Pairwise**: Predict which document is more relevant (preference ordering)
- **Listwise**: Optimize entire ranked list (NDCG, MAP)
- **Features**: Query features, document features, query-document match features, user features
- **Training Data**: Click logs, expert judgments, implicit feedback

## When To Use

- High-traffic search with large click logs
- Complex ranking requirements (many signals to combine)
- Manual ranking rules hitting diminishing returns
- Algolia/Elasticsearch with LTR plugin support

## When NOT To Use

- Low-traffic search (insufficient training data)
- Simple ranking needs (rules are sufficient)
- Team lacks ML expertise
- Rapidly changing content requires frequent model retraining

## Best Practices

1. **Start with click modeling**: Understand user behavior before building LTR.
2. **Use pairwise approaches**: Best balance of complexity and effectiveness.
3. **Feature engineering is critical**: Good features >> model choice.
4. **Evaluate offline plus online**: Offline metrics may not match A/B test results.
5. **Retrain regularly**: Model degrades as content and user behavior change.

## Related Topics

- K011 (Search analytics)
- K022 (Algolia A/B testing)
- K062 (Cross-encoder re-ranking)

## AI Agent Notes

- LTR is advanced — only needed for high-traffic, complex ranking needs
- Most Laravel apps don't need LTR; Algolia/Meilisearch built-in ranking is sufficient
- For agents: recommend LTR only when rules-based approach hits limits

## Verification

- [ ] Click data collected and modeled
- [ ] Feature engineering completed
- [ ] LTR model trained and evaluated offline
- [ ] A/B test shows LTR improvement
- [ ] Retraining pipeline established
