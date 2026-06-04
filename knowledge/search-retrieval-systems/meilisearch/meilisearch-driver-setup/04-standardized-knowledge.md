| Metadata | |
|---|---|
| KU ID | K023 |
| Subdomain | dedicated-search-appliances |
| Topic | Meilisearch Driver Setup |
| Source | Meilisearch Docs / Scout |
| Maturity | Stable |

## Overview

Meilisearch is an open-source, fast, and relevant search engine that integrates with Laravel via Scout. Setup involves installing the Meilisearch server (self-hosted via Docker/binary or Meilisearch Cloud), installing the PHP SDK, configuring Scout's driver settings, and creating the first index. Meilisearch emphasizes instant search-as-you-type with minimal configuration.

## Core Concepts

- **Self-Hosted**: Run via Docker, binary, or Sail. Requires a dedicated server or container.
- **Cloud**: Meilisearch Cloud provides managed infrastructure (PaaS).
- **Scout Driver**: Set `SCOUT_DRIVER=meilisearch` and configure host/API key in `config/scout.php`.
- **API Key Management**: Master key (admin) vs search-only key (public).
- **First Index**: Meilisearch auto-creates indexes on first document addition.

## When To Use

- Self-hosted search with full control over infrastructure
- Applications needing instant search-as-you-type out of the box
- Cost-effective alternative to Algolia (open-source, no per-record pricing)
- Applications requiring high relevance with minimal configuration

## When NOT To Use

- Team lacks resources to self-host and maintain a search server
- Very small datasets (<1K records) where database engine is sufficient
- Applications needing complex custom ranking (Typesense offers more control)
- When managed Algolia's extensive analytics and insights are required

## Best Practices

1. **Pin Meilisearch version**: Avoid unexpected breaking changes by specifying version in Docker.
2. **Use environment-specific API keys**: Master key for admin, search-only key for frontend.
3. **Configure dump directory**: Enable automatic backups via Meilisearch dumps.
4. **Set up monitoring**: Track memory, CPU, and disk usage for self-hosted instances.
5. **Plan for scaling**: Monitor index size and add resources as needed.

## Architecture Guidelines

- Set `SCOUT_DRIVER=meilisearch` and `MEILISEARCH_HOST` and `MEILISEARCH_KEY` in `.env`.
- Configure index settings (filterable, sortable, searchable attributes) in `config/scout.php`.
- Use Docker Compose for local development: `sail sail:publish` includes Meilisearch.
- Meilisearch Cloud reduces operations burden for production deployments.

## Performance Considerations

- Sub-50ms search latency for typical datasets.
- Memory usage scales with index size — Meilisearch keeps most data in memory.
- Default configuration is optimized for instant search-as-you-type.
- Indexing speed: Meilisearch indexes at ~15K docs/second on modern hardware.

## Security Considerations

- Use master API key for admin operations only (config, index management).
- Use search-only API key for frontend search requests.
- Never expose the master key in client-side code.
- Enable TLS for all Meilisearch connections in production.
- Configure IP whitelisting for self-hosted instances.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using master key in frontend | Convenience | Unauthorized index manipulation | Use search-only key |
| No version pinning | Docker tag defaults to `latest` | Unexpected breaking changes | Pin to specific version |
| Not configuring filterable attrs | Unaware of requirement | Filters return empty results | Declare in scout.php |
| Forgetting dump schedule | Development focus | Data loss risk | Schedule Meilisearch dumps |

## Related Topics

- K030 (Meilisearch ranking rules)
- K024 (Meilisearch filterable/sortable attributes)
- K031 (Meilisearch custom ranking)
- K025 (Meilisearch typo tolerance)

## AI Agent Notes

- Meilisearch is the most popular self-hosted search engine in the Laravel ecosystem.
- Start with Docker for development, plan for cloud or dedicated server in production.
- For agents: use `meilisearch/meilisearch-php` SDK; configure index settings in scout.php; use search-only keys for public endpoints.

## Verification

- [ ] Meilisearch server running (Docker/binary/cloud)
- [ ] SCOUT_DRIVER=meilisearch configured
- [ ] Master + search-only API keys configured
- [ ] Index settings declared in scout.php
- [ ] Documents indexable and searchable
- [ ] Backup/dump strategy in place
