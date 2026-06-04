| Metadata | |
|---|---|
| KU ID | K033 |
| Subdomain | dedicated-search-appliances |
| Topic | Typesense Driver Setup |
| Source | Typesense Docs / Scout |
| Maturity | Stable |

## Overview

Typesense is an open-source, high-performance search engine that integrates with Laravel via a community Scout driver. Setup involves installing the Typesense server (self-hosted via Docker/binary or Typesense Cloud), installing the PHP SDK, configuring Scout's driver, and defining collection schemas. Typesense offers more granular control over ranking and search parameters compared to Meilisearch.

## Core Concepts

- **Self-Hosted/Cloud**: Run via Docker, binary, or Typesense Cloud managed service.
- **Scout Driver**: Community package `typesense/typesense-php` + Scout configuration.
- **Collection Schemas**: Unlike Meilisearch, Typesense requires explicit schema definitions before indexing.
- **API Key Authentication**: Master key (admin) and search-only key (public).
- **PHP SDK**: `typesense/typesense-php` provides the HTTP client for Scout integration.

## When To Use

- Self-hosted search with granular control over indexing and ranking
- Applications needing built-in vector search alongside full-text
- Projects requiring strong schema control and explicit field definitions
- Cost-effective scalable alternative to Algolia

## When NOT To Use

- Team lacks resources to self-host and maintain infrastructure
- Need for instant, zero-configuration search (Meilisearch is simpler)
- Very small datasets where database engine is sufficient
- When managed Algolia's analytics ecosystem is required

## Best Practices

1. **Define schemas before indexing**: Typesense requires pre-defined collection schemas.
2. **Use environment-specific API keys**: Master for admin, search-only for frontend.
3. **Pin Typesense version**: Avoid breaking changes by specifying version.
4. **Configure snapshots**: Enable automatic snapshots for disaster recovery.
5. **Monitor memory usage**: Typesense keeps indexes in memory for fast search.

## Architecture Guidelines

- Set `SCOUT_DRIVER=typesense` with `TYPESENSE_HOST`, `TYPESENSE_API_KEY`, `TYPESENSE_PORT` in `.env`.
- Define collection schemas in `config/scout.php` under `typesense.model-settings`.
- Use Docker Compose for local development.
- Typesense Cloud reduces operations burden for production.

## Performance Considerations

- Sub-10ms search latency for typical workloads.
- All indexes are memory-mapped — RAM sizing is critical.
- Schema validation happens at index time; query time is optimized.
- Supports concurrent search with thousands of QPS on modest hardware.

## Security Considerations

- Use master API key only for schema management and admin operations.
- Use search-only API key for public search endpoints.
- Enable TLS for all Typesense connections.
- Configure IP restrictions for self-hosted instances.

## Related Topics

- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K036 (Typesense vector search)
- K040 (Typesense typo tolerance)

## AI Agent Notes

- Typesense offers more granular control than Meilisearch but requires more upfront configuration.
- Schema must be defined before indexing — unlike Meilisearch's auto-schema.
- For agents: define schemas in scout.php, use search-only keys for public endpoints, monitor memory usage.

## Verification

- [ ] Typesense server running (Docker/binary/cloud)
- [ ] SCOUT_DRIVER=typesense configured
- [ ] Collection schemas defined in scout.php
- [ ] API keys configured (master + search-only)
- [ ] Documents indexable and searchable
- [ ] Snapshot/backup strategy in place
