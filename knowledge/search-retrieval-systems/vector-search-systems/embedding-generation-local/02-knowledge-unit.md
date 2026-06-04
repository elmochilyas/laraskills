# Knowledge Unit: Embedding Generation Local

## Metadata

- **ID:** ku-07
- **Subdomain:** 06-vector-search-systems
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Embedding Generation Local

## Executive Summary

Local embedding generation runs embedding models on the application server (CPU or GPU), eliminating API costs and data privacy concerns. FastEmbed (ONNX-optimized) provides fast local embeddings. sentence-transformers offers higher quality but requires Python. Qdrant FastEmbed integration provides on-device embeddings with PHP SDK.

## Core Concepts

- **FastEmbed**: ONNX-optimized embedding models for local inference (CPU)
- **sentence-transformers**: Python library with best-quality open-source models
- **BGE Models**: BAAI/bge-* models — good quality/compute balance
- **ONNX Runtime**: Cross-platform inference engine for optimized model execution
- **Tradeoff**: Lower quality than API models but zero API cost and complete privacy

## Internal Mechanics

Standard implementation patterns for Embedding Generation Local.

## Patterns

- Standard patterns apply for Embedding Generation Local.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Embedding Generation Local.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K053 (Qdrant FastEmbed)
- - K067 (Embedding generation strategies)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
