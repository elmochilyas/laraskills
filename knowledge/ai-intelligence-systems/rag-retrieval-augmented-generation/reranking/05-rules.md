## Retrieve More, Rerank Tightly
---
## Category
Performance | Reliability
---
## Rule
Retrieve 3-4x more chunks (K=20) than the final context size (N=5) and apply a cross-encoder reranker to select the top N; never use the raw ANN top-K as the final context.
---
## Reason
ANN (HNSW) search is approximate — it finds good candidates but may miss the best ones and includes false positives. Reranking with a cross-encoder scores each candidate against the query with higher accuracy, producing a tighter, more relevant context for the LLM.
---
## Bad Example
```php
// Direct top-5 from ANN — misses reranking precision gain
$chunks = DocumentChunk::orderByVectorSimilarTo(...)->limit(5)->get();
```
---
## Good Example
```php
// Retrieve 20, rerank to 5
$candidates = DocumentChunk::orderByVectorSimilarTo(...)->limit(20)->get();
$reranked = Reranker::rerank($query, $candidates, topN: 5, minScore: 0.5);
```
---
## Exceptions
Simple, unambiguous queries where the top ANN result is reliably correct may skip reranking if recall@1 is validated at >95%.
---
## Consequences Of Violation
Irrelevant chunks in LLM context, degraded response quality, missed relevant content.

## Set a Reranker Score Threshold
---
## Category
Reliability
---
## Rule
Discard reranked chunks below a score threshold (e.g., 0.5 for Cohere, 0.3 for Jina); never accept all reranked results regardless of score.
---
## Reason
Rerankers return a score for every candidate, even if all are irrelevant. Without a threshold, chunks with 0.1 relevance score enter the context, actively degrading LLM response quality by introducing irrelevant or misleading information.
---
## Bad Example
```php
$reranked = Reranker::rerank($query, $candidates, topN: 5);
// No score check — may include near-zero relevance chunks
```
---
## Good Example
```php
$reranked = Reranker::rerank($query, $candidates, topN: 5, minScore: 0.5);
// Only chunks with score >= 0.5 are included in context
```
---
## Exceptions
When recall is critical and some context is always better than none (e.g., the system must always provide an answer), lower the threshold and accept the quality tradeoff.
---
## Consequences Of Violation
LLM receives irrelevant context, response quality degrades, user trust erodes.

## Only Rerank When Needed
---
## Category
Performance
---
## Rule
Rerank only when initial retrieval quality is uncertain or when the query is complex; skip reranking for simple, unambiguous queries.
---
## Reason
Reranking adds 200-1000ms latency and $0.001-0.01 per query. For simple keyword-like queries where ANN already returns accurate results, reranking provides negligible quality improvement while adding significant cost and latency.
---
## Bad Example
```php
// Reranking every query — unnecessary cost and latency
$reranked = Reranker::rerank($query, $candidates, topN: 5);
```
---
## Good Example
```php
// Rerank only when query complexity warrants it
if ($this->queryRequiresReranking($query)) {
    $reranked = Reranker::rerank($query, $candidates, topN: 5);
} else {
    $reranked = $candidates->take(5);
}
```
---
## Exceptions
Applications where response quality must be maximized regardless of cost (premium tiers, medical/legal) may rerank every query.
---
## Consequences Of Violation
Unnecessary API costs, increased latency for all queries, reduced throughput.
