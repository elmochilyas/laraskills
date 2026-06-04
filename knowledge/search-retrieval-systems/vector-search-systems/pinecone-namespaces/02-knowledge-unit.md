# Knowledge Unit: Pinecone Namespaces (Multitenancy)

## Metadata

- **ID:** K057
- **Subdomain:** Vector Similarity Search
- **Source:** Pinecone Docs
- **Maturity:** Stable
- **Laravel Relevance:** Logical partitioning

## Executive Summary

Pinecone namespaces provide logical partitioning within a single index, enabling multitenant vector search. Each namespace is a subset of vectors within an index, searchable independently. Documents in one namespace are invisible to queries in another. Namespaces share the same index infrastructure but have separate vector collections.

## Core Concepts

- **Logical Partitioning**: Namespaces are not separate physical indexes — they share the same infrastructure.
- **Namespace-Scoped Operations**: Create, delete, list, and search within a namespace without affecting others.
- **No Cross-Namespace Search**: Queries return results only from the specified namespace.
- **Namespace per Tenant**: Typical pattern: one namespace per customer/tenant.

## Internal Mechanics

Pinecone stores namespace metadata alongside each vector. When searching with a namespace specified, Pinecone filters the ANN traversal to only consider vectors in that namespace. This is filter-aware (not post-filter) — the ANN algorithm only explores vectors from the specified namespace, ensuring correct results even with selective namespace filters.

## Patterns

- **Tenant isolation**: One namespace per customer. Queries scoped to the customer's namespace.
- **Environment separation**: `dev`, `staging`, `prod` namespaces within the same index.
- **Data category isolation**: Different namespaces for different content types.

## Architectural Decisions

Pinecone chose namespaces over separate indexes for multitenancy because it reduces management overhead (one index vs N indexes) and allows resource pooling. The tradeoff is weaker isolation — one tenant's write-heavy workload can affect another tenant's query latency.

## Tradeoffs

| Factor | Namespaces | Separate Indexes |
|---|---|---|
| Isolation | Logical (shared infra) | Physical (separate infra) |
| Management | Single index to manage | N indexes to manage |
| Resource sharing | Pooled (efficient) | Dedicated (costly) |
| Query interference | Possible (shared capacity) | None |

## Performance Considerations

- Namespace-filtered queries have similar latency to unfiltered queries (filter-aware ANN).
- Very selective namespaces (few vectors) may require more HNSW traversal to find enough results.
- Namespace metadata adds minimal overhead per vector.

## Production Considerations

- **Use namespace per tenant** for B2B applications.
- **Monitor per-namespace vector counts** — uneven distribution may impact performance.
- **Implement namespace management API** in your Laravel application for automatic provisioning.
- **Consider separate indexes** for tenants with vastly different data volumes or SLAs.

## Common Mistakes

- Storing tenant ID as metadata instead of using namespaces — post-filter over full index is slower and may miss results.
- Using too many namespaces (>100K) — may impact management API performance.
- Not cleaning up namespaces when tenants are deleted — metadata still exists.

## Failure Modes

- **Namespace not specified**: Query defaults to searching all namespaces (if namespace parameter is omitted).
- **Namespace deletion failure**: Deleting a namespace requires deleting all vectors in it.
- **Shared capacity contention**: One tenant's bulk write affects query latency for all tenants.

## Ecosystem Usage

Standard pattern for Pinecone-based multitenant applications. Preferred over separate indexes for most B2B use cases.

## Related Knowledge Units

- K056 (Pinecone vector database)
- K052 (Qdrant multitenancy)

## Research Notes

Source: Pinecone docs. Namespaces in Pinecone are analogous to Qdrant's payload-based filtering for multitenancy but are a first-class API concept. The namespace per-tenant pattern is the recommended approach for Pinecone multitenancy.


## Mental Models

- **Serverless Pool**: Pinecone's serverless model is like a taxi fleet — you pay per ride (per query/unit), not per car (per pod). Traffic surges are handled by the fleet.
- **Namespace as Folder**: Pinecone namespaces are like folders on a desktop. Each namespace has its own set of vectors, completely isolated from others in the same index.

