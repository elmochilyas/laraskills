| Metadata | |
|---|---|
| Knowledge Unit ID | ku-02 |
| Subdomain | dedicated-search-appliances |
| Topic | Typesense Setup |
| Source | Typesense Docs / Scout |
| Maturity | Stable |

## Overview

Typesense is an open-source, C++-based search engine with a RAM-first architecture, offering sub-50ms query latency, built-in vector search, and high-availability clustering via Raft consensus. Its Scout driver requires a running Typesense instance and the 	ypesense/typesense-php package. Typesense requires explicit collection schemas but offers fine-grained control over search behavior.

## Core Concepts

- **RAM-First**: Entire index must fit in RAM for optimal performance.
- **Schema-Enforced**: Collections require explicit field type definitions before indexing.
- **Raft Clustering**: Built-in multi-node HA with automatic failover (3+ nodes).
- **High Performance**: Written in C++ — fastest raw query speed among open-source options.
- **Collection Schema Migration**: Field additions require collection recreation and alias swap.

## When To Use

- High-traffic e-commerce requiring best-in-class performance
- HA-required production applications
- Predictable resource-based pricing vs Algolia's per-query model
- Applications needing field-level relevance control and schema enforcement

## When NOT To Use

- Dataset exceeds available RAM with no budget for more memory
- Schema-less rapid prototyping and iterative development
- Teams without deployment scripting for alias swap migrations
- Applications needing disk-based storage for datasets > RAM

## Best Practices

1. **Ensure dataset fits in RAM** with 2x headroom (index size × 2).
2. **Use alias swap for schema migrations** — plan in deployment scripts.
3. **Configure minimum 3 nodes** for Raft consensus and HA.
4. **Declare all fields in 	oSearchableArray()** within the collection schema.
5. **Monitor RAM usage** at 75% of available RAM for proactive alerts.
6. **Cast id to string** — Typesense requires string IDs.

## Architecture Guidelines

- Deploy via Docker or binary with --api-key and --data-dir flags
- Use Typesense Cloud for managed infrastructure
- Schema changes require: create new collection → copy data → swap alias → drop old
- Separate collections per model/index in Scout configuration
- Each node must hold full index; queries distribute across nodes

## Performance Considerations

- Query latency: sub-10ms for indexes that fit in RAM
- Dataset must fit in RAM — hard scaling limit
- 2x the index size in RAM recommended for headroom
- Multi-node clustering distributes read load but each node must hold full index
- Schema enforcement adds write-time validation overhead

## Security Considerations

- API keys: Master API key for admin, search-only API keys for frontend
- Enable TLS in production for data-in-transit encryption
- Typesense does not encrypt data at rest; use encrypted filesystems
- Use environment variables for API keys, never hardcode

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| OOM crash | Index exceeds RAM | Instance unavailable | Monitor RAM at 75% threshold |
| No schema migration plan | Field additions needed | Collection recreation required | Use alias swap pattern |
| Missing field in schema | Incomplete toSearchableArray | Fields not indexed silently | Validate schema vs model |
| id not cast to string | PHP integer default | Typesense schema error | Cast to string in model |

## Anti-Patterns

- **Treating RAM as infinite**: Always calculate index size before production
- **In-place schema modification**: Typesense requires collection recreation
- **Single-node in production Losing HA benefits of Raft clustering
- **Ignoring alias management**: Stale aliases cause query routing failures

## Examples

`php
// config/scout.php model-settings
'model-settings' => [
    \App\Models\Product::class => [
        'collection-schema' => [
            'fields' => [
                ['name' => 'id', 'type' => 'string'],
                ['name' => 'title', 'type' => 'string'],
                ['name' => 'price', 'type' => 'float'],
                ['name' => 'category', 'type' => 'string[]'],
            ],
            'default_sorting_field' => 'price',
        ],
    ],
],
`

## Related Topics

- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K036 (Typesense vector search)
- K037 (Typesense geo-search)
- K039 (Typesense synonym management)

## AI Agent Notes

- Typesense grew significantly in 2024-2026 as an Algolia alternative
- Key differentiators: HA clustering, field-level relevance control, RAM-first performance
- Typesense Cloud: +/month resource-based pricing
- For agents: schema-first approach requires upfront planning

## Verification

- [ ] Can start a Typesense instance via Docker
- [ ] Collection schema defined for at least one model
- [ ] Scout driver configured and connecting
- [ ] Can import documents via scout:import
- [ ] Can filter and sort on declared attributes
- [ ] Schema migration (alias swap) tested in staging
