| Metadata | |
|---|---|
| KU ID | ku-12 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search Metadata Filtering |
| Source | pgvector / Qdrant / Pinecone docs |
| Maturity | Stable |

## Overview

Metadata filtering in vector search constrains results by structured attributes (category, price range, date, tenant). Methods: pre-filtering (apply filter before ANN), post-filtering (apply after ANN), and filtered ANN (filter integrated into index traversal). The choice affects recall and performance.

## Core Concepts

- **Pre-filtering**: Apply metadata WHERE before vector ORDER BY. Narrows search space.
- **Post-filtering**: Vector search first, then remove results not matching filter.
- **Filtered ANN**: Vector search with mandatory filter — most efficient.
- **Iterative Search**: Start strict, relax if insufficient results.
- **Index Filtering**: Some engines (Qdrant, Pinecone) support indexed metadata fields.

## When To Use

- Multi-tenant search (filter by tenant ID)
- E-commerce (category, price range, brand)
- Content platforms (date range, author, tags)
- Any structured data alongside vector search

## When NOT To Use

- No metadata to filter on
- Very small datasets (filtering overhead not justified)
- All results should be visible (no access control)

## Best Practices

1. **Prefer pre-filtering**: Better performance for selective filters.
2. **Use filtered ANN**: Most efficient — filter during index traversal.
3. **Index filterable metadata**: B-tree or GIN indexes on filter fields.
4. **Implement iterative search**: Start strict, relax filter progressively.
5. **Monitor filter selectivity**: Highly selective filters may cause empty results.

## Related Topics

- K050 (Qdrant payload filtering)
- K058 (Pinecone metadata filtering)
- K046 (pgvector iterative scans)

## AI Agent Notes

- Pre-filtering is preferred for performance (reduces search space)
- Iterative search prevents empty results from over-filtering
- For agents: pre-filter + iterative search is the standard pattern

## Verification

- [ ] Filter strategy chosen (pre/post)
- [ ] Filtered ANN queries working
- [ ] Index on filter fields
- [ ] Iterative search implemented
- [ ] Empty results from filters handled
- [ ] Selectivity monitored
