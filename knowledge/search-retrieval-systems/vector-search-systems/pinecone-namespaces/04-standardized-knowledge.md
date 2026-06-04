| Metadata | |
|---|---|
| KU ID | K057 |
| Subdomain | vector-similarity-search |
| Topic | Pinecone Namespaces |
| Source | Pinecone Docs |
| Maturity | Stable |

## Overview

Pinecone namespaces provide logical partitioning within a single Pinecone index. Each namespace acts as an isolated segment for vector data, enabling multi-tenancy, environment separation, and data segmentation without creating multiple indexes. Queries are scoped to a namespace, ensuring data isolation while sharing the same index infrastructure.

## Core Concepts

- **Logical Partition**: Namespace isolates vectors within a single index.
- **Per-Query Scoping**: Each query specifies a namespace — results only return vectors from that namespace.
- **No Cross-Query Contamination**: Namespace A queries never see Namespace B data.
- **Shared Infrastructure**: All namespaces share the same index configuration, dimension, and metric.
- **Zero Overhead**: Namespaces add no additional cost beyond the base index.

## When To Use

- Multi-tenant vector search with data isolation per tenant
- Environment separation (dev/staging/prod) within a single index
- Content type segmentation (products vs articles vs users)
- A/B testing of different vector configurations within the same index
- Any scenario requiring data isolation without separate indexes

## When NOT To Use

- Data must be in completely separate indexes (different dimensions, metrics)
- Per-tenant vector search with very different data distributions
- When index-level isolation is required for compliance/auditing
- Very large datasets where per-namespace index tuning is needed

## Best Practices

1. **Include namespace in all operations**: Always specify namespace when upserting and querying.
2. **Use tenant ID as namespace**: `namespace: "tenant_{tenant()->id}"` for multi-tenant apps.
3. **Isolate environments**: Use different namespaces or prefixes for dev/staging/prod.
4. **Monitor per-namespace usage**: Track vector counts and query volume per namespace.
5. **Document namespace strategy**: Ensure team consistency in namespace naming.

## Architecture Guidelines

- Namespace is specified during upsert and query operations in the Pinecone API.
- Within Laravel, pass namespace via the Pinecone REST/gRPC client request.
- No namespace prefix or naming convention enforced by Pinecone — use a consistent convention.
- Consider index-level isolation for compliance; namespace-level for operational isolation.

## Performance Considerations

- Namespace filtering adds negligible query overhead.
- Query performance is consistent regardless of namespace count.
- Very many small namespaces (thousands) are less efficient than fewer larger ones.
- Namespace affects index distribution — data skew across namespaces may impact performance.

## Related Topics

- K056 (Pinecone managed vector database)
- K058 (Pinecone metadata filtering)
- K052 (Qdrant multitenancy)

## AI Agent Notes

- Namespaces are the primary multi-tenancy mechanism for Pinecone.
- Use tenant ID as namespace for SaaS applications.
- For agents: scope all queries to namespace; use consistent naming convention (e.g., `tenant_{id}`); prefer namespace-level isolation for most SaaS workloads.

## Verification

- [ ] Namespace strategy defined (tenant, environment, content type)
- [ ] All upserts include namespace
- [ ] All queries scoped to namespace
- [ ] Data isolation verified across namespaces
- [ ] Namespace naming convention documented and consistent
