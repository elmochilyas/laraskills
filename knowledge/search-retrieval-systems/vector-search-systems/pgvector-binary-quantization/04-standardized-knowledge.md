| Metadata | |
|---|---|
| KU ID | K047 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Binary Quantization + Re-ranking |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector's binary quantization converts float32 vectors to binary representations (each dimension becomes a single bit based on the sign of the value). This reduces memory by 32x (1536-dim float32 = 6KB → binary = 48 bytes). An ANN index on the binary vectors provides fast candidate retrieval, then the original float32 vectors are used to re-rank the top candidates for accurate distance computation.

## Core Concepts

- **Binary Quantization**: Convert float32 to binary (1 bit per dimension) based on sign.
- **32x Compression**: 1536-dim float32 (6KB) → binary (48 bytes).
- **HNSW on Binary**: Build HNSW index on binary vectors for fast ANN search.
- **Re-ranking with Original**: Retrieve top-K candidates with binary HNSW, re-rank with float32.
- **Recall Recovery**: Re-ranking recovers most accuracy lost by quantization.

## When To Use

- Large-scale vector search where RAM is the limiting factor
- Datasets >10M vectors where float32 requires too much memory
- Cost-sensitive deployments where reducing memory saves infrastructure costs
- Applications where slightly reduced recall is acceptable with re-ranking recovery

## When NOT To Use

- Small datasets (<1M vectors) fitting in memory without compression
- High-recall requirements (>99%) where any quantization loss is unacceptable
- Applications requiring exact vector search
- When using embedding models that don't produce signed values (some normalized embeddings)

## Best Practices

1. **Always use re-ranking**: Binary ANN + float32 re-rank recovers most recall loss.
2. **Tune binary query parameters**: `binary_quantization.ef_search` and `binary_quantization.rescore`.
3. **Test with your embeddings**: Not all embedding models produce suitable binary representations.
4. **Monitor effective recall**: Compare binary + re-rank recall against float32 baseline.
5. **Consider halfvec first**: If 2x compression is sufficient, halfvec has better accuracy.

## Architecture Guidelines

- Convert to binary: `SELECT binary_quantize(embedding) FROM items;`
- Create HNSW index on binary column.
- Original float32 vectors stored in separate column (or same table).
- Query: binary ANN search → get candidate IDs → re-rank with original float32.

## Performance Considerations

- Binary HNSW index: 32x smaller, faster to search.
- Re-ranking adds overhead: 10-50ms for top-100 candidates.
- Total query time: binary ANN (1-2ms) + re-rank (10-50ms) = similar to float32 HNSW.
- Memory savings are significant: 10M vectors @ 1536-dim = ~60GB float32 vs ~2GB binary.

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K044 (pgvector half-precision)
- K051 (Qdrant quantization)

## AI Agent Notes

- Binary quantization is pgvector's most aggressive storage optimization (32x).
- Re-ranking with original float32 is essential to recover accuracy.
- For agents: use binary quantization + re-ranking for datasets >10M vectors; test with your embeddings first.

## Verification

- [ ] Binary quantized column created
- [ ] HNSW index on binary vectors built
- [ ] Re-ranking with original float32 implemented
- [ ] Effective recall measured vs float32 baseline
- [ ] Memory savings confirmed
