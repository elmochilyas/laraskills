| Metadata | |
|---|---|
| Knowledge Unit ID | ku-03 |
| Subdomain | hybrid-search |
| Topic | RRF - Reciprocal Rank Fusion |
| Source | Cormack et al., SIGIR 2009 |
| Maturity | Stable |

## Overview

Reciprocal Rank Fusion (RRF) is a hybrid search fusion algorithm that combines multiple ranked result lists into a single ranked list. Each result's score = 1/(k + rank). RRF requires no training, no relevance scores, and no normalization — only rank positions. This simplicity makes it the most widely used fusion method.

## Core Concepts

- **Rank-Based**: Only rank positions matter, not underlying scores
- **Constant k**: Damping parameter (default 60) controlling contribution from lower ranks
- **Sum of Reciprocals**: Final score = Σ 1/(k + rank_i) across all result lists
- **No Training**: Works immediately with any set of ranked results

## When To Use

- Combining keyword and vector search results
- Multi-engine search (Scout + pgvector, Meilisearch + Qdrant)
- Ensemble ranking from different models or strategies
- Any fusion scenario where scores are not directly comparable

## When NOT To Use

- Scores are directly comparable and normalized (weighted fusion may be better)
- Very small result sets (<5 items per list) — limited RRF benefit
- Need fine-grained relevance control per item (use cross-encoder)
- Single retrieval path (no fusion needed)

## Best Practices

1. **Use k=60 as default**: Empirically established standard from original paper.
2. **Normalize input ranks**: If result lists have different lengths, pad remaining items.
3. **Fuse at application level** for maximum control.
4. **Cache intermediate fusion results** for repeated queries.
5. **Limit input lists to top-100**: Diminishing returns beyond that.
6. **Handle duplicate items**: RRF naturally handles by summing across lists.

## Architecture Guidelines

- Application-level: Simple PHP implementation (<20 lines)
- Engine-level: Natively supported in Qdrant, Meilisearch, Typesense, Milvus
- SQL-level: Can be implemented as a stored procedure for pgvector + FTS
- Idempotent: Same inputs always produce same output

## Performance Considerations

- RRF computation: O(m × n) where m = lists, n = unique items
- For 2 engines, top-100 each: <1ms in PHP
- No external dependencies — pure in-memory operation
- Input list size directly affects computation time

## Security Considerations

- RRF itself has no security concerns (pure computation)
- Input data security depends on retrieval path authentication
- Fusion results may expose information from both paths

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using k < 10 | Misunderstanding damping | Excessive weight to top-1 | Use k=60 default |
| Expecting RRF to fix poor retrieval | Assumption fusion improves all | Disappointing results | Fix each path first |
| Fusing top-1000 results | Over-collecting | Wasted computation | Cap at top-100 per path |
| Not handling empty lists | Assumption both paths return results | PHP errors | Graceful empty list handling |

## Anti-Patterns

- **Using RRF with a single result list**: Pointless — no fusion needed
- **Optimizing k without data**: k=60 works well universally; only tune with specific data
- **Fusing unranked results**: RRF requires ranked lists; pass equal rank if unranked
- **Modifying RRF formula unnecessarily**: Proven algorithm, deviations risk unexpected behavior

## Examples

`php
function rrf(array ..., int  = 60, int  = 20): array
{
     = [];
    foreach ( as ) {
        foreach ( as  => ) {
            [] = ([] ?? 0) + 1 / ( +  + 1);
        }
    }
    arsort();
    return array_slice(array_keys(), 0, );
}
`

## Related Topics

- K028 (Meilisearch hybrid search)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K062 (Cross-encoder re-ranking)

## AI Agent Notes

- RRF is the de facto standard for hybrid search fusion
- Original paper: Cormack et al., SIGIR 2009
- Implemented natively in Qdrant, Meilisearch, Typesense, Milvus
- For agents: implement RRF as default fusion; only reach for cross-encoder when quality needs justify cost

## Verification

- [ ] RRF algorithm implemented correctly
- [ ] k parameter tested (default 60 working)
- [ ] Fusion results balanced between paths
- [ ] Empty list handling implemented
- [ ] Performance measured (<1ms overhead)
- [ ] Fusion quality evaluated against single-path baseline
