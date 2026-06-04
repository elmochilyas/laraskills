| Metadata | |
|---|---|
| KU ID | ku-11 |
| Subdomain | relevance-and-ranking |
| Topic | Search Analytics & Click Modeling |
| Source | Industry |
| Maturity | Stable |

## Overview

Search analytics captures query data, click-through rates, and conversion events to measure and improve search quality. Click modeling uses position-normalized click data to infer document relevance. Key metrics: CTR, position-weighted clicks, zero-result rate, query abandonment, and search-to-conversion funnel.

## Core Concepts

- **Query Logging**: Recording search queries, filters, result positions clicked
- **CTR (Click-Through Rate)**: Clicks per impression by position
- **Zero-Result Rate**: Queries returning no results
- **Conversion Tracking**: Searches leading to desired outcomes (purchase, signup)
- **Click Models**: Position-based examination model, cascade model
- **Query Abandonment**: Searches with no clicks

## When To Use

- Production search requiring quality monitoring
- Relevance tuning based on user behavior
- Identifying search UX issues (zero result queries)
- Business metrics (search-to-purchase conversion)

## When NOT To Use

- Development/staging environments
- Very low-traffic applications (insufficient data)
- Anonymous search without user identification

## Best Practices

1. **Log every search query**: Store query, filters, result IDs, positions.
2. **Track all clicks**: Position, document ID, timestamp, user.
3. **Monitor zero-result rate**: Target <5% for production search.
4. **Use Algolia analytics**: If using Algolia, built-in analytics are comprehensive.
5. **Implement user identification**: Associate queries with users for personalization.
6. **Report weekly**: Track trends, not just snapshots.

## Related Topics

- K020 (Algolia analytics)
- K012 (Search A/B testing)
- K006 (Learning to rank)

## AI Agent Notes

- Algolia has the most mature built-in analytics
- Custom analytics requires logging to database/Redis with Laravel events
- Zero-result rate is the most actionable metric for immediate improvement
- For agents: implement query logging first, then click tracking, then conversion

## Verification

- [ ] Query logging implemented
- [ ] Click tracking implemented
- [ ] Zero-result rate monitored
- [ ] CTR by position tracked
- [ ] Conversion tracking linked to searches
- [ ] Analytics dashboard built or integrated
- [ ] Weekly reporting established
