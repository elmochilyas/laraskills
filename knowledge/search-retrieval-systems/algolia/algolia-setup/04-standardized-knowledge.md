| Metadata | |
|---|---|
| Knowledge Unit ID | ku-03 |
| Subdomain | dedicated-search-appliances |
| Topic | Algolia Setup |
| Source | Algolia Docs / Scout |
| Maturity | Stable |

## Overview

Algolia is a cloud-managed search-as-a-service platform. Its Scout driver provides the most mature and feature-rich integration among all engines. Setup requires an Algolia account, API credentials, and the lgolia/algoliasearch-client-php package. Algolia handles infrastructure, scaling, and global distribution. Pricing is per-search-request, making it the most expensive but most turnkey option.

## Core Concepts

- **Cloud-Only**: No self-hosting option. Fully managed across 70+ data centers.
- **API Credentials**: Application ID, Search-Only API Key, Admin API Key.
- **Instant Out-of-Box**: Typo tolerance, faceting, relevance ranking, instant search work immediately.
- **Automatic Async Indexing**: Documents searchable within ~1 second of indexing.
- **Distributed Search Network**: Global CDN with edge caching for low latency.

## When To Use

- Zero-ops search when budget supports Algolia pricing
- Global applications needing low-latency worldwide search
- Business users who need dashboard-based relevance tuning
- E-commerce with complex merchandising, rules, and personalization

## When NOT To Use

- Cost-sensitive applications at high query volumes
- Internal tools where self-hosted is more cost-effective
- Applications requiring data residency in unsupported regions
- Teams wanting full control over infrastructure and costs

## Best Practices

1. **Set a budget cap** to avoid unexpected cost spikes from traffic surges.
2. **Log analytics early** — Algolia's analytics are a key differentiator.
3. **Configure index settings via config/scout.php** and version control.
4. **Use SCOUT_IDENTIFY** for user-specific analytics tracking.
5. **Monitor usage monthly** — 1M searches/month on 500K records costs ~,200+/month.
6. **Use scout:sync-index-settings** for index configuration drift prevention.

## Architecture Guidelines

- One Algolia application per Laravel environment (dev/staging/prod)
- Use Search-Only API Key in frontend, Admin API Key server-side only
- Configure index settings in scout.php, not Algolia dashboard (for version control)
- Use within() method to search specific indexes
- Replicas for different sort orders within same data

## Performance Considerations

- Sub-50ms P99 latency at any scale on Algolia's network
- Global CDN with edge caching for commonly searched queries
- Automatic index replication across data centers
- Pricing scales with usage — high-volume faces significant costs
- Async indexing means documents are searchable within ~1 second

## Security Considerations

- **Never expose Admin API Key** in frontend code
- Use Search-Only API Key for browser/mobile requests
- Algolia encrypts data at rest (AES-256) and in transit (TLS)
- API keys can be restricted to specific indexes and operations
- Enable IP restriction for Admin API Key in production

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No budget cap | Assumes unlimited free tier | Unexpected cost spikes | Set billing alert at 80% |
| Using Algolia for low-traffic internal tools | Familiarity bias | Overpaying for search | Use database engine |
| Ignoring index settings in code | Dashboard-only config | Settings drift, no version control | Configure in scout.php |
| Exposing Admin API Key | Copy-paste mistake | Full account compromise | Use Search-Only in frontend |

## Anti-Patterns

- **Using Algolia as primary data store**: It's a search index, not database
- **Re-indexing full dataset on every deploy**: Use incremental or partial updates
- **Not testing with representative query volumes**: Pricing surprises at scale
- **Skipping analytics integration**: Losing key Algolia differentiator

## Examples

`php
// config/scout.php
'algolia' => [
    'id' => env('ALGOLIA_APP_ID', ''),
    'secret' => env('ALGOLIA_SECRET', ''),
],

// In controller with analytics
use Laravel\Scout\Scout;

Scout::identify(->user());
 = Product::search('laptop')->paginate(20);
`

## Related Topics

- K019 (Algolia index settings)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)
- K022 (Algolia A/B testing)

## AI Agent Notes

- Algolia remains the benchmark all Laravel search engines are compared against
- Primary reason teams migrate away: cost at scale
- Most mature integration: A/B testing, analytics, personalization built-in
- For agents: ideal for enterprise clients with budget; avoid for cost-sensitive projects

## Verification

- [ ] Algolia account created and API keys configured
- [ ] Scout driver connected with correct credentials
- [ ] Can import documents and see them in Algolia dashboard
- [ ] Instant search works with typo tolerance
- [ ] Analytics tracking set up with SCOUT_IDENTIFY
- [ ] Budget alerts configured in Algolia dashboard
