## Always Use Hybrid Search for Text Retrieval
---
## Category
Performance | Reliability
---
## Rule
Combine vector similarity search with full-text keyword search (using RRF or weighted fusion) for all text retrieval tasks; never use pure vector search for text content.
---
## Reason
Pure vector search misses exact keyword matches (IDs, acronyms, domain-specific terms). Pure keyword search misses semantic relationships (synonyms, paraphrasing). Hybrid search combines both signals, providing superior recall and precision. Reciprocal Rank Fusion (RRF) is the recommended fusion algorithm.
---
## Bad Example
```php
$results = Documents::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->limit(10)
    ->get(); // Vector-only — misses exact keyword matches
```
---
## Good Example
```php
$results = Documents::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->whereFullText('content', $query)
    ->orderByRaw('(1.0 / (60.0 + ROW_NUMBER() OVER (ORDER BY vector_similarity DESC))) +
                  (1.0 / (60.0 + ROW_NUMBER() OVER (ORDER BY ts_rank DESC))) DESC')
    ->limit(10)
    ->get();
```
---
## Exceptions
Image or audio similarity search (where only vector representations exist) is a legitimate pure-vector use case.
---
## Consequences Of Violation
Missed exact-match results, poor retrieval for code/ID queries, degraded RAG quality.

## Tune RRF k-Constant per Corpus
---
## Category
Performance
---
## Rule
Start with RRF k=60 as default; tune the k-constant per corpus based on retrieval quality evaluation.
---
## Reason
The RRF k-constant controls how quickly ranking position differences translate to score differences. Higher k (e.g., 60) smooths rankings, benefiting diverse result sets. Lower k (e.g., 20) amplifies top-ranked differences, benefiting precision-focused queries. The optimal k varies by corpus characteristics.
---
## Bad Example
```php
$k = 60; // Used without testing — may not be optimal for this corpus
```
---
## Good Example
```php
// Evaluate recall@10 with k=20, k=40, k=60, k=100
// Select the k that maximizes recall@10 on your test set
$k = $this->findOptimalK($testQueries);
$rrfScore = '(1.0 / (' . $k . '.0 + rank))';
```
---
## Exceptions
Applications without a representative test query set should use k=60 (well-established default) until evaluation data is available.
---
## Consequences Of Violation
Suboptimal ranking fusion, degraded search quality, missed optimization opportunity.

## Normalize Scores Before Weighted Combination
---
## Category
Reliability
---
## Rule
When using weighted fusion instead of RRF, normalize vector similarity scores and full-text scores to the same range before combining; never combine raw scores from different domains.
---
## Reason
Vector cosine similarity ranges from -1 to 1, while ts_rank ranges from 0 to 1. Combining them with different ranges gives disproportionate weight to one method regardless of the alpha parameter. Normalization to [0,1] ensures alpha controls the actual blend.
---
## Bad Example
```php
// Raw scores have different ranges — alpha doesn't work correctly
$finalScore = $alpha * $vectorScore + (1 - $alpha) * $fullTextScore;
```
---
## Good Example
```php
// Normalize both to [0,1]
$normalizedVector = ($vectorScore + 1) / 2; // Map [-1,1] to [0,1]
$finalScore = $alpha * $normalizedVector + (1 - $alpha) * $fullTextScore;
```
---
## Exceptions
RRF fusion does not require score normalization since it operates on rank positions, not raw scores.
---
## Consequences Of Violation
Weighted fusion produces incorrect rankings, alpha parameter has no predictable effect, tuning is impossible.
