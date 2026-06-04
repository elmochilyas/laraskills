| Metadata | |
|---|---|
| KU ID | K061 |
| Subdomain | hybrid-search |
| Topic | RRF (Reciprocal Rank Fusion) |
| Source | Academic (Cormack et al., SIGIR 2009) |
| Maturity | Stable |

## Overview

Reciprocal Rank Fusion (RRF) is a hybrid search fusion algorithm that combines multiple ranked result lists into a single ranked list. Each result's score is computed as `1 / (k + rank)` where `rank` is the item's position in each input list. RRF requires no training, no relevance scores from the input engines, and no normalization — only rank positions. This simplicity makes it the most widely used fusion method.

## Core Concepts

- **Rank-Based**: Only rank positions matter, not the underlying scores.
- **Constant `k`**: A damping parameter (typically 60) controlling score contribution from lower ranks.
- **Sum of Reciprocals**: Final score = `sum(1 / (k + rank_i))` across all result lists.
- **No Training Required**: Works immediately with any set of ranked results from any engines.

## When To Use

- Combining keyword + vector search results (hybrid search)
- Multi-engine search fusion (Algolia + Qdrant, Meilisearch + pgvector)
- Any scenario where multiple ranked result lists need to be combined
- Quick implementation without ML expertise or training data

## When NOT To Use

- Only one retrieval path (no fusion needed)
- Score-based fusion is preferred (when scores are normalized and comparable)
- Highest-possible accuracy is required (use cross-encoder re-ranking instead)
- Weighted fusion with tunable parameters is preferred

## Best Practices

1. **Use `k=60` as default** — empirically established standard.
2. **Normalize input ranks** if result lists have different lengths.
3. **Fuse at application level** for maximum control, or use engine-native RRF.
4. **Cache intermediate results** if fusion runs frequently with same inputs.
5. **Limit candidate pool**: Fuse top-100 from each path, not top-1000.

## Architecture Guidelines

- Implement in PHP for application-level fusion.
- Use engine-native RRF when available (Qdrant, Milvus, Meilisearch).
- For application-level: query both engines concurrently, fuse in memory.
- Fusion is fast (<1ms for top-100 from 2 engines).

## Performance Considerations

- RRF computation is O(m × n) where m = result lists, n = total unique items.
- For typical usage (2 engines, top-100 each), RRF completes in microseconds.
- No external dependencies — runs in application memory.
- Fusing in application adds one network round-trip (both queries must complete).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using k < 10 | Following surface-level examples | Excessive weight on top-1 | Use k=60 as default |
| Expecting RRF to fix poor engines | Misunderstanding fusion | Disappointing results | Optimize each path first |
| Fusing too many results | No candidate limit | Wasted computation | Cap at top-100 per path |

## Anti-Patterns

- **Fusion as band-aid for poor retrieval**: Optimize individual paths before relying on fusion.
- **Unlimited candidate pooling**: Diminishing returns beyond top-100.
- **Ignoring one path dominating**: Monitor fusion balance via analytics.

## Related Topics

- K028 (Meilisearch hybrid search)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K060 (Milvus hybrid search)
- K062 (Cross-encoder re-ranking)

## AI Agent Notes

- RRF is the de facto standard fusion algorithm for hybrid search.
- Rank-based fusion avoids score normalization issues across different engines.
- For agents: use k=60 by default; implement at application level for flexibility; cap candidate pools at top-100.

## Verification

- [ ] RRF fusion implemented (application or engine-native)
- [ ] k value tuned for your data (start with 60)
- [ ] Candidate pool size optimized (top-100 per path)
- [ ] Fusion balance monitored (one path not dominating)
- [ ] Individual path quality benchmarked
