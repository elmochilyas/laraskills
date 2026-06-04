| Metadata | |
|---|---|
| KU ID | ku-07 |
| Subdomain | relevance-and-ranking |
| Topic | Result Deduplication |
| Source | Industry |
| Maturity | Stable |

## Overview

Result deduplication removes duplicate or near-duplicate documents from search results to provide diverse, non-redundant results. Methods include exact field matching, fuzzy hash comparison, and embedding similarity clustering.

## Core Concepts

- **Exact Dedup**: Same document ID, URL, or content hash
- **Near-Dedup**: Similar content detected via simhash, MinHash, or embedding distance
- **Grouping**: Typesense's grouping feature; custom grouping by field
- **Diversity**: Ensuring results from same source don't dominate

## When To Use

- Content platforms with syndicated or republished content
- E-commerce with duplicate product listings (same product, different sellers)
- Aggregator sites pulling from multiple sources
- News sites with multiple articles on same story

## When NOT To Use

- Single-source content with unique documents
- Search where duplicates are meaningful (file system search)

## Best Practices

1. **Use Typesense grouping** for field-based dedup.
2. **Implement near-dedup** via embedding clustering for content similarity.
3. **Group by source domain** for content aggregators.
4. **Allow override** — sometimes duplicates are relevant.
5. **Monitor dedup rate**: Too aggressive removes useful results.

## Related Topics

- K038 (Typesense faceting/grouping)
- K002 (Vector similarity relevance)

## AI Agent Notes

- Typesense has built-in grouping for field-based dedup
- Near-dedup requires custom implementation (simhash or embeddings)
- For agents: start with field-based grouping, add near-dedup if needed

## Verification

- [ ] Dedup strategy chosen
- [ ] Field-based grouping working (Typesense)
- [ ] Near-dedup tested if needed
- [ ] Dedup rate monitored
- [ ] Override mechanism available
