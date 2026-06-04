# Knowledge Unit: RRF (Reciprocal Rank Fusion)

## Metadata

- **ID:** K061
- **Subdomain:** Hybrid Search
- **Source:** Academic (Cormack et al., SIGIR 2009)
- **Maturity:** Stable
- **Laravel Relevance:** Common fusion algorithm

## Executive Summary

Reciprocal Rank Fusion (RRF) is a hybrid search fusion algorithm that combines multiple ranked result lists into a single ranked list. Each result's score is computed as `1 / (k + rank)` where `rank` is the item's position in each input list. RRF requires no training, no relevance scores from the input engines, and no normalization — only rank positions. This simplicity makes it the most widely used fusion method.

## Core Concepts

- **Rank-Based**: Only rank positions matter, not the underlying scores.
- **Constant `k`**: A damping parameter (typically 60) that controls score contribution from lower ranks.
- **Sum of Reciprocals**: Each item's final score is `sum(1 / (k + rank_i))` across all result lists.
- **No Training Required**: Works immediately with any set of ranked results from any engines.

## Internal Mechanics

Given result set A from engine 1 and result set B from engine 2, RRF iterates over all unique items across both sets. For each item, it sums `1 / (60 + rank_in_A) + 1 / (60 + rank_in_B)`. Items appearing in only one set receive score only from that set. Results are sorted by descending RRF score. The value `k=60` is the standard recommendation, damping the contribution of deep ranks.

## Patterns

- **Keyword + vector fusion**: Combine PostgreSQL FTS results with pgvector results.
- **Multi-engine search**: Query Meilisearch for full-text and Qdrant for vectors, fuse with RRF.
- **Ensemble ranking**: Combine results from different embedding models or ranking strategies.

## Architectural Decisions

RRF is preferred over weighted fusion in academic literature because it avoids the need for score normalization across different engines. Rank positions are inherently comparable even when raw scores are not.

## Tradeoffs

| Factor | RRF | Weighted Fusion | Cross-Encoder |
|---|---|---|---|
| Training | None | Needs weight tuning | ML model required |
| Score normalization | Not needed | Required | Built-in |
| Latency | ~1ms (in memory) | ~1ms | 50-200ms per 20 docs |
| Accuracy | Good | Good | Best |
| Interpretability | Simple formula | Intuitive weights | Black box |

## Performance Considerations

- RRF computation is O(m * n) where m is the number of result lists and n is the total unique items.
- For typical usage (2 engines, top-100 each), RRF completes in microseconds.
- No external dependencies — runs in application memory.

## Production Considerations

- **Use `k=60` as default** — this is the empirically established standard.
- **Normalize input ranks** if result lists have different lengths.
- **Fuse at application level** for maximum control, or use engine-native RRF (Qdrant, Milvus, Meilisearch).
- **Cache intermediate results** if fusion runs frequently with the same inputs.

## Common Mistakes

- Using `k` values that are too small (<10) — gives excessive weight to top-1 results.
- Expecting RRF to fix poor individual engine results — it only combines, not corrects.
- Fusing too many results (top-1000) — diminishing returns and wasted computation.

## Failure Modes

- **Empty result set from one engine**: RRF still produces results from the surviving engine.
- **Duplicate items**: RRF handles duplicates by summing scores across lists.

## Ecosystem Usage

The de facto standard for hybrid search in production. Implemented natively in Qdrant, Meilisearch, Typesense, and Milvus. Also widely used in application-level fusion code.

## Related Knowledge Units

- K028 (Meilisearch hybrid search)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K060 (Milvus hybrid search)
- K062 (Cross-encoder re-ranking)

## Research Notes

Source: Cormack et al., "Reciprocal Rank Fusion outperforms Condorcet and individual rank learning methods" (SIGIR 2009). The paper demonstrated RRF's effectiveness for meta-search (combining results from multiple search engines). The value `k=60` was empirically determined and has remained the standard recommendation.


## Mental Models

- **Bread and Butter**: Hybrid search combines keyword search (bread — reliable, foundational) with vector search (butter — semantic, rich). Alone each is good, together they are a meal.
- **Ranking Committee**: RRF is like a committee voting on search results. Each retrieval method gets a vote, and the final ranking is the combined score across all methods.

