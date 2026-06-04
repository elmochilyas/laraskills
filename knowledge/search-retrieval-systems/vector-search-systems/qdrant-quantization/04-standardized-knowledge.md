| Metadata | |
|---|---|
| KU ID | K051 |
| Subdomain | vector-similarity-search |
| Topic | Qdrant Quantization |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant supports three quantization techniques to reduce memory footprint of vector indexes: scalar quantization (f32→i8), product quantization (compressing vectors into sub-vectors), and binary quantization (f32→binary). Each provides different memory reduction ratios with tradeoffs in recall accuracy. Quantization is essential for large-scale deployments where RAM is the primary cost driver.

## Core Concepts

- **Scalar Quantization**: Reduces float32 to int8 (4x memory reduction), minimal recall loss.
- **Product Quantization**: Compresses vectors into codebook-encoded sub-vectors (up to 8x reduction).
- **Binary Quantization**: Reduces float32 to binary (32x reduction), larger recall impact.
- **Quantization on Disk**: Qdrant stores quantized data on disk with on-the-fly decompression.
- **Rescoring**: Qdrant can rescore quantized results using original vectors for higher accuracy.

## When To Use

- Datasets exceeding available RAM
- Cost-sensitive deployments where reducing memory saves infrastructure costs
- Scalar quantization: default choice for most deployments (good accuracy/size balance)
- Binary quantization: very large datasets where some recall loss is acceptable
- Product quantization: when high compression is needed with moderate recall impact

## When NOT To Use

- Small datasets (<1M vectors) that fit in memory without quantization
- High-recall requirements (>99%) where every recall point matters
- Development/testing environments (unnecessary complexity)
- Applications already within memory budget

## Best Practices

1. **Start with scalar quantization**: Best balance of compression (4x) and recall preservation (>98%).
2. **Enable rescoring**: Use original vectors to rescore top-K quantized results.
3. **Benchmark recall impact**: Test quantization strategies against your dataset before production.
4. **Monitor recall degradation**: Set alerts for recall below acceptable thresholds.
5. **Consider hybrid approach**: Quantize older/cold vectors, keep recent vectors full-precision.

## Architecture Guidelines

- Configure per-collection via API or during collection creation.
- Scalar quantization: `quantization_config: { scalar: { type: "int8", always_ram: true } }`.
- Product quantization: `quantization_config: { product: { compression: "x4", always_ram: false } }`.
- Binary quantization: `quantization_config: { binary: { always_ram: false } }`.
- Enable rescoring: `search_params: { quantization: { rescore: true, oversampling: 2.0 } }`.

## Performance Considerations

- Scalar quantization: 4x RAM reduction, 0.5-2% recall loss, no query latency impact.
- Product quantization: 4-8x RAM reduction, 2-5% recall loss, slight latency increase for decompression.
- Binary quantization: 32x RAM reduction, 5-15% recall loss, requires oversampling for acceptable recall.
- Rescoring adds 10-20% query latency but recovers most recall loss.

## Related Topics

- K048 (Qdrant vector search)
- K042 (pgvector HNSW / IVFFlat indexing)
- K047 (pgvector binary quantization)
- K062 (Cross-encoder re-ranking)

## AI Agent Notes

- Scalar quantization is the recommended starting point — 4x memory reduction with negligible recall loss.
- Always benchmark quantization impact on your specific dataset before production.
- For agents: enable scalar quantization for any dataset >1M vectors; use rescoring to maintain recall.

## Verification

- [ ] Quantization strategy selected (scalar/product/binary)
- [ ] Quantization configured on Qdrant collection
- [ ] Memory reduction confirmed
- [ ] Recall benchmarked with quantization enabled
- [ ] Rescoring configured if needed
