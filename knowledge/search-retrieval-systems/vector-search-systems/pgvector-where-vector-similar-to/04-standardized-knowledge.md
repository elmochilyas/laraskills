| Metadata | |
|---|---|
| KU ID | ku-04 |
| Subdomain | vector-similarity-search |
| Topic | pgvector WHERE Vector Similar To |
| Source | pgvector docs |
| Maturity | Stable |

## Overview

pgvector provides operators for vector similarity search: cosine distance (<=>), L2 distance (<->), and inner product (<#>). Combined with ORDER BY ... LIMIT for nearest neighbor search. Filtered ANN supports pre-filtering with WHERE clauses and iterative index scans for strict ordering.

## Core Concepts

- **Cosine Distance**: <=> — 1 - cosine similarity. Range [0,2]. Most common.
- **L2/Euclidean Distance**: <-> — straight-line distance. Use for magnitude-sensitive search.
- **Inner Product**: <#> — dot product. Use with normalized vectors for cosine equivalence.
- **Exact Search**: ORDER BY embedding <=> '[vec]' LIMIT 10 (no index, exact, O(n))
- **ANN Search**: With HNSW/IVFFlat index (approximate, fast)
- **Filtered ANN**: WHERE category = 'electronics' ORDER BY embedding <=> '[vec]' LIMIT 10

## When To Use

- All pgvector similarity search operations
- Nearest neighbor queries for semantic search
- Filtered semantic search with metadata constraints

## When NOT To Use

- Need exact results with filters and high recall (use iterative index scan)
- Very small datasets (no index needed, exact search is fine)

## Best Practices

1. **Use cosine distance as default**: Works well with most embedding models.
2. **Normalize vectors**: Ensures cosine = dot product.
3. **Always LIMIT**: ANN without LIMIT is slow.
4. **Pre-filter before ORDER BY**: More efficient than post-filter.
5. **Use SET LOCAL ef_search**: Tune recall per query.

## Related Topics

- K041 (pgvector extension)
- K043 (Distance functions)
- K046 (Iterative index scans)

## AI Agent Notes

- Cosine distance (<=>) is the most common operator
- Filtered ANN enables hybrid vector + metadata queries
- For agents: use cosine, always LIMIT, pre-filter

## Verification

- [ ] Distance operator chosen correctly
- [ ] Query with ORDER BY + LIMIT works
- [ ] Filtered ANN working with WHERE
- [ ] ef_search tuned for recall/performance balance
- [ ] Vectors normalized for correct distance
