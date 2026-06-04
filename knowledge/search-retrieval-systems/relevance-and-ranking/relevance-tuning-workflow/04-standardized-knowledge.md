| Metadata | |
|---|---|
| KU ID | ku-13 |
| Subdomain | relevance-and-ranking |
| Topic | Relevance Tuning Workflow |
| Source | Industry / Community |
| Maturity | Stable |

## Overview

Relevance tuning is an iterative process of adjusting search ranking parameters to improve result quality. The workflow: 1) Establish baseline metrics, 2) Identify problematic queries, 3) Adjust ranking (field weights, custom rules, synonyms), 4) Evaluate impact (offline + A/B test), 5) Deploy and monitor. Tuning is continuous, not a one-time activity.

## Core Concepts

- **Baseline**: Collection of representative queries with expected results
- **Metric Tracking**: NDCG, MRR, CTR, zero-result rate
- **Tuning Levers**: Field weighting, typo tolerance, ranking rules, custom ranking, personalization, re-ranking
- **Query Categories**: Navigational (find specific), Informational (learn), Transactional (buy)
- **Iteration**: Tune → measure → deploy → monitor → retune

## When To Use

- Initial search implementation (basic tuning)
- Performance degradation detected (metrics declining)
- New content types added (different tuning needed)
- Business requirement changes (new ranking priorities)

## When NOT To Use

- Search is not a critical feature
- No metrics infrastructure to measure impact
- Changes are not deployed to users (need production validation)

## Best Practices

1. **Create query test set**: 50-100 representative queries with expected top-3 results.
2. **Tune in order**: Data quality → field weights → typo tolerance → ranking rules → custom ranking → personalization.
3. **One change at a time**: Isolate impact of each tuning change.
4. **Use offline evaluation**: Quick iteration without user impact.
5. **Validate online**: A/B test significant changes.
6. **Document changes**: Why, what, impact for future reference.

## Related Topics

- K030 (Meilisearch ranking rules)
- K031 (Custom ranking)
- K022 (A/B testing)
- K011 (Search analytics)

## AI Agent Notes

- Relevance tuning is iterative — expect multiple rounds
- Data quality is the most impactful and most overlooked tuning lever
- For agents: start with data quality, then field weights, add complexity incrementally

## Verification

- [ ] Query test set created (50+ queries)
- [ ] Baseline metrics established
- [ ] Tuning hierarchy followed
- [ ] Each change isolated and measured
- [ ] Offline evaluation before A/B test
- [ ] Changes documented
- [ ] Monitoring alerts for regression
