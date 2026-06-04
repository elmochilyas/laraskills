| Metadata | |
|---|---|
| KU ID | ku-10 |
| Subdomain | vector-similarity-search |
| Topic | Multi-Vector Search |
| Source | Academic / Industry |
| Maturity | Emerging |

## Overview

Multi-vector search uses multiple embedding vectors per document (e.g., one per paragraph or sentence) to improve retrieval precision. ColBERT's late interaction scoring is a notable approach. Qdrant supports named vectors (multiple vectors per point). This enables querying different aspects of a document with different vectors.

## Core Concepts

- **Multi-Vector Documents**: Multiple embeddings per document (e.g., one per section)
- **ColBERT**: Late interaction model — query token interacts with document token embeddings
- **Named Vectors (Qdrant)**: Multiple named vectors per point, searchable independently
- **Averaged vs Pooled**: Combining multiple vectors into one (avg, max, weighted)
- **Use Cases**: Long documents, multi-aspect search, multi-modal (text + image)

## When To Use

- Long documents spanning multiple topics
- Multi-modal content (text + images)
- Multi-aspect search (query different dimensions)
- Precision-sensitive retrieval for RAG

## When NOT To Use

- Short documents (single embedding sufficient)
- Simple search use cases
- Latency-critical (multi-vector search is slower)
- Infrastructure constraints (more storage, more compute)

## Best Practices

1. **Start with single-vector**: Multi-vector adds significant complexity.
2. **Use named vectors (Qdrant)**: Built-in support for multi-vector per point.
3. **Consider late interaction**: ColBERT provides high-quality multi-vector retrieval.
4. **Benchmark against single-vector**: Ensure improvement justifies complexity.
5. **Plan for storage**: Multi-vector multiplies index storage requirements.

## Related Topics

- K048 (Qdrant vector search)
- K012 (Vector search metadata filtering)

## AI Agent Notes

- Multi-vector search is advanced — start with single-vector
- ColBERT offers best multi-vector quality but requires ML infrastructure
- For agents: recommend only when single-vector retrieval is insufficient

## Verification

- [ ] Multi-vector strategy chosen
- [ ] Named vectors configured (if Qdrant)
- [ ] Storage impact assessed
- [ ] Performance benchmarked against single-vector
- [ ] Latency measured
