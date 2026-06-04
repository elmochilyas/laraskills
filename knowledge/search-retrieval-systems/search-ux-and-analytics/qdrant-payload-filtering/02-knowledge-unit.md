# Knowledge Unit: Qdrant Payload Filtering

## Metadata

- **ID:** K050
- **Subdomain:** Search UX & Analytics
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** Structured metadata filtering

## Executive Summary

Qdrant payload filtering allows combining vector similarity search with structured metadata filtering using a rich expression language. Payloads are JSON objects attached to each vector point. Filters support comparison, range, nested object, and geolocation conditions, and are applied during HNSW traversal (not as post-filter), ensuring correct results even with selective filters.

## Core Concepts

- **Payload**: Arbitrary JSON metadata attached to each vector point.
- **Filter Conditions**: Comparison (`match`, `range`), geo (`geo_radius`, `geo_bounding_box`), nested (`nested`), and composite (`must`, `should`, `must_not`).
- **Filter-Aware ANN**: Qdrant applies filters during HNSW traversal, not after. Avoids the "empty results with filter" problem.
- **Payload Index**: Create indexes on frequently filtered fields for faster filtering.
- **Geo Payload**: Geolocation data stored in payload for geo-filtering.

## Internal Mechanics

Qdrant stores payloads alongside vectors in its segment-based storage. When a search query includes a filter, Qdrant's HNSW traversal checks the filter condition for each candidate. If the condition is not met, the candidate is skipped and the traversal continues to the next nearest neighbor. This continues until enough matching candidates are found. Payload indexes accelerate the condition checking for frequently filtered fields.

## Patterns

- **Tenant isolation**: Filter by `tenant_id` in every query for multitenancy.
- **Time-range filtering**: Filter by `created_at` timestamp range.
- **Category + tag filtering**: Combine multiple filter conditions.
- **Geo-restricted search**: Filter by location radius.

## Architectural Decisions

Qdrant's filter-aware ANN is a key differentiator from Pinecone (which applies filters post-ANN). This ensures correct results regardless of filter selectivity — no risk of returning zero results when matching vectors exist.

## Tradeoffs

- Filter-aware ANN is correct but may be slower than post-filter for non-selective filters.
- Rich filter expressions add complexity compared to simple key-value filtering.
- Payloads increase storage size per vector.

## Performance Considerations

- Filter-aware ANN performance degrades with very selective filters (matching <1% of vectors).
- Payload indexes on filter fields significantly improve performance.
- Complex filters (nested, multiple conditions) add evaluation overhead.
- Geo-distance calculations add microseconds per candidate.

## Production Considerations

- **Create payload indexes** on fields used in frequent filters.
- **Use `must`** (AND) conditions for necessary filters, `should` (OR) for optional filters.
- **Monitor filter selectivity** — very selective filters may increase query latency.
- **Consider denormalization**: Store frequently filtered fields as top-level payload keys.

## Common Mistakes

- Not creating payload indexes on filtered fields — slower filter evaluation.
- Using deeply nested payload structures that are slow to query.
- Expecting Scout to abstract Qdrant filters — Scout's `where()` is not compatible.
- Applying filters in application code instead of using Qdrant's filter-aware ANN.

## Failure Modes

- **Slow queries with selective filters**: Must raise `ef_search` to find enough candidates under filter.
- **Payload size bloat**: Large payloads increase storage and slow down query responses.
- **Index mismatch**: Payload index on wrong field type causes query errors.

## Ecosystem Usage

Essential for any Qdrant production deployment. Payload filtering is the primary mechanism for scoping vector search results.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K052 (Qdrant multitenancy)
- K058 (Pinecone metadata filtering)

## Research Notes

Source: Qdrant docs. Qdrant's filter expression language is the most powerful among vector databases, supporting compound conditions, nested field access, geo, and array operations. The filter-aware traversal is inherited from Qdrant's HNSW implementation.


## Mental Models

- **Payload as Passport**: Qdrant treats vector search as identity verification and payload filtering as passport checks. A vector finds candidates, then payload filters validate their credentials.
- **Storage Engine**: Qdrant's HNSW index is like a skip list in high-dimensional space — you navigate through layers of increasing precision to find nearest neighbors.

