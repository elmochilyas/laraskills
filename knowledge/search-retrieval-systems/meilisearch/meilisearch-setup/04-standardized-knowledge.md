| Metadata | |
|---|---|
| Knowledge Unit ID | ku-01 |
| Subdomain | dedicated-search-appliances |
| Topic | Meilisearch Setup |
| Source | Meilisearch Docs / Scout |
| Maturity | Stable |

## Overview

Meilisearch is an open-source, Rust-based search engine that provides instant search-as-you-type, typo tolerance, faceted search, and relevance ranking out of the box. Its Scout driver requires a running Meilisearch instance (self-hosted or cloud) and the meilisearch/meilisearch-php package. Known for zero-configuration setup — index documents and search immediately with good default relevance.

## Core Concepts

- **Self-Hosted or Cloud**: Available as open-source (MIT) or managed cloud.
- **Schema-Free Indexing**: No schema declaration needed — Meilisearch infers field types automatically.
- **Instant Search**: Search-as-you-type works out of the box with no configuration.
- **Disk-Based Storage**: Uses LMDB for memory-mapped storage; dataset doesn't need to fit in RAM.
- **SSPL License Implication**: Core is MIT but enterprise features require commercial license.

## When To Use

- Quick setup needed with minimal configuration
- Content sites, blogs, documentation platforms
- Small to medium e-commerce with faceted filtering
- Prototyping and MVPs requiring instant search

## When NOT To Use

- High-availability clustering required in free tier (enterprise-only)
- Datasets exceeding 2TiB index size
- Complex schema control and field-level relevance required
- Multi-node replication without enterprise subscription

## Best Practices

1. **Enable authentication in production**: Always set a master key via MEILI_MASTER_KEY env var.
2. **Declare filterable/sortable attributes** before use via scout:sync-index-settings.
3. **Configure snapshotting**: LMDB snapshots ensure backup and recovery.
4. **Use queue for indexing**: Set 'queue' => true in Scout config for async sync.
5. **Run scout:sync-index-settings** in deployment pipeline.

## Architecture Guidelines

- Deploy via Docker: docker run -it -p 7700:7700 getmeili/meilisearch
- Configure environment variables: MEILI_MASTER_KEY, MEILI_ENV, MEILI_HTTP_ADDR
- Single-node for most deployments; cloud for multi-region
- Separate Meilisearch instances per environment (dev/staging/prod)

## Performance Considerations

- Sub-50ms query latency on typical SaaS datasets (<10M documents)
- LMDB storage allows datasets larger than RAM, but performance degrades when index exceeds available memory
- Embedding indexing is 7x faster since v1.38 (March 2026)
- 10-term limit per search query — complex queries may be truncated
- Index build time increases with document complexity and filterable attribute count

## Security Considerations

- **Never run without authentication in production**: Anyone can access the search API
- Use search-only API keys for frontend queries (not master key)
- Master key provides full admin access — keep it in server-side env vars
- Meilisearch does not encrypt data at rest by default; use encrypted volumes

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No auth in production | Skipping MEILI_MASTER_KEY setup | Public data exposure, API abuse | Always set master key |
| Forgetting to declare filterable attrs | Schema-free assumption | where() calls silently fail | Declare in scout.php config |
| Expecting free tier HA | Feature assumed included | No failover on node failure | Use cloud or enterprise tiers |
| Not syncing settings | Manual config only | Index settings not applied | Automate scout:sync-index-settings |

## Anti-Patterns

- **Treating Meilisearch as a primary database**: It's a search index, not data source of truth
- **Re-indexing every deployment**: Use incremental sync for production
- **Over-declaring filterable attributes**: Each increases index size and build time
- **Ignoring LMDB corruption risk**: Configure snapshots and backups

## Examples

`php
// config/scout.php
'meilisearch' => [
    'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
    'key' => env('MEILISEARCH_KEY', null),
],

// Model
class Post extends Model
{
    use Searchable;
    
    public function toSearchableArray()
    {
        return ['title' => ->title, 'body' => ->body, 'created_at' => ->created_at];
    }
}
`

## Related Topics

- K024 (Meilisearch filterable/sortable)
- K025 (Meilisearch typo tolerance)
- K027 (Meilisearch faceted search)
- K028 (Meilisearch hybrid search)
- K030 (Meilisearch ranking rules)

## AI Agent Notes

- Meilisearch is the most popular self-hosted search engine in Laravel ecosystem
- v1.38 (March 2026) brought significant embedding performance improvements
- License: MIT (core), commercial features under Enterprise tier
- Ideal for agents implementing search-first Laravel applications

## Verification

- [ ] Can start a Meilisearch instance via Docker
- [ ] Can connect Scout to Meilisearch via config
- [ ] Can add Searchable trait to a model
- [ ] Can run scout:import and verify indexed documents
- [ ] Can perform search queries and see results
- [ ] Can verify filterable/sortable attributes work
