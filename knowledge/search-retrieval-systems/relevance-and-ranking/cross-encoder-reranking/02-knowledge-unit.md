# Knowledge Unit: Cross-Encoder Re-Ranking

## Metadata

- **ID:** K062
- **Subdomain:** Relevance & Ranking
- **Source:** Academic / ML
- **Maturity:** Stable
- **Laravel Relevance:** High-accuracy second-pass

## Executive Summary

Cross-encoder re-ranking is a two-stage retrieval approach where an initial fast retrieval (bi-encoder ANN search) returns a candidate set, and a cross-encoder model scores each query-document pair jointly for more accurate relevance assessment. Cross-encoders like Cohere Rerank and BAAI/bge-reranker provide the highest accuracy but add 50-250ms latency per query.

## Core Concepts

- **Joint Encoding**: Unlike bi-encoders (separate query/doc embedding), cross-encoders process query+doc as a single input.
- **Relevance Score**: Output is a single relevance score (typically 0-1) for the query-document pair.
- **Model Types**: Transformer-based (BERT, T5) fine-tuned on relevance judgment datasets.
- **Provider Options**: Cohere Rerank (API), BAAI/bge-reranker (open-source), FastEmbed (on-device), Voyage (API).

## Internal Mechanics

A cross-encoder takes the concatenated query and document text: `[CLS] query [SEP] document [SEP]`. The transformer processes this joint representation, allowing attention between query and document tokens. The `[CLS]` token representation is passed through a classification head to produce a relevance score. This joint attention is what gives cross-encoders their accuracy advantage — they can assess subtle relevance signals that bi-encoder similarity misses.

## Patterns

- **Retrieve 50, re-rank 10**: ANN retrieves top-50, cross-encoder scores all 50, top-10 returned.
- **Hybrid candidate pool**: Combine top candidates from keyword + vector search, then re-rank jointly.
- **Cascading re-rankers**: Use a fast, small cross-encoder (bge-reranker-v2-m3) as a pre-filter, then a larger one for final ranking.
- **Threshold gating**: Only re-rank when initial ANN confidence is below a threshold.

## Architectural Decisions

Cross-encoder re-ranking is fundamentally a compute-for-accuracy tradeoff. The joint attention mechanism is 100-1000x more expensive than bi-encoder inference but provides significantly better relevance assessment.

## Tradeoffs

| Factor | Bi-Encoder (ANN) | Cross-Encoder (Re-rank) |
|---|---|---|
| Inference cost | Cheap (1 query + N docs encoded once) | Expensive (N query-doc pairs) |
| Latency per 20 docs | 2-5ms | 50-200ms |
| Accuracy | Good | Best |
| Scalability | Millions of vectors | Only top-K candidates |
| Pre-computation | Document embeddings pre-computed | Must run at query time |

## Performance Considerations

- Latency is directly proportional to candidate count. 10 docs: ~30ms. 100 docs: ~300ms.
- GPU acceleration significantly reduces inference time (10-50x vs CPU).
- Model size matters: bge-reranker-v2-m3 (568MB) vs Cohere Rerank (API call).
- Batching: Process candidates as a batch for efficiency (typically 50% faster than sequential).

## Production Considerations

- **Use small candidate pools** (top-20 to top-50) for acceptable latency.
- **Choose the right model**: Open-source (BAAI/bge-reranker) for self-hosted, Cohere for API-based.
- **Cache re-ranker results** for frequent queries.
- **Measure NDCG/MAP improvement** to validate that re-ranking justifies its cost.
- **Fall back to ANN order** if re-ranker is unavailable.

## Common Mistakes

- Re-ranking all documents instead of top-N — 100x unnecessary compute.
- Not tuning the initial retrieval candidate count — too few candidates limit re-ranker potential.
- Using a cross-encoder without evaluating baseline accuracy improvement.
- Assuming all cross-encoder models produce calibrated scores (they don't — use ranking, not thresholds).

## Failure Modes

- **Model unavailable**: API-based re-rankers (Cohere) can experience outages. Implement fallback.
- **Cost shock**: API-based re-ranking costs scale with query volume. Self-hosted models have fixed cost.
- **Latency degradation**: Large candidate sets push re-ranking past acceptable latency thresholds.

## Ecosystem Usage

Standard in production RAG pipelines and high-stakes search (legal, medical, enterprise search). Increasingly accessible via managed APIs (Cohere) and on-device inference (FastEmbed).

## Related Knowledge Units

- K054 (Qdrant cross-encoder re-ranking)
- K053 (Qdrant FastEmbed)
- K069 (RAG pipeline architecture)

## Research Notes

Sources: Cohere Rerank docs, BAAI/bge-reranker GitHub, academic papers. Cross-encoder re-ranking is considered the gold standard for search relevance. The two-stage pattern is used in virtually all production RAG systems. Open-source models (BAAI/bge-reranker) have closed the gap with commercial offerings significantly.


## Mental Models

- **Second Opinion**: Re-ranking is like getting a specialist's opinion after a general practitioner's diagnosis. The first pass (ANN) casts a wide net; the re-ranker examines each candidate carefully.
- **Filter Funnel**: Think of re-ranking as a finer-mesh filter after a coarse filter. The coarse filter catches everything possibly relevant; the fine filter keeps only the best.

