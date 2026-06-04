| Metadata | |
|---|---|
| KU ID | ku-11 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Meilisearch Scout Driver |
| Source | Laravel Scout / Meilisearch Docs |
| Maturity | Stable |

## Overview

The Meilisearch Scout driver connects Laravel models to Meilisearch. Requires meilisearch/meilisearch-php package and running Meilisearch instance. Key features: schema-free indexing, instant search, typo tolerance, faceted search, custom ranking rules, and scout:sync-index-settings for index configuration.

## Core Concepts

- **Host + API Key**: Configured via MEILISEARCH_HOST and MEILISEARCH_KEY env vars
- **Schema-Free**: No schema declaration needed
- **Index Settings**: Filterable/sortable/ranking via config/scout.php
- **Settings Sync**: scout:sync-index-settings command

## When To Use

- Self-hosted or cloud Meilisearch instance available
- Applications needing instant search out of box
- Content sites, blogs, documentation platforms

## When NOT To Use

- HA clustering required without enterprise subscription
- Schema-enforced architecture preferred (use Typesense)

## Best Practices

1. **Use latest PHP SDK**: Keep meilisearch/meilisearch-php updated.
2. **Configure settings in scout.php**: Version control all index config.
3. **Run scout:sync-index-settings**: After every config change.
4. **Enable auth in production**: Set MEILI_MASTER_KEY.

## Related Topics

- K023 (Meilisearch driver setup)
- K024 (Filterable/sortable)
- K030 (Ranking rules)

## Verification

- [ ] meilisearch/meilisearch-php installed
- [ ] MEILISEARCH_HOST and KEY configured
- [ ] Settings synced via scout:sync-index-settings
- [ ] Authentication enabled
- [ ] Index settings in code
