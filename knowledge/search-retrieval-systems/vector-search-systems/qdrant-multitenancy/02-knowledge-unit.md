# Knowledge Unit: Qdrant Multitenancy

## Metadata

- **ID:** K052
- **Subdomain:** Vector Similarity Search
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** Partitioned collections

## Executive Summary

Qdrant supports multitenancy through partitioned collections and payload-based filtering. Each tenant can have an isolated collection (strong isolation) or share a collection with tenant IDs in the payload (shared storage, filtered access). The choice between approaches depends on isolation requirements, total data volume, and per-tenant vector counts.

## Core Concepts

- **Collection Per Tenant**: Each tenant gets their own collection. Strongest isolation. Best when tenants have many vectors.
- **Payload-Based Filtering**: Single collection with `tenant_id` in payload. Queries include `tenant_id` filter. Weaker isolation, lower overhead.
- **Seeder Patterns**: Qdrant provides a seeder for controlled parallel segment optimization per partition.
- **Segment Isolation**: Write operations to one partition don't block reads from others.

## Internal Mechanics

With collection-per-tenant, each collection has independent HNSW indexes and segment optimizations. Operations are isolated — one tenant's indexing doesn't affect another's query latency. With payload-based filtering, all vectors share the same index. Queries include a payload filter on `tenant_id`. Qdrant applies the filter during HNSW traversal (filter-aware ANN), preventing the "empty results with filter" problem.

## Patterns

- **Collection per tenant**: 100+ vectors per tenant, strong isolation needed, SLAs per tenant.
- **Payload-based filtering**: Few vectors per tenant, 1000+ tenants, weaker isolation acceptable.
- **Hybrid**: Use collection-per-tenant for large tenants, payload-based for small/long-tail tenants.

## Architectural Decisions

Qdrant provides both approaches because multitenancy requirements vary widely. Collection-per-tenant mirrors database sharding. Payload-based filtering mirrors row-level security. The appropriate choice depends on tenant scale and isolation requirements.

## Tradeoffs

| Factor | Collection Per Tenant | Payload-Based |
|---|---|---|
| Isolation | Strong (separate indexes) | Weak (shared index) |
| Management overhead | Higher (many collections) | Lower (one collection) |
| Query performance | Isolated per tenant | May be affected by other tenants |
| Scaling limit | Thousands of collections | Single collection size limit |

## Performance Considerations

- Collection-per-tenant: Each collection has fixed overhead. Qdrant handles thousands of collections efficiently.
- Payload-based filtering: Filter-aware HNSW ensures filters don't cause empty results, but selective filters require more HNSW traversal.
- Segment optimization: Many small collections optimize faster than one large collection.

## Production Considerations

- **Use collection-per-tenant** when tenant vector counts are large (>10K) or isolation is critical.
- **Use payload-based filtering** when there are many tenants with few vectors each.
- **Set a naming convention** for per-tenant collections: `{tenant_id}_vectors`.
- **Monitor collection count** — very large numbers of collections (10K+) may impact management operations.

## Common Mistakes

- Using collection-per-tenant for thousands of tenants with <10 vectors each — management overhead exceeds benefits.
- Using payload-based filtering without a B-tree-like index on `tenant_id` — Qdrant supports payload indexing.
- Not cleaning up collections when tenants are deleted — orphaned collections waste resources.

## Failure Modes

- **Collection limit**: Qdrant has practical limits on the number of collections (varies by version).
- **Filter selectivity**: Very selective `tenant_id` filters may cause iterative scan exhaustion.
- **Operational complexity**: Managing thousands of collections requires automation.

## Ecosystem Usage

Common in B2B SaaS applications where each customer (tenant) has their own searchable data.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K050 (Qdrant payload filtering)
- K057 (Pinecone namespaces)

## Research Notes

Source: Qdrant docs. Qdrant's multitenancy approach is more flexible than Pinecone (namespaces only) and similar to pgvector's row-level filtering. The collection-per-tenant approach requires management tooling for automated creation/deletion.


## Mental Models

- **Payload as Passport**: Qdrant treats vector search as identity verification and payload filtering as passport checks. A vector finds candidates, then payload filters validate their credentials.
- **Storage Engine**: Qdrant's HNSW index is like a skip list in high-dimensional space — you navigate through layers of increasing precision to find nearest neighbors.

