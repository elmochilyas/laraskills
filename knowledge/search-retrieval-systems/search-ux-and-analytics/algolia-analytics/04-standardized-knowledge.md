| Metadata | |
|---|---|
| KU ID | K020 |
| Subdomain | search-ux-and-analytics |
| Topic | Algolia Analytics |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Overview

Algolia provides built-in search analytics including top searches, click-through rates, conversion tracking, and user behavior analysis. Integration with Laravel Scout via `SCOUT_IDENTIFY` enables user-identified analytics, tracking which users perform which searches and click which results. Algolia's analytics dashboard provides visual reports and data export capabilities.

## Core Concepts

- **Top Searches**: Most frequent search queries with result counts.
- **Click Analytics**: Track search result clicks, positions, and CTR.
- **Conversion Analytics**: Track post-search conversions (purchases, signups, etc.).
- **User Identification**: `SCOUT_IDENTIFY` links searches to authenticated users.
- **Click Position**: Which position results are clicked (1st, 2nd, 10th, etc.).

## When To Use

- Any Algolia-based search implementation (analytics is built-in)
- Understanding what users are searching for and clicking
- Identifying zero-result queries for content gap analysis
- Measuring search relevance via click-through rates

## When NOT To Use

- Non-Algolia search engines (use custom analytics instead)
- Privacy regulations limiting search tracking
- Very low-traffic search (<100 queries/day) — limited actionable data

## Best Practices

1. **Enable click analytics**: Set `clickAnalytics: true` via Scout callback.
2. **Configure SCOUT_IDENTIFY**: Link authenticated users to search events.
3. **Track conversions**: Define and track key conversion events.
4. **Review analytics regularly**: Weekly review of top searches and CTR trends.
5. **Identify zero-result queries**: Create content or redirects for frequent no-result searches.

## Architecture Guidelines

- Enable analytics in Scout: configure `SCOUT_IDENTIFY` in `.env`.
- Send click/conversion events from frontend via Algolia's insights library or backend via API.
- Analytics dashboard at Algolia dashboard > Analytics.
- Export analytics data via API for custom reporting.

## Related Topics

- K018 (Algolia driver setup)
- K022 (Algolia A/B testing)
- K019 (Algolia index settings)

## AI Agent Notes

- Algolia analytics are built-in and require minimal setup.
- Use SCOUT_IDENTIFY for user-level analytics tracking.
- For agents: enable click analytics; configure SCOUT_IDENTIFY; review analytics dashboard regularly.

## Verification

- [ ] Click analytics enabled in search queries
- [ ] SCOUT_IDENTIFY configured for user tracking
- [ ] Conversion events defined and tracked
- [ ] Analytics dashboard reviewed for insights
- [ ] Zero-result queries identified and addressed
