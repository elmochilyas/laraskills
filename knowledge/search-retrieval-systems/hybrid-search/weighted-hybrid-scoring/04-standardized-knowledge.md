| Metadata | |
|---|---|
| Knowledge Unit ID | ku-04 |
| Subdomain | hybrid-search |
| Topic | Weighted Hybrid Scoring |
| Source | Industry / Academic |
| Maturity | Stable |

## Overview

Weighted hybrid scoring combines keyword and vector search scores using a weighted formula: score = α * normalized_keyword_score + (1-α) * vector_similarity. The α parameter controls the balance between keyword and semantic contributions. Unlike RRF, weighted fusion uses actual relevance scores, requiring normalization since different engines produce scores on different scales.

## Core Concepts

- **Alpha (α)**: Weight parameter controlling keyword vs vector balance (0 = pure vector, 1 = pure keyword)
- **Score Normalization**: Mapping scores to [0,1] range for comparability
- **Min-Max Normalization**: (score - min) / (max - min)
- **Z-Score Normalization**: (score - mean) / stddev
- **Sigmoid Normalization**: 1 / (1 + e^(-score)) for handling outliers

## When To Use

- Scores from both paths are available and reliable
- Need fine-grained control over keyword vs vector balance per query type
- Applications where RRF's equal-weight assumption is suboptimal
- A/B testing different α values for different content categories

## When NOT To Use

- Scores are not comparable after normalization
- Only rank information is available (use RRF instead)
- Need deterministic, explainable fusion (RRF is more transparent)
- Cross-encoder quality is needed over weighted scoring

## Best Practices

1. **Normalize scores before weighting**: Different scales make raw scores incomparable.
2. **Test α in 0.3-0.7 range**: Extremes (0 or 1) defeat hybrid purpose.
3. **Consider per-query-type α**: Different queries may benefit from different balances.
4. **Benchmark against RRF**: Weighted fusion should measurably outperform RRF.
5. **Handle outlier scores**: Use clipping or robust normalization methods.

## Architecture Guidelines

- Application-level: PHP normalization + weighted sum
- Parameter tuning: A/B test α values with representative queries
- Dynamic α: Adjust based on query confidence (high-confidence keyword → higher α)
- Score distribution monitoring: Track normalization stability over time

## Performance Considerations

- Weighted fusion adds <1ms overhead (normalization + sum)
- Normalization requires passing through all candidate results
- Score distribution computation (min, max, mean, stddev) is O(n)
- No external dependencies — pure in-memory computation

## Security Considerations

- Same considerations as general hybrid search
- Score values could leak ranking information (not typically sensitive)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not normalizing scores | Assuming same scale | One path dominates fusion | Always normalize to [0,1] |
| Using α=0.5 as default | Symmetry assumption | May not match your data | Test α empirically |
| Linear normalization with outliers | Outlier scores dominate | Distorted fusion | Use sigmoid or clipping |
| Static α for all queries | Simplicity | Suboptimal for query types | Consider per-query-type α |

## Anti-Patterns

- **Weighted fusion without normalization**: Scales incomparable → useless result
- **Setting α to 0 or 1**: Defeats hybrid purpose
- **Not benchmarking against RRF**: Weighted fusion should measurably be better
- **Per-query α without validation**: Risk of overfitting

## Examples

`php
function weightedFusion(array , array , float  = 0.5): array
{
     = normalize();
     = normalize();
     = [];
    foreach ( as  => ) {
         = [] ?? 0;
        [] =  *  + (1 - ) * ;
    }
    arsort();
    return ;
}

function normalize(array ): array
{
     = min();  = max();
     =  -  ?: 1;
    return array_map(fn() => ( - ) / , );
}
`

## Related Topics

- K061 (RRF - Reciprocal Rank Fusion)
- K062 (Cross-encoder re-ranking)
- K002 (Keyword-vector fusion)

## AI Agent Notes

- Weighted fusion is more flexible than RRF but requires careful normalization
- Choose RRF as default; use weighted fusion when α tuning provides measurable improvement
- Per-query-type α can significantly improve specialized searches (products vs articles)
- For agents: start with RRF, use weighted fusion for fine-tuning

## Verification

- [ ] Normalization method chosen and implemented
- [ ] α parameter tested (0.3-0.7 range)
- [ ] Weighted fusion benchmarked against RRF
- [ ] Score distributions monitored for anomalies
- [ ] Edge cases handled (empty scores, outliers)
- [ ] A/B test framework for α tuning
