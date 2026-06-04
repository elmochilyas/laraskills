# Knowledge Unit: Reranking

## Metadata

- **ID:** KU-024
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** reranking
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Reranking improves RAG precision by applying a cross-encoder model to reorder retrieved chunks after initial vector search. While initial retrieval (ANN/HNSW) is fast but approximate, reranking uses a more accurate (but slower) model to score each chunk against the query. This typically improves retrieval precision by 15-30%. Laravel AI SDK supports reranking via Cohere and Jina providers.

## Core Concepts

- **Two-stage retrieval**: Stage 1 (fast, cheap): ANN search returns top-K (e.g., 20). Stage 2 (slow, accurate): reranker scores and reorders, keeping top-N (e.g., 5).
- **Cross-encoder**: Both query and chunk are passed through model together — more accurate than bi-encoder (embedding-based) similarity
- **Reranking score**: 0.0-1.0 relevance score per query-chunk pair
- **Opaque model**: Rerankers are typically black-box API calls — no access to internal representations
- **Cohere Rerank**: Industry-standard reranking with `rerank-english-v3.0` model
- **Jina Reranker**: Alternative with `jina-reranker-v2` model

## Mental Models

- **Screening + Evaluation**: Stage 1 (ANN) screens 100K → 20 candidates. Stage 2 (reranker) evaluates 20 → top 5. Like resume screening (fast filter) followed by interview (deep evaluation).
- **First pass vs. second pass**: Vector search is the fast index scan; reranker is the CPU-intensive row evaluation. Only the reranker truly understands the query-chunk relationship.

## Internal Mechanics

Reranking flow:
1. User query → initial retrieval (HNSW/ANN) → top-K chunks (e.g., K=20)
2. Each chunk + query sent to reranker API as pair
3. Reranker cross-encoder processes each pair — deep semantic comparison
4. Returns relevance scores (0.0-1.0) for each pair
5. Chunks reordered by score, top-N returned to LLM context (e.g., N=5)
6. Low-scoring chunks discarded (below threshold)

Reranking is typically applied after embedding-based retrieval, before context injection. It adds ~200-1000ms latency depending on K and model.

## Patterns

- **Retrieve more, rerank tightly**: Retrieve 3-4x more chunks than final context size, rerank down. K=20 → rerank to N=5.
- **Score threshold**: Discard chunks below 0.5 reranker score — prevents irrelevant content from reaching LLM
- **Late interaction**: Only rerank when initial retrieval quality is uncertain — skip for simple, unambiguous queries
- **Cascade reranking**: Use cheap reranker (Jina) for initial passes, expensive reranker (Cohere) for final scoring

## Architectural Decisions

- **Decision**: Reranker as separate tool vs. integrated → Laravel AI SDK provides reranking as separate provider call, not integrated into SimilaritySearch. Reason: Reranking is optional — adds latency and cost. Application decides when to rerank.
- **Decision**: API-based vs. local reranker → API-based (Cohere, Jina). Reason: Local cross-encoders require Python — defeats the Laravel-native approach. API rerankers are fast enough for production.

## Tradeoffs

| Factor | Without Reranking | With Reranking |
|--------|-------------------|----------------|
| Precision | 60-70% (typical) | 80-90% |
| Latency | ~50ms (HNSW) | +200-1000ms |
| Cost | Zero | $0.001-0.01 per rerank |
| K to N | K=5 directly | K=20 → rerank → N=5 |
| Complexity | Simple | Additional API call and logic |

## Performance Considerations

- Reranking adds 200-1000ms per query (depends on K, model, provider latency)
- Cohere Rerank: ~30ms per chunk (20 chunks = ~600ms)
- Jina Reranker: ~20ms per chunk — faster but slightly less accurate
- Reranking cost: ~$0.001 per 10 chunks with Cohere (negligible for most applications)
- Caching rerank results: Cache query → reranked chunks for repeated queries

## Production Considerations

- Only rerank when needed — simple, unambiguous queries don't benefit
- Cache reranking results by query hash — repeated queries skip reranking
- Set score threshold (recommended: 0.5 Cohere, 0.3 Jina) — discard low-scoring chunks
- Monitor reranking latency — increase K proportionally increases latency
- Log reranking scores for quality analysis — track precision improvements over time
- Fallback to pre-rerank order if reranker fails — don't let reranking outage break RAG

## Common Mistakes

- Reranking every query — adds cost and latency for queries that don't need it
- Reranking too few chunks (K=3, rerank to N=3) — reranker has no signal to improve
- No score threshold — accepting 0.1-score chunks actively harms context quality
- Reranking after context injection — reranker should run before LLM context assembly
- Using reranker with incompatible retrieval — reranker expects bi-encoder embeddings as first stage

## Failure Modes

- **Reranker API outage**: RAG falls back to un-reranked results — quality degrades but system survives
- **Slow reranking on large K**: K=100+ chunks take 3-10 seconds — unacceptable latency
- **Score inversion**: Reranker scores don't correlate with actual relevance — retrain or switch model
- **Bias toward longer chunks**: Rerankers can favor longer texts — normalize chunk size in scoring
- **Cost spike**: High-traffic endpoints with reranking on every query — implement caching and selective reranking

## Ecosystem Usage

- Cohere Rerank for production RAG systems requiring high precision
- Jina Reranker for cost-sensitive applications with slightly lower precision requirements
- Laravel AI SDK: reranking via Cohere or Jina providers — `Ai::call()` with rerank model
- Reranker models are typically free-tuned on customer data for domain-specific improvement

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-025: Hybrid Search
- KU-026: Citation-Grounded Answers

## Research Notes

- Laravel AI SDK supports Cohere and Jina as reranking providers (since v0.4.2)
- Cohere Rerank 3 is the industry standard — used by 60%+ of production RAG systems surveyed
- Reranking improves RAG accuracy by 15-30% in published benchmarks
- No PHP-native cross-encoder available — all reranking is API-based
- Retrieval 2x → Rerank → Top-N pattern is the industry standard for production RAG
