| Metadata | |
|---|---|
| KU ID | K058 |
| Subdomain | search-ux-and-analytics |
| Topic | Pinecone Metadata Filtering |
| Source | Pinecone Docs |
| Maturity | Stable |

## Overview

Pinecone supports filtering vector search results by metadata stored alongside each vector. Metadata filters include exact match ($eq), numeric comparisons ($gte, $lte, $gt, $lt), array membership ($in, $nin), existence ($exists), and negation ($ne). Filters are applied during vector search (not post-filter), ensuring efficient filtered ANN even with restrictive filters.

## Core Concepts

- **Metadata Key-Value Pairs**: Stored per vector, can be strings, numbers, booleans, or arrays.
- **Filter Expressions**: JSON-like filter syntax using operator keywords.
- **Filter-Integrated ANN**: Pinecone applies filters during HNSW traversal.
- **Supported Operators**: $eq, $ne, $in, $nin, $gte, $gt, $lte, $lt, $exists.
- **Logical Operators**: $and, $or for combining multiple filter conditions.

## When To Use

- Filtering vectors by category, status, tenant ID, or other metadata
- Multi-tenant isolation via tenant_id filter
- Date-range filtering with $gte/$lte on timestamp metadata
- Combining semantic search with structured data filters

## When NOT To Use

- Very small datasets where post-filtering is acceptable
- When filtering on high-cardinality fields reduces efficiency
- Filtering on text content (use vector search for that)
- Non-Pinecone vector databases (use their respective filtering APIs)

## Best Practices

1. **Include metadata during upsert**: Store all filterable fields alongside vectors.
2. **Use $eq for exact matches**: Most efficient filter (category, status, tenant).
3. **Use $in for multi-value filters**: More efficient than multiple $eq OR conditions.
4. **Combine with namespaces**: Namespace + metadata filter for layered isolation.
5. **Benchmark filter impact**: Restrictive filters may slow queries (filter during HNSW).

## Architecture Guidelines

- Metadata is passed as a map during upsert: `vectors: [{id, values, metadata: {category: "electronics", price: 29.99}}]`.
- Filters in query: `filter: { category: { $eq: "electronics" }, price: { $gte: 10 } }`.
- Multiple conditions: `filter: { $and: [{ category: { $eq: "electronics" } }, { in_stock: { $eq: true } }] }`.
- Namespace + metadata: scope to namespace, then apply additional filters.

## Performance Considerations

- Filter-integrated ANN is more efficient than post-filter pruning.
- Highly restrictive filters may reduce HNSW traversal efficiency.
- Filtering on indexed metadata fields is faster than non-indexed fields.
- Filter complexity has a minor impact on query latency.

## Related Topics

- K056 (Pinecone managed vector database)
- K057 (Pinecone namespaces)
- K050 (Qdrant payload filtering)

## AI Agent Notes

- Pinecone metadata filtering is integrated with ANN search (not post-filter).
- Use $eq for efficient exact matches, $in for multi-value, $gte/$lte for range.
- For agents: include filterable metadata during upsert; apply filters in query; combine with namespaces for multi-tenancy.

## Verification

- [ ] Metadata stored with each upserted vector
- [ ] Filter queries return correctly filtered results
- [ ] $and/$or logical operators work for complex filters
- [ ] Filter performance benchmarked (with vs without filter)
- [ ] Namespace + metadata filter combination working
