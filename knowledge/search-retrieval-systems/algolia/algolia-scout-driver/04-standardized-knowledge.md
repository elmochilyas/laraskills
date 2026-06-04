| Metadata | |
|---|---|
| KU ID | ku-13 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Algolia Scout Driver |
| Source | Laravel Scout / Algolia Docs |
| Maturity | Stable |

## Overview

The Algolia Scout driver connects Laravel models to Algolia's cloud search service. Requires lgolia/algoliasearch-client-php package and Algolia account. Provides the most feature-rich Scout integration: built-in analytics, A/B testing, personalization, geo-search, and InstantSearch UI.

## Core Concepts

- **App ID + API Keys**: Application ID, Search-Only Key (frontend), Admin Key (backend)
- **Zero Infrastructure**: Fully managed by Algolia
- **Index Settings**: searchableAttributes, ttributesForFaceting, customRanking
- **Analytics**: Built-in via Algolia dashboard or Scout IDENTIFY
- **Geo-Search**: roundLatLng, roundRadius filters

## When To Use

- Enterprise search with budget for managed service
- Global applications (Algolia's 70+ data centers)
- Teams without ops for self-hosted search
- Applications needing built-in A/B testing and analytics

## When NOT To Use

- Cost-sensitive at scale (per-query pricing)
- Data residency requirements not supported by Algolia
- Internal tools (overkill and expensive)

## Best Practices

1. **Set budget cap**: Avoid cost surprises from traffic spikes.
2. **Configure settings in scout.php**: Version-controlled index config.
3. **Use SCOUT_IDENTIFY**: Enable user-specific analytics.
4. **Monitor usage**: Track search volume and costs monthly.
5. **Use Search-Only Key for frontend**: Never expose Admin Key.

## Related Topics

- K018 (Algolia driver setup)
- K019 (Index settings)
- K020 (Algolia analytics)

## Verification

- [ ] algolia/algoliasearch-client-php installed
- [ ] App ID and API keys configured
- [ ] Budget cap set in Algolia dashboard
- [ ] Index settings in code
- [ ] SCOUT_IDENTIFY integrated for analytics
- [ ] Admin key not exposed to frontend
