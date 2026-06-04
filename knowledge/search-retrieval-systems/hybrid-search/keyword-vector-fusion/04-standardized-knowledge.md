| Metadata | |
|---|---|
| Knowledge Unit ID | ku-02 |
| Subdomain | hybrid-search |
| Topic | Keyword-Vector Fusion |
| Source | Academic / Industry |
| Maturity | Stable |

## Overview

Keyword-vector fusion combines BM25/term-based retrieval with embedding-based semantic retrieval into a single ranked result set. Three primary fusion methods exist: Reciprocal Rank Fusion (RRF), weighted score combination, and cross-encoder re-ranking. Each offers different tradeoffs in simplicity, accuracy, and latency.

## Core Concepts

- **Dual Retrieval Paths**: Keyword index (inverted index, BM25) and vector index (ANN, cosine similarity)
- **RRF Fusion**: Rank-based, score = 1/(k + rank), sum across result sets
- **Weighted Fusion**: score = α * normalized_keyword_score + (1-α) * cosine_similarity
- **Cross-Encoder**: Second-pass model that jointly scores query-document pairs
- **Score Normalization**: Mapping different scoring scales to comparable ranges

## When To Use

- Production search needing both exact match and semantic understanding
- RAG pipelines where retrieval quality directly affects generation quality
- E-commerce search (specific product names + conceptual product types)
- Content platforms (exact article titles + topical relevance)

## When NOT To Use

- Keyword-only search is sufficient for the use case
- Latency budget cannot accommodate dual retrieval
- Generating embeddings or sparse vectors is not feasible
- Dataset is small enough that keyword recall is already good

## Best Practices

1. **Start with RRF**: No score normalization needed, simple to implement.
2. **Tune k parameter**: Default 60, but test 30-100 range for your data.
3. **Limit candidate pool**: Top-100 per path is typically sufficient.
4. **Parallelize queries**: Run keyword and vector searches concurrently.
5. **Monitor fusion balance**: Ensure one path doesn't dominate results.

## Architecture Guidelines

- RRF: Application-level PHP or engine-level (Qdrant, Meilisearch, Milvus)
- Weighted: Application-level with score normalization functions
- Cross-encoder: Microservice or API call (Cohere, FastEmbed)
- Failover: If one path fails, fall back to the other alone

## Performance Considerations

- Dual retrieval doubles search latency vs single path
- RRF adds <1ms overhead (in-memory operation)
- Cross-encoder adds 50-200ms for top-20 candidates
- Candidate pool size directly affects recall and latency

## Security Considerations

- Each retrieval path has independent auth and access controls
- Embedding API calls may send data externally
- Fusion logic should handle path failures gracefully
- Cross-encoder endpoints need rate limiting and auth

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using raw scores without normalization | Different scoring scales | One path dominates fusion | Use RRF (rank-based) |
| Running queries sequentially | Simple implementation | Double latency | Parallelize retrieval |
| Fusing entire result sets (top-1000) | Maximize recall assumption | Wasted computation | Cap at top-100 per path |
| Not tuning α in weighted fusion | Default 0.5 assumed | Suboptimal balance | Test 0.3-0.7 range |

## Anti-Patterns

- **Score-based fusion without normalization**: Scales incomparable
- **Ignoring empty path results**: Handle one path returning no results
- **One-size-fits-all fusion**: Different query types may need different fusion strategies
- **Not monitoring path quality**: Individual path degradation affects fusion quality

## Examples

`php
// RRF Fusion in Laravel
function rrfFusion(array , array , int  = 60, int  = 20): array
{
     = [];
    foreach ([, ] as  => ) {
        foreach ( as  => ) {
            [] = ([] ?? 0) + 1 / ( +  + 1);
        }
    }
    arsort();
    return array_keys(array_slice(, 0, ));
}
`

## Related Topics

- K061 (RRF - Reciprocal Rank Fusion)
- K062 (Cross-encoder re-ranking)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)

## AI Agent Notes

- RRF is the safest default fusion method — no tuning required
- Cross-encoder re-ranking provides best quality but adds latency and cost
- Application-level fusion gives most control but adds complexity
- For agents: implement RRF first, add cross-encoder only if quality requirements demand it

## Verification

- [ ] Both retrieval paths (keyword + vector) working independently
- [ ] Fusion algorithm implemented and tested
- [ ] Fusion balanced (each path contributes meaningfully)
- [ ] Latency measured for full pipeline
- [ ] Failover handling for individual path failures
- [ ] Fusion tuned with representative queries
