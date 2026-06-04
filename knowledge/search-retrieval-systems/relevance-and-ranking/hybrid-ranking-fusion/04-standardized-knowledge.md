| Metadata | |
|---|---|
| KU ID | ku-03 |
| Subdomain | relevance-and-ranking |
| Topic | Hybrid Ranking Fusion |
| Source | Academic / Industry |
| Maturity | Stable |

## Overview

Hybrid ranking fusion combines keyword (BM25) and vector (embedding) relevance scores into a single ranking. Methods: RRF (Reciprocal Rank Fusion), weighted score fusion, and cross-encoder re-ranking. The right fusion strategy depends on latency budget, accuracy requirements, and available infrastructure.

## Core Concepts

- **RRF**: Rank-based fusion, score = 1/(k+rank), no score normalization needed
- **Weighted**: Score = α × keyword + (1-α) × vector, requires normalization
- **Cross-encoder**: Neural model scoring query-document pairs, best accuracy, slowest
- **Two-Stage**: Coarse retrieval → fusion → re-ranking (optional)

## When To Use

- Any hybrid search implementation
- Combining results from different search engines or indexes
- Improving search quality over single-method retrieval

## When NOT To Use

- Single retrieval method is sufficient
- Cross-encoder latency is prohibitive
- Development/prototyping (keep it simple)

## Best Practices

1. **Start with RRF**: Simple, effective, no tuning needed.
2. **Benchmark individual paths**: Know each method's contribution.
3. **Limit candidate pool**: Top-100 per path → fuse → top-20.
4. **Parallelize retrieval**: Don't run queries sequentially.
5. **Evaluate fusion quality**: Compare against each individual method.

## Related Topics

- K061 (RRF)
- K062 (Cross-encoder re-ranking)
- K045 (pgvector + FTS hybrid)

## AI Agent Notes

- RRF is the default fusion strategy
- Add cross-encoder only when latency budget allows and quality demands it

## Verification

- [ ] Fusion strategy chosen
- [ ] Individual path quality measured
- [ ] Fusion improves over each individual path
