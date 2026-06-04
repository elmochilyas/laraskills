# Knowledge Unit: Qdrant Re-Ranking with Cross-Encoders

## Metadata

- **ID:** K054
- **Subdomain:** Relevance & Ranking
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** Second-pass relevance

## Executive Summary

Qdrant integrates with cross-encoder models (like Cohere or BAAI/bge-reranker-v2-m3) to perform second-pass re-ranking of search results. After initial ANN retrieval, a cross-encoder scores the top-N candidates by jointly examining the query and each document, providing more accurate relevance assessment than the initial embedding similarity alone.

## Core Concepts

- **Two-Stage Retrieval**: Stage 1: ANN search retrieves top-K candidates. Stage 2: Cross-encoder re-ranks these candidates.
- **Cross-Encoder Model**: Unlike bi-encoders (which produce separate query/doc embeddings), cross-encoders process query+doc together for a relevance score.
- **Qdrant Integration**: Qdrant can invoke cross-encoder models via its REST API or FastEmbed integration.
- **Reciprocal Re-Ranking**: Results are returned in the cross-encoder's order, not the initial ANN order.

## Internal Mechanics

Qdrant first performs ANN search using a bi-encoder embedding (e.g., from FastEmbed or an external model). The top-K results (typically top-20 to top-100) are passed to the cross-encoder. The cross-encoder takes each query-document pair, computes a relevance score (typically 0-1), and sorts results by this score. The final result order reflects the cross-encoder's assessment, not the raw embedding similarity.

## Patterns

- **Recall-then-rerank**: Use a fast, high-recall ANN search (lower `ef_search`, larger candidate pool) and then refine with a cross-encoder.
- **Latency budget**: Keep the re-ranking candidate pool small (top-20 or top-50) to stay within latency SLAs.
- **Model selection**: Use smaller, faster cross-encoders (BAAI/bge-reranker-v2-m3) for latency-sensitive applications.

## Architectural Decisions

Two-stage retrieval separates the scalability concern (ANN search over millions of vectors) from the accuracy concern (cross-encoder scoring of a small candidate set). This hybrid approach is the standard pattern in modern retrieval systems.

## Tradeoffs

| Factor | Single-Stage ANN | Two-Stage with Cross-Encoder |
|---|---|---|
| Latency | 2-10ms | 50-250ms (including re-rank) |
| Accuracy | Good (embedding similarity) | Best (cross-encoder relevance) |
| Infrastructure | Vector DB only | Vector DB + ML inference |
| Candidate pool | N/A | Must be large enough for recall |

## Performance Considerations

- Cross-encoder latency scales linearly with candidate pool size. 20 candidates: ~50ms. 100 candidates: ~200ms.
- Use GPU acceleration for cross-encoder inference if available.
- Qdrant FastEmbed provides on-device cross-encoder inference, avoiding network calls.
- Batch inference: Process multiple query-document pairs in a single inference call for efficiency.

## Production Considerations

- **Limit re-rank candidates to 20-50** for acceptable latency.
- **Cache cross-encoder results** for repeated queries (e.g., popular search terms).
- **Monitor recall**: Ensure the initial ANN search retrieves enough relevant candidates for the re-ranker.
- **Choose model carefully**: Smaller models (BAAI/bge-reranker-v2-m3) offer better latency at slight accuracy cost.

## Common Mistakes

- Re-ranking too many candidates (top-1000) — latency becomes unacceptable.
- Initial ANN search with too few candidates — relevant documents may never reach the re-ranker.
- Using cross-encoder without evaluating recall improvement — may not justify latency cost for all query types.

## Failure Modes

- **Re-ranker model unavailable**: If the cross-encoder service is down, fall back to ANN results.
- **Latency spike**: Cross-encoder inference time varies with input length — long documents take longer.
- **Model bias**: Cross-encoder may systematically prefer certain document types, affecting search fairness.

## Ecosystem Usage

Adopted by production RAG pipelines and high-accuracy search systems where the latency cost of re-ranking is justified by the relevance improvement.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K053 (Qdrant FastEmbed)
- K062 (Cross-encoder re-ranking)

## Research Notes

Source: Qdrant docs, Cohere docs, BAAI/bge-reranker. The two-stage retrieval pattern (bi-encoder retrieval → cross-encoder re-ranking) is the established best practice for high-accuracy search. Qdrant's FastEmbed integration provides on-device cross-encoder inference without external API calls.


## Mental Models

- **Payload as Passport**: Qdrant treats vector search as identity verification and payload filtering as passport checks. A vector finds candidates, then payload filters validate their credentials.
- **Storage Engine**: Qdrant's HNSW index is like a skip list in high-dimensional space — you navigate through layers of increasing precision to find nearest neighbors.

