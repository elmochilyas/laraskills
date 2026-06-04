---
## Rule Name
Oversample 2-5x for Re-Ranking Quality

## Category
Performance

## Rule
Always retrieve 2-5x more candidates than the final result count when using Qdrant cross-encoder re-ranking.

## Reason
Cross-encoder re-ranking only reorders the candidate pool. A larger pool increases the chance that the best results are in the pool for re-ranking.

## Bad Example
```python
# Retrieve 10, re-rank 10 — no room for improvement
client.search(collection, query_vector=vec, limit=10)
```

## Good Example
```python
# Oversample 5x: retrieve 50, re-rank to 10
client.search(
    collection, query_vector=vec, limit=50,
    rerank=...  # Cross-encoder re-ranks to final 10
)
```

## Exceptions
Latency-critical applications where extra retrieval cost is prohibitive.

## Consequences Of Violation
Re-ranking quality limited by candidate pool size — the best result may never reach the cross-encoder.

---
## Rule Name
Implement ANN Fallback for Re-Ranking

## Category
Reliability

## Rule
Always fall back to ANN-only results when the cross-encoder re-ranker is unavailable or times out.

## Reason
Cross-encoders (API or local model) can fail. Without fallback, re-ranking failure breaks the entire search.

## Bad Example
```python
try:
    results = client.search(collection, query_vector, rerank=reranker)
except ReRankingError:
    abort(500)  # Search completely broken
```

## Good Example
```python
try:
    results = client.search(collection, query_vector, rerank=reranker)
except ReRankingError:
    # Fall back to ANN-only results
    results = client.search(collection, query_vector)
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complete search failure during cross-encoder outages.

---
## Rule Name
Cache Frequent Re-Ranker Results

## Category
Performance

## Rule
Always cache cross-encoder re-ranking results for frequent or repeated queries.

## Reason
Re-ranking the same (query, candidate) pair multiple times wastes API calls or compute. Caching eliminates redundant work.

## Bad Example
```python
# Re-ranking same query every time — redundant work
def search(query):
    return client.search(collection_name, query, rerank=reranker)
```

## Good Example
```python
cache = {}
def search(query):
    cache_key = md5(query.text)
    if cache_key in cache:
        return cache[cache_key]
    result = client.search(collection_name, query, rerank=reranker)
    cache[cache_key] = result
    return result
```

## Exceptions
Queries that are almost never repeated.

## Consequences Of Violation
Wasted API calls or compute on identical query-candidate re-ranking.
