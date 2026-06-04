| Metadata | |
|---|---|
| KU ID | K018 |
| Subdomain | dedicated-search-appliances |
| Topic | Algolia Driver Setup & Configuration |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Overview

Algolia is a cloud-based search-as-a-service platform that integrates with Laravel via Scout. Setup involves creating an Algolia account, obtaining API keys (Application ID, Admin API Key, Search-Only API Key), installing the PHP SDK, configuring Scout's driver, and configuring index settings. Algolia provides built-in analytics, A/B testing, personalization, and AI-powered search features.

## Core Concepts

- **Cloud-Hosted**: No self-hosting — Algolia manages all infrastructure.
- **API Keys**: Application ID + Admin API Key (backend) and Search-Only API Key (frontend).
- **Index Configuration**: Settings like `searchableAttributes`, `attributesForFaceting`, `customRanking` configured in Algolia dashboard or via Scout config.
- **Per-Operation Pricing**: Billed based on records, search requests, and operations.
- **Built-in Analytics**: Search analytics, click tracking, and A/B testing included.

## When To Use

- Production applications needing zero search infrastructure management
- Applications requiring built-in analytics, A/B testing, and personalization
- High-traffic search with enterprise reliability requirements
- Feature-rich search including faceting, geo-search, and query rules
- Teams that want to focus on application logic, not search operations

## When NOT To Use

- Budget constraints (Algolia pricing scales with usage)
- Self-hosted requirements (data sovereignty, air-gapped environments)
- Very large catalogs (>100M records) where pricing becomes prohibitive
- Simple search needs where database or Meilisearch suffices

## Best Practices

1. **Use separate API keys**: Admin key for backend operations, search-only key for frontend.
2. **Configure index settings in code**: Use `config/scout.php` for version-controlled settings.
3. **Enable analytics**: Integrate `SCOUT_IDENTIFY` for user-identified search analytics.
4. **Set relevance tiers**: Use `searchableAttributes` order to define field importance.
5. **Plan for costs**: Monitor operations and set usage budgets.

## Architecture Guidelines

- Set `SCOUT_DRIVER=algolia` with `ALGOLIA_APP_ID`, `ALGOLIA_SECRET`, `ALGOLIA_SEARCH` in `.env`.
- Configure index-specific settings under `algolia.index-settings` in `config/scout.php`.
- Use Algolia dashboard for analytics exploration and A/B test management.
- Implement `Searchable` trait normally — Algolia specifics go in config, not model code.

## Performance Considerations

- Sub-10ms search latency globally via Algolia's CDN edge network.
- Write operations are eventually consistent (typically <3 seconds).
- Indexing throughput is highly scalable (handles bursts automatically).
- Search performance is consistent regardless of index size.

## Security Considerations

- Never expose Admin API Key in client-side code.
- Use Search-Only API Key for frontend JavaScript/Ajax calls.
- Algolia encrypts data at rest and in transit.
- Configure secured API keys for multi-tenant search with restricted access.

## Related Topics

- K019 (Algolia index settings)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)
- K022 (Algolia A/B testing)

## AI Agent Notes

- Algolia is the most feature-rich managed search option for Laravel.
- Pricing is usage-based — monitor operations to control costs.
- For agents: use search-only API key for public endpoints; configure index settings in scout.php for version control.

## Verification

- [ ] Algolia account created and configured
- [ ] API keys set in .env (app ID, admin, search)
- [ ] SCOUT_DRIVER=algolia configured
- [ ] Index settings declared in scout.php
- [ ] Documents indexable and searchable
- [ ] Analytics/click tracking enabled
