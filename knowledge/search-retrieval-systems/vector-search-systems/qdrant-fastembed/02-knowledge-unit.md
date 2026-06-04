# Knowledge Unit: Qdrant FastEmbed Integration

## Metadata

- **ID:** K053
- **Subdomain:** Vector Similarity Search
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** On-device embeddings

## Executive Summary

Qdrant integrates with FastEmbed, a library for on-device embedding generation using quantized ONNX models. FastEmbed runs embedding inference locally (CPU), eliminating the need for external embedding API calls. It supports models for dense embeddings (BGE, Instructor), sparse embeddings (SPLADE), and cross-encoder re-ranking.

## Core Concepts

- **On-Device Inference**: Embedding generation runs on the local CPU, no API calls needed.
- **Quantized Models**: Uses ONNX Runtime with INT8 quantized models for efficient inference.
- **Dense Models**: BGE, Instructor, and other text embedding models for semantic search.
- **Sparse Models**: SPLADE for keyword-aware sparse embeddings.
- **Cross-Encoders**: On-device re-ranking models.

## Internal Mechanics

FastEmbed loads a quantized ONNX model into memory. Text input is tokenized and passed through the model. The output embedding vector is returned synchronously. The library handles model downloading, caching, and inference batching. Python-based by nature, but models can be used from any language via ONNX Runtime (including PHP with FFI or subprocess calls).

## Patterns

- **Zero-cost embeddings**: Generate embeddings locally without OpenAI API costs.
- **Air-gapped deployments**: Embedding generation works without internet access.
- **Low-latency indexing**: Embedding generation in <100ms on modern CPUs.
- **Sparse + dense**: Generate both dense (BGE) and sparse (SPLADE) vectors from the same text.

## Architectural Decisions

Qdrant acquired FastEmbed to provide a fully on-device vector search pipeline — from embedding generation to storage to search to re-ranking. This eliminates external dependencies (no OpenAI, no Cohere) for teams that want a self-contained stack.

## Tradeoffs

- Quality: ONNX quantized models are slightly less accurate than full-precision API models (OpenAI).
- Performance: CPU inference is slower than GPU inference but sufficient for most batch indexing workloads.
- Model availability: Smaller model selection compared to OpenAI/Cohere.
- PHP integration: Requires running Python/ONNX Runtime or using a subprocess.

## Performance Considerations

- Embedding generation: 10-50ms per text on modern CPU (varies by model and text length).
- Batch inference: Batching texts improves throughput (2-3x faster per-text).
- Model loading: First inference is slow (~1s) — model must be loaded into memory.
- Memory: Quantized models are 100-500MB, reasonable for server environments.

## Production Considerations

- **Use for batch indexing** where embedding API costs would be significant.
- **Cache generated embeddings** — don't re-embed unchanging documents.
- **Prefer API embeddings for query-time** if latency is critical (CPU inference adds 10-50ms to query path).
- **Consider a Python microservice** for FastEmbed integration if PHP integration is complex.

## Common Mistakes

- Using FastEmbed for real-time query embedding in high-QPS scenarios — CPU inference may not keep up.
- Not caching embeddings — regenerating the same embedding wastes compute.
- Expecting OpenAI-quality embeddings from quantized on-device models.
- Forgetting to batch inputs — single-text inference is slower than batched.

## Failure Modes

- **Model loading failure**: Disk space or memory insufficient for model download.
- **Slow cold start**: First inference after deployment takes seconds (model loading).
- **CPU saturation**: Embedding generation on a shared CPU affects application response times.

## Ecosystem Usage

Popular among Qdrant users who want a fully self-hosted stack. Also used as a cost-saving measure for high-volume embedding generation.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)
- K067 (Embedding generation strategies)

## Research Notes

Sources: Qdrant docs, FastEmbed GitHub. FastEmbed provides the most accessible on-device embedding pipeline for the Qdrant ecosystem. The BAAI/bge-small-en-v1.5 model is the most popular choice, balancing quality and speed.


## Mental Models

- **Translator**: An embedding model is like a translator who converts text into a language of pure meaning (vectors). Different translators (models) have different vocabularies and dialects.
- **Map Coordinates**: Embeddings are like GPS coordinates in a meaning-space. Similar concepts cluster together geographically; distance maps to semantic similarity.
- **Fingerprint**: Each document gets a unique vector fingerprint. The goal is high sensitivity (different docs → different vectors) and robustness (same meaning → similar vectors).

