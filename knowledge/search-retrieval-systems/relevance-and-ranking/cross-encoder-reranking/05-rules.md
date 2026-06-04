---
## Rule Name
Use Two-Stage Pipeline: Retrieve 50, Re-Rank 10

## Category
Architecture

## Rule
Always use a two-stage pipeline: first-pass ANN retrieval returns top-50 candidates, cross-encoder re-ranks to top-10.

## Reason
Re-ranking all documents is computationally prohibitive. A candidate pool of 50 balances re-ranking quality with latency.

## Bad Example
```php
// No two-stage — re-ranking entire dataset
$allResults = VectorSearch::search($query, topK: 10000);
$reranked = $crossEncoder->rerank($query, $allResults);  // Very slow
```

## Good Example
```php
// Two-stage: ANN retrieves 50, cross-encoder re-ranks to 10
$candidates = VectorSearch::search($query, topK: 50);
$reranked = $crossEncoder->rerank($query, $candidates);  // Fast
return array_slice($reranked, 0, 10);
```

## Exceptions
Very high quality requirements where top-100 candidate pool is necessary.

## Consequences Of Violation
Unacceptable latency (re-ranking thousands of documents) or missed relevant documents (candidate pool too small).

---
## Rule Name
Implement Fallback to ANN Order

## Category
Reliability

## Rule
Always implement a fallback to the first-pass ANN ranking order when the cross-encoder is unavailable.

## Reason
Cross-encoder services fail (API timeout, model OOM). Without fallback, the entire search pipeline fails.

## Bad Example
```php
$reranked = $crossEncoder->rerank($query, $candidates);
// If cross-encoder fails — 500 error or empty results
```

## Good Example
```php
try {
    $reranked = $crossEncoder->rerank($query, $candidates);
} catch (CrossEncoderException $e) {
    Log::warning('Cross-encoder failed, using ANN fallback');
    $reranked = $candidates;  // Fallback to ANN order
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complete search failure when the cross-encoder is temporarily unavailable.

---
## Rule Name
Benchmark NDCG Improvement Before Deploying

## Category
Testing

## Rule
Always benchmark NDCG or MAP improvement of cross-encoder re-ranking against ANN-only baseline before deploying.

## Reason
Cross-encoder adds 50-250ms latency and API cost. If improvement is marginal, the cost may not justify deployment.

## Bad Example
```bash
# Deploying cross-encoder without measuring improvement — cost without validation
```

## Good Example
```php
$annNdcg = evaluateRanking(fn() => annSearch($query), $testSet);
$rerankedNdcg = evaluateRanking(fn() => rerankedSearch($query), $testSet);
if ($rerankedNdcg['ndcg@10'] - $annNdcg['ndcg@10'] < 0.03) {
    return annSearch($query);  // Not worth the cost
}
```

## Exceptions
High-stakes search (legal, medical) where any improvement is worth the cost.

## Consequences Of Violation
Added latency and cost without measurable improvement in search quality.
