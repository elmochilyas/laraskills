| Metadata | |
|---|---|
| KU ID | ku-07 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Scout Engine Integration |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Scout's engine integration layer connects Laravel models to search backends. Built-in engines: database (MySQL/PostgreSQL FTS), collection (in-memory), Meilisearch, Typesense, Algolia. Custom engines extend Laravel\Scout\Engines\Engine. The Scout::extend() method registers custom engines.

## Core Concepts

- **Engine Interface**: Laravel\Scout\Engines\Engine abstract class (8 required methods)
- **Driver Config**: SCOUT_DRIVER env var selects engine
- **Per-Model Engine**: searchableUsing() for model-specific engine
- **Engine Registration**: Scout::extend('name', fn()) in service provider
- **Settings Sync**: scout:sync-index-settings for engine-specific config

## When To Use

- Default engine integrations for standard use cases
- Custom engine for unsupported backends (Elasticsearch, OpenSearch)
- Multi-engine architecture (different models → different engines)

## When NOT To Use

- Engine already provides needed features
- Community package exists for the backend

## Best Practices

1. **Use built-in engines first**: Meilisearch, Typesense, Algolia cover most needs.
2. **Abstract engine selection**: Use env var, not hardcoded.
3. **Test engine switching**: Ensure Scout abstraction works before relying on it.
4. **Document engine-specific features**: Scout abstraction has limits.

## Related Topics

- K014 (Custom engine development)
- K023 (Meilisearch engine)
- K033 (Typesense engine)
- K018 (Algolia engine)

## AI Agent Notes

- Built-in engines cover most Laravel search needs
- Custom engines are rarely needed — community packages exist for most backends
- For agents: prefer built-in engines, use community packages as second choice

## Verification

- [ ] Engine configured via SCOUT_DRIVER
- [ ] Engine-specific settings synced
- [ ] Per-model engine selection working (if multi-engine)
- [ ] Engine switching tested
- [ ] Engine-specific features documented
