| Metadata | |
|---|---|
| KU ID | ku-07 |
| Subdomain | vector-similarity-search |
| Topic | Local Embedding Generation |
| Source | FastEmbed / sentence-transformers |
| Maturity | New |

## Overview

Local embedding generation runs embedding models on the application server (CPU or GPU), eliminating API costs and data privacy concerns. FastEmbed (ONNX-optimized) provides fast local embeddings. sentence-transformers offers higher quality but requires Python. Qdrant FastEmbed integration provides on-device embeddings with PHP SDK.

## Core Concepts

- **FastEmbed**: ONNX-optimized embedding models for local inference (CPU)
- **sentence-transformers**: Python library with best-quality open-source models
- **BGE Models**: BAAI/bge-* models — good quality/compute balance
- **ONNX Runtime**: Cross-platform inference engine for optimized model execution
- **Tradeoff**: Lower quality than API models but zero API cost and complete privacy

## When To Use

- High-volume embedding needs (API costs would be prohibitive)
- Privacy-sensitive data that cannot leave the server
- Air-gapped environments without internet
- Cost optimization at scale

## When NOT To Use

- Best-quality embeddings needed (API models are still better)
- No GPU available and CPU latency is too high
- Small volume (API costs are negligible)
- Rapid prototyping (API is simpler to start)

## Best Practices

1. **Use FastEmbed for Laravel**: ONNX-optimized, works with PHP via Qdrant integration.
2. **Quantize models**: ONNX quantized models run 2-4x faster with minimal quality loss.
3. **Batch inference**: Process multiple texts together for efficiency.
4. **Cache embeddings**: Avoid redundant computation.
5. **Benchmark quality**: Local vs API — test with your data to ensure quality is sufficient.

## Related Topics

- K053 (Qdrant FastEmbed)
- K067 (Embedding generation strategies)

## AI Agent Notes

- Local embeddings are the best option for high-volume, privacy-sensitive applications
- FastEmbed provides best PHP integration via Qdrant
- For agents: use API for prototyping, local for cost optimization at scale

## Verification

- [ ] Local model selected (FastEmbed, BGE, etc.)
- [ ] Model running (CPU or GPU)
- [ ] Batch inference working
- [ ] Embedding caching implemented
- [ ] Quality benchmarked against API baseline
- [ ] Latency acceptable for use case
