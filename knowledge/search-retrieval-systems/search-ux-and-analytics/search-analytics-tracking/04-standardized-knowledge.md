| Metadata | |
|---|---|
| KU ID | ku-08 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Analytics Tracking |
| Source | Industry |
| Maturity | Stable |

## Overview

Search analytics tracking captures query data, user interactions, and business outcomes. Data points: search queries, filters applied, result clicks (position), conversions, and session context. Engines provide varying levels of built-in analytics (Algolia: comprehensive, Meilisearch: basic, Typesense: none).

## Core Concepts

- **Query Logging**: Record each search query with filters, user, timestamp
- **Click Tracking**: Record which result was clicked, position, document ID
- **Conversion Tracking**: Link search queries to desired outcomes (purchase, signup)
- **Session Tracking**: Query sequence within a session
- **Analytics Storage**: Database, Redis, or external analytics service
- **Reporting**: Top searches, zero-result queries, CTR by position

## When To Use

- Any production search (essential for quality monitoring)
- Search quality improvement initiatives
- Business metric tracking (search → conversion)

## When NOT To Use

- Development/staging environments
- Privacy-restricted search (healthcare, legal — with restrictions)

## Best Practices

1. **Log every query**: Essential for analytics and relevance tuning.
2. **Track clicks with position**: Enables position-based CTR analysis.
3. **Use Algolia analytics**: Most comprehensive built-in analytics.
4. **Store data in structured format**: Query, timestamp, user, filters, results.
5. **Report weekly**: Track trends, not just absolute numbers.
6. **Comply with privacy regulations**: Anonymize or allow opt-out.

## Related Topics

- K020 (Algolia analytics)
- K011 (Search analytics & click modeling)
- K006 (Empty state / no results)

## AI Agent Notes

- Algolia has the best built-in analytics
- Custom analytics requires database/Redis implementation
- Zero-result rate is the most actionable metric
- For agents: implement query logging + click tracking as minimum analytics

## Verification

- [ ] Every query logged
- [ ] Click tracking with position
- [ ] Conversion tracking implemented
- [ ] Zero-result queries identified
- [ ] Top searches report generated
- [ ] CTR by position tracked
- [ ] Weekly analytics report
- [ ] Privacy compliance verified
