| Metadata | |
|---|---|
| KU ID | K050 |
| Subdomain | search-ux-and-analytics |
| Topic | Qdrant Payload Filtering |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant's payload filtering allows filtering vector search results by structured metadata stored alongside each vector. Payload filters use a rich expression language with must/should/must_not conditions, comparison operators, geo-polygons, and nested field matching. Critically, Qdrant applies filters during HNSW traversal (not post-filter), ensuring efficient filtered ANN even with restrictive conditions.

## Core Concepts

- **Payload**: JSON metadata attached to each stored point.
- **Filter Conditions**: Must (AND), should (OR), must_not (AND NOT).
- **Comparison Operators**: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`.
- **Geo Filters**: `$geo_radius`, `$geo_polygon`, `$geo_boundingbox`.
- **Nested Filters**: Filter on nested JSON structures with `$has_id`, `$has_vector`.
- **Condition Types**: Match values, ranges, geo, existence, and nested conditions.

## When To Use

- Any vector search with structured metadata (category, status, price, location)
- Multi-tenant isolation via tenant_id filter
- Geo-spatial filtering with built-in geo operators
- Combining vector similarity with traditional query filters

## When NOT To Use

- Pure vector search without metadata filtering (payload adds overhead)
- Very small datasets where post-filtering is acceptable
- When the payload is very large (impacts index performance)
- Non-Qdrant vector databases (use their respective filtering)

## Best Practices

1. **Use must conditions for AND semantics**: Most common — all conditions must match.
2. **Use should for OR semantics**: At least one condition must match.
3. **Use must_not for exclusions**: Exclude specific values from results.
4. **Create payload indexes**: Index frequently filtered fields (tenant_id, category).
5. **Keep payload lean**: Only store metadata needed for filtering, not large content.

## Architecture Guidelines

- Store filterable metadata in point payload during upsert.
- Build payload indexes on frequently filtered fields.
- Apply filters in search query alongside vector similarity.
- Filters are integrated with HNSW — no separate filtering step.

## Performance Considerations

- Payload-filtered HNSW is more efficient than post-filtering.
- Payload indexes speed up filtered queries significantly.
- Large payload values (strings >1KB) increase index size.
- Complex nested filters add marginal overhead.

## Related Topics

- K048 (Qdrant vector search)
- K052 (Qdrant multitenancy)
- K058 (Pinecone metadata filtering)

## AI Agent Notes

- Qdrant payload filtering is integrated with ANN search for efficiency.
- Create payload indexes on filtered fields for performance.
- For agents: store filterable metadata as payload; create payload indexes; use must/should/must_not conditions.

## Verification

- [ ] Filterable metadata stored in point payload
- [ ] Payload indexes created on filtered fields
- [ ] Must/should/must_not conditions working correctly
- [ ] Geo filters functioning (if applicable)
- [ ] Filter performance benchmarked
