| Metadata | |
|---|---|
| KU ID | ku-04 |
| Subdomain | relevance-and-ranking |
| Topic | Semantic Ranking Filters |
| Source | Industry |
| Maturity | Emerging |

## Overview

Semantic ranking filters apply metadata constraints (category, price, date, status) as pre-filters or post-filters alongside semantic search. Pre-filtering reduces the vector search space. Post-filtering removes results after retrieval. The choice affects recall, latency, and result quality.

## Core Concepts

- **Pre-filtering**: Apply metadata filters before vector search (narrows search space)
- **Post-filtering**: Apply metadata filters after vector search (removes from results)
- **Filtered ANN**: Vector search with mandatory filter conditions
- **Iterative Search**: Relax filter if insufficient results found

## When To Use

- E-commerce (filtered product search)
- Content platforms (filtered article search)
- Multi-tenant systems (tenant-scoped search)
- Any search with structured metadata constraints

## When NOT To Use

- No metadata to filter on
- Very small datasets (filtering overhead isn't justified)

## Best Practices

1. **Prefer pre-filtering**: Better performance and relevant results.
2. **Use iterative search**: Start strict, relax filter if too few results.
3. **Index filterable attributes**: Ensure metadata fields are indexed for fast filtering.
4. **Monitor filter selectivity**: Highly selective filters may eliminate all results.

## Related Topics

- K024 (Meilisearch filterable/sortable)
- K050 (Qdrant payload filtering)
- K058 (Pinecone metadata filtering)

## AI Agent Notes

- Pre-filtering is preferred for performance
- Iterative search handles the empty results problem

## Verification

- [ ] Filter strategy chosen (pre vs post)
- [ ] Filterable attributes indexed
- [ ] Iterative search implemented
- [ ] Empty results from filters handled
