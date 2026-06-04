| Metadata | |
|---|---|
| KU ID | ku-12 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Typesense Scout Driver |
| Source | Laravel Scout / Typesense Docs |
| Maturity | Stable |

## Overview

The Typesense Scout driver connects Laravel models to Typesense. Requires 	ypesense/typesense-php package and running Typesense instance. Key features: schema-enforced collections, RAM-first performance, Raft-based HA clustering, fine-grained relevance control via query_by and query_by_weights.

## Core Concepts

- **Collection Schemas**: Defined in model-settings config section
- **Alias Swap**: Schema migrations require collection recreation + alias swap
- **Dynamic Parameters**: query_by, query_by_weights, 
um_typos via Scout callback API
- **Per-Model Settings**: Schemas defined per model in scout.php

## When To Use

- High-traffic applications needing sub-10ms latency
- HA clustering requirement
- Schema enforcement for data quality
- Field-level relevance control

## When NOT To Use

- Dataset exceeds available RAM
- Rapid schema iteration (schema changes require alias swap)
- Simple search needs (Meilisearch is simpler)

## Best Practices

1. **Define collection schemas**: Every field must be declared.
2. **Use alias swap for migrations**: Zero-downtime schema changes.
3. **Cast id to string**: Typesense requires string IDs.
4. **Use searchableUsing()**: For per-model engine selection.

## Related Topics

- K033 (Typesense driver setup)
- K034 (Collection schemas)
- K035 (Dynamic search parameters)

## Verification

- [ ] typesense/typesense-php installed
- [ ] Collection schemas defined in scout.php
- [ ] Alias swap strategy documented
- [ ] id cast to string in model
- [ ] Queries work with query_by and weights
