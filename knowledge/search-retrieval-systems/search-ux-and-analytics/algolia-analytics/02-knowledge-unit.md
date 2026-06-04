# Knowledge Unit: Algolia Analytics

## Metadata

- **ID:** K020
- **Subdomain:** Search UX & Analytics
- **Source:** Algolia Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** User-identified search analytics

## Executive Summary

Algolia provides built-in search analytics, tracking search queries, clicks, conversions, and revenue. The `SCOUT_IDENTIFY` mechanism in Laravel Scout links search events to authenticated users. Algolia's analytics dashboard provides insights into search performance, popular queries, zero-result queries, and click-through rates — enabling data-driven relevance optimization.

## Core Concepts

- **Search Events**: Queries, clicks, conversions are tracked automatically by Algolia.
- **SCOUT_IDENTIFY**: Scout's identify mechanism associates search events with specific users (requires Scout 9+).
- **Dashboard**: Real-time and historical analytics with drill-down per index.
- **Click Analytics**: Tracks which results users click after searching.
- **Conversion Analytics**: Tracks which searches lead to conversions (purchases, signups, etc.).

## Internal Mechanics

Algolia's JavaScript client sends analytics events (query ID, clicked object, conversion type) to Algolia's tracking servers. For server-side tracking, the PHP SDK provides `Algolia\AlgoliaSearch\InsightsClient`. Scout's `SCOUT_IDENTIFY` wraps this by associating the authenticated user with search events. Algolia aggregates these events and computes metrics like Click-Through Rate (CTR), Average Click Position, and Conversion Rate.

## Patterns

- **Track search quality**: Monitor zero-result queries — these are opportunities to improve indexing or synonyms.
- **Identify popular queries**: Cache results for the top 100 queries to reduce latency and costs.
- **Monitor relevance changes**: After ranking rule changes, compare CTR before and after.
- **Revenue attribution**: Track which searches lead to purchases for ROI analysis.

## Architectural Decisions

Algolia's built-in analytics is a key differentiator from open-source options (Meilisearch, Typesense), which lack built-in analytics. This was a deliberate product decision — Algolia charges premium pricing for these features.

## Tradeoffs

- Built-in analytics are comprehensive but locked to Algolia.
- Self-hosted engines require custom analytics implementation (Laravel + Redis/DB).
- Algolia analytics cost is bundled with higher pricing tiers.

## Performance Considerations

- Analytics events are sent asynchronously — no impact on search query latency.
- Event volume does not affect search performance (separate ingest pipeline).
- High-volume analytics may incur additional API costs on usage-based plans.

## Production Considerations

- **Enable `SCOUT_IDENTIFY`** in Scout config to associate searches with users.
- **Use the Insights API** for server-side click and conversion tracking.
- **Monitor zero-result queries** daily — these indicate indexing gaps.
- **Set up alerts** for significant changes in CTR or search volume.

## Common Mistakes

- Not enabling analytics — missing data for relevance optimization.
- Not tracking conversions — revenue impact of search cannot be measured.
- Ignoring zero-result queries — these represent lost user engagement.
- Expecting analytics from Scout without engine support (Scout does not add analytics to other engines).

## Failure Modes

- **Privacy compliance**: Analytics may collect PII. Ensure GDPR/CALM Act compliance.
- **Data staleness**: Analytics dashboard may have 1-2 hour delay for some metrics.
- **Event loss**: If analytics events are rate-limited, some user interactions may not be tracked.

## Ecosystem Usage

Essential for Algolia-based search implementations. Analytics data drives most relevance optimization decisions in production.

## Related Knowledge Units

- K018 (Algolia driver setup)
- K022 (Algolia A/B testing)

## Research Notes

Sources: Algolia docs, Laravel Scout docs. Algolia's analytics are the most comprehensive among Scout-supported engines. For Meilisearch and Typesense, analytics must be built custom — typically tracking queries to a Laravel + Redis pipeline.


## Mental Models

- **Instant Gratification**: Algolia's architecture is built around instant search results as the user types. Every millisecond is optimized for perceived performance.
- **Analytics Dashboard**: Algolia analytics are like having a magnifying glass on your search bar — you see exactly what users search for and whether they find it.

