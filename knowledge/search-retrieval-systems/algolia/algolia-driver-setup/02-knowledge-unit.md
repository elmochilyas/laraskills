# Knowledge Unit: Algolia Driver Setup & Configuration

## Metadata

- **ID:** K018
- **Subdomain:** Dedicated Search Appliances
- **Source:** Algolia Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Production-ready cloud search

## Executive Summary

Algolia is a cloud-managed search-as-a-service platform. Its Scout driver provides the most mature and feature-rich integration among all engines. Setup requires an Algolia account, API credentials, and the `algolia/algoliasearch-client-php` package. Algolia handles infrastructure, scaling, and global distribution. Pricing is per-search-request, making it the most expensive but most turnkey option.

## Core Concepts

- **Cloud-Only**: No self-hosting option. Fully managed infrastructure across 70+ data centers.
- **API Credentials**: Requires `Application ID`, `Search-Only API Key`, and `Admin API Key`.
- **Instant Out-of-Box**: Typo tolerance, faceting, relevance ranking, and instant search work immediately.
- **Automatic Async Indexing**: Algolia's API always indexes asynchronously — documents are searchable within ~1 second of indexing.

## Internal Mechanics

Scout's Algolia engine wraps the official Algolia PHP SDK. Index operations use Algolia's `saveObject`, `deleteObject`, and `search` methods. The engine translates Scout's `where()` calls into Algolia's `filters` parameter. Index settings (searchableAttributes, faceting) are configured via `scout:sync-index-settings`. Algolia handles all infrastructure: indexing, search, relevance, and analytics.

## Patterns

- **Zero-ops search**: Ideal when the budget supports Algolia pricing.
- **Global applications**: Algolia's Distributed Search Network provides low-latency worldwide.
- **Business user tuning**: Algolia's dashboard allows non-developers to manage relevance.
- **Complex merchandising**: Pinned results, rules, and personalization for e-commerce.

## Architectural Decisions

Algolia's cloud-only architecture was a deliberate tradeoff: fully managed infrastructure in exchange for vendor lock-in. The Scout integration abstracts the SDK but does not reduce the pricing impact.

## Tradeoffs

| Factor | Algolia | Self-Hosted Alternative |
|---|---|---|
| Operations | Zero — fully managed | Requires server maintenance |
| Cost at scale | $0.50-1.00/1K requests + storage | Fixed infrastructure cost |
| Vendor lock-in | Complete | None (open source) |
| Features | Most mature (A/B testing, analytics, personalization) | Fewer built-in features |
| Global distribution | 70+ data centers | Self-managed |
| Data residency | Limited to Algolia regions | Full control |

## Performance Considerations

- Sub-50ms P99 latency for most queries at any scale.
- Global CDN with edge caching for commonly searched queries.
- Automatic index replication across data centers.
- Pricing scales with usage — high-volume applications face significant costs.

## Production Considerations

- **Log analytics early** — Algolia's analytics are a key differentiator.
- **Configure index settings** via `config/scout.php` and `scout:sync-index-settings`.
- **Use `SCOUT_IDENTIFY`** for user-specific analytics tracking.
- **Monitor usage** to avoid unexpected cost spikes.
- **Budget for scale** — 1M searches/month on 500K records costs ~$1,200+/month.

## Common Mistakes

- Not setting a budget cap — costs can scale unpredictably with usage.
- Using Algolia for internal tools where self-hosted is more cost-effective.
- Not configuring index settings — relying on defaults may produce poor relevance.

## Failure Modes

- **API rate limiting**: Exceeding plan limits causes throttling or extra charges.
- **Index settings drift**: Settings changed via dashboard are not reflected in version control.
- **Network dependency**: Search fails if Algolia is unreachable (rare but possible).

## Ecosystem Usage

Widely used in enterprise Laravel applications. Dominant in e-commerce, content platforms, and any application where search uptime and features justify cost.

## Related Knowledge Units

- K019 (Algolia index settings)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)
- K022 (Algolia A/B testing)

## Research Notes

Sources: Algolia docs, Laravel Scout docs, community benchmarks. Algolia remains the benchmark that all other Laravel search engines are compared against. Its InstantSearch UI components are the most mature. The primary reason teams migrate away is cost at scale.


## Mental Models

- **Instant Gratification**: Algolia's architecture is built around instant search results as the user types. Every millisecond is optimized for perceived performance.
- **Analytics Dashboard**: Algolia analytics are like having a magnifying glass on your search bar — you see exactly what users search for and whether they find it.

