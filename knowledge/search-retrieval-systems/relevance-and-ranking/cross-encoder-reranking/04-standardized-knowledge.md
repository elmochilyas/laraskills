| Metadata | |
|---|---|
| KU ID | K062 |
| Subdomain | relevance-and-ranking |
| Topic | Cross-Encoder Re-Ranking |
| Source | Academic / ML |
| Maturity | Stable |

## Overview

Cross-encoder re-ranking is a two-stage retrieval approach where an initial fast retrieval (bi-encoder ANN search) returns a candidate set, and a cross-encoder model scores each query-document pair jointly for more accurate relevance assessment. Cross-encoders like Cohere Rerank and BAAI/bge-reranker provide the highest accuracy but add 50-250ms latency per query.

## Core Concepts

- **Joint Encoding**: Processes query+doc as a single input, allowing attention between them.
- **Two-Stage Pipeline**: Coarse retrieval (ANN) → fine re-ranking (cross-encoder).
- **Relevance Score**: Outputs a single score (0-1) per query-document pair.
- **Provider Options**: Cohere Rerank (API), BAAI/bge-reranker (open-source), FastEmbed (on-device).

## When To Use

- RAG pipelines where context quality directly impacts answer quality
- High-stakes search (legal, medical, enterprise)
- Applications where ranking accuracy is more important than latency
- Production systems that already have a fast first-pass retrieval

## When NOT To Use

- Latency-sensitive applications (<100ms total search time)
- Low-traffic applications where the cost/benefit doesn't justify the complexity
- When bi-encoder search already provides sufficient accuracy
- Teams without budget for API-based re-rankers or compute for self-hosted models

## Best Practices

1. **Retrieve 50, re-rank 10**: ANN retrieves top-50, cross-encoder scores all 50, top-10 returned.
2. **Choose the right model**: Open-source (BGE) for self-hosted, Cohere for API-based.
3. **Cache re-ranker results**: For frequent queries to reduce costs and latency.
4. **Measure NDCG/MAP improvement**: Validate re-ranking justifies its cost.
5. **Fall back to ANN order**: If re-ranker is unavailable, return ANN results.

## Architecture Guidelines

- Two-stage pipeline: ANN retrieves top-K candidates → cross-encoder scores and re-ranks.
- Candidate pool size: typically 20-100 (more = better recall, higher latency).
- For PHP/Laravel: call re-ranker API (Cohere) or local service (FastEmbed).
- Implement circuit breaker: fall back to ANN if re-ranker fails.

## Performance Considerations

- Latency proportional to candidate count: 10 docs ~30ms, 100 docs ~300ms.
- GPU accelerates inference 10-50x vs CPU.
- Model size matters: bge-reranker-v2-m3 (568MB) vs Cohere API call.
- Batching candidates (batch of 20) is ~50% faster than sequential scoring.

## Related Topics

- K054 (Qdrant cross-encoder re-ranking)
- K053 (Qdrant FastEmbed)
- K069 (RAG pipeline architecture)
- K061 (RRF - Reciprocal Rank Fusion)

## AI Agent Notes

- Cross-encoder re-ranking is the gold standard for search relevance.
- Always use two-stage: don't re-rank all documents, only a candidate pool.
- For agents: retrieve top-50, re-rank to top-10; use Cohere for API convenience or BGE for self-hosting; implement ANN fallback.

## Verification

- [ ] First-pass retrieval implemented (ANN or keyword)
- [ ] Candidate pool size configured (20-100)
- [ ] Cross-encoder model selected and integrated
- [ ] Latency budget includes re-ranking overhead
- [ ] Fallback to ANN order implemented
- [ ] Accuracy improvement measured vs baseline
