| Metadata | |
|---|---|
| KU ID | ku-10 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Scout Index Configuration |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Scout index configuration in config/scout.php defines how models connect to search engines. Key settings: driver, queue, prefix, index-settings (engine-specific), and model-settings (Typesense schemas). The configuration is environment-aware via .env variables.

## Core Concepts

- **Driver Selection**: SCOUT_DRIVER env var picks the engine
- **Queue Mode**: 'queue' => true/false globally or per model
- **Index Prefix**: 'prefix' => '' for multi-environment index naming
- **Engine Credentials**: Host, key, and region per engine driver
- **Index Settings**: index-settings array for filterable/sortable/ranking config
- **Model Settings**: Engine-specific per-model schema/config

## When To Use

- Every Laravel Scout implementation
- Initial setup configuration
- Environment-specific settings (dev vs staging vs prod)

## When NOT To Use

- Default config works for development (customize for production)

## Best Practices

1. **Keep credentials in .env**: Never hardcode API keys.
2. **Use index prefix per environment**: prefix: env('SCOUT_PREFIX', 'dev_').
3. **Configure index-settings in code**: Version-controlled engine settings.
4. **Environment-specific config**: Disable queue for dev, enable for production.
5. **Run scout:sync-index-settings**: After config changes.

## Related Topics

- K001 (Searchable trait)
- K005 (toSearchableArray)
- K024 (Meilisearch settings)
- K019 (Algolia index settings)

## AI Agent Notes

- scout.php is the central configuration file for all Scout engines
- Environment-specific config prevents accidental cross-environment index issues
- For agents: use prefix, env vars, and scout:sync-index-settings in deploy

## Verification

- [ ] Driver configured via SCOUT_DRIVER
- [ ] Queue enabled for production
- [ ] Index prefix configured per environment
- [ ] Engine credentials in .env
- [ ] Index settings in code, not dashboard
- [ ] scout:sync-index-settings in deployment
