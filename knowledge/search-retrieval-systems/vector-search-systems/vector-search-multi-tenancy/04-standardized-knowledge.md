| Metadata | |
|---|---|
| KU ID | ku-15 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search Multi-Tenancy |
| Source | Qdrant / Pinecone / Industry |
| Maturity | Stable |

## Overview

Vector search multi-tenancy isolates vector data per tenant while sharing the same vector infrastructure. Strategies: per-tenant collections/indexes (complete isolation), shared collections with tenant ID filtering (efficient), and namespace partitioning (Pinecone namespaces, Qdrant payload-based).

## Core Concepts

- **Per-Tenant Collections**: Separate index per tenant. Complete isolation, higher cost.
- **Shared Collection + Filtering**: Single index, filter by tenant_id. Efficient, less isolated.
- **Namespaces (Pinecone)**: Logical partitioning within an index. Lightweight isolation.
- **Payload Filtering (Qdrant)**: Filter by tenant field during ANN search.
- **Tenant Key Configuration**: Pre-filtering by tenant ID in every search query.

## When To Use

- SaaS applications with tenant-isolated data
- Multi-organization search platforms
- Applications requiring strict data separation
- Shared vector infrastructure for cost efficiency

## When NOT To Use

- Single-tenant application
- Very few tenants (individual indexes are feasible)
- No explicit tenant data association

## Best Practices

1. **Use shared + filtering for most cases**: Best balance of cost and performance.
2. **Use per-tenant for strict isolation**: Compliance, security requirements.
3. **Pre-filter by tenant**: Most efficient for ANN search.
4. **Index tenant ID field**: Ensure fast pre-filtering.
5. **Monitor tenant balance**: One tenant's data volume shouldn't affect others.
6. **Plan for tenant growth**: Per-tenant approaches don't scale to thousands.

## Related Topics

- K052 (Qdrant multitenancy)
- K057 (Pinecone namespaces)
- K012 (Metadata filtering)

## AI Agent Notes

- Shared collection + filtering is the most common multi-tenancy approach
- Payload/namespace-based isolation is preferred over per-tenant collections
- For agents: use shared + tenant ID filtering for most SaaS applications

## Verification

- [ ] Multi-tenancy strategy chosen
- [ ] Tenant ID indexed for filtering
- [ ] Pre-filtering working for all queries
- [ ] Tenant isolation verified (no cross-tenant leaks)
- [ ] Tenant balance monitored
- [ ] Growth plan for tenant count
