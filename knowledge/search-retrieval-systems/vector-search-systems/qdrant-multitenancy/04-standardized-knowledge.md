| Metadata | |
|---|---|
| KU ID | K052 |
| Subdomain | vector-similarity-search |
| Topic | Qdrant Multitenancy |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant supports multitenancy through partitioned collections. Instead of creating separate collections per tenant, Qdrant recommends using a single collection with a tenant-ID payload field and payload filtering at query time. This approach is more resource-efficient than per-tenant collections and leverages Qdrant's filter-native ANN search.

## Core Concepts

- **Payload-Based Partitioning**: Store tenant_id in document payload, filter at query time.
- **Single Collection, Many Tenants**: One collection with tenant-aware filtering.
- **Filter-Integrated ANN**: Qdrant applies payload filters during HNSW traversal (not post-filter).
- **Isolation**: Each tenant only sees their own data through mandatory payload filters.
- **Scalability**: Single collection scales better than many small collections (better segment merging).

## When To Use

- Multi-tenant SaaS applications with vector search
- Any application where documents belong to different tenants/organizations
- Scenarios requiring tenant isolation with efficient resource utilization
- Applications already using Qdrant for single-tenant vector search

## When NOT To Use

- Per-tenant data must be physically separated (compliance requirements)
- Very few tenants with very large per-tenant datasets (consider per-tenant collections)
- Different vector dimensions or distance metrics per tenant
- When using a single-tenant application (no multitenancy needed)

## Best Practices

1. **Always include tenant_id filter**: Enforce tenant isolation at the application layer.
2. **Use payload index on tenant_id**: Index tenant_id for faster filtered searches.
3. **Prefer single collection**: More efficient than per-tenant collections for most multi-tenant workloads.
4. **Test filter selectivity**: Qdrant filters during HNSW traversal — ensure tenant_id is highly selective.
5. **Consider per-tenant collections for compliance**: If data must be physically separated, use per-tenant collections.

## Architecture Guidelines

- Include `tenant_id` in every point's payload during indexing.
- Enforce tenant filtering in all search queries: `filter: { must: [{ key: "tenant_id", match: { value: tenant()->id } }] }`.
- Create a payload index on `tenant_id` for efficient filtering.
- For per-tenant collection approach, use tenant-specific collection names from the application.

## Performance Considerations

- Filter-integrated ANN is more efficient than post-filter pruning.
- Tenant filtering adds minimal overhead when the filter is selective.
- Payload indexes on tenant_id speed up filtered searches.
- Single collection with many tenants is more resource-efficient than many small collections.

## Related Topics

- K048 (Qdrant vector search)
- K050 (Qdrant payload filtering)
- K057 (Pinecone namespaces)

## AI Agent Notes

- Qdrant's recommended multi-tenancy approach is payload-based, not collection-based.
- Always enforce tenant_id filter at the application level to prevent cross-tenant data leaks.
- For agents: use payload filtering with indexed tenant_id; prefer single collection for most workloads.

## Verification

- [ ] Tenant ID stored in every point's payload
- [ ] Tenant filtering enforced in all search queries
- [ ] Payload index on tenant_id created
- [ ] Cross-tenant isolation tested
- [ ] Per-tenant vs single-collection decision documented
