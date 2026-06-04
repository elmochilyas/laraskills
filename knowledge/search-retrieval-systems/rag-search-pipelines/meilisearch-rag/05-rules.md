---
## Rule Name
Test Retrieval Quality Before Enabling RAG

## Category
Testing

## Rule
Always benchmark Meilisearch retrieval quality (recall@5, NDCG) before enabling RAG generation.

## Reason
RAG answer quality is bounded by retrieval recall. Poor retrieval produces poor answers regardless of LLM quality.

## Bad Example
```bash
# Enabling RAG without testing retrieval — garbage in, garbage out
```

## Good Example
```php
$recall = evaluateRetrieval($testQueries, 'hybrid_config');
if ($recall['recall@5'] < 0.85) {
    optimizeRetrieval();  // Tune semanticRatio, embedder, ranking
}
// Only then enable RAG
```

## Exceptions
No common exceptions.

## Consequences Of Violation
LLM produces incorrect answers because relevant documents weren't retrieved.

---
## Rule Name
Always Include Source Citations

## Category
UX

## Rule
Always return source document references alongside generated answers.

## Reason
Users cannot verify AI answers without source attribution. Citations build trust and allow fact-checking.

## Bad Example
```json
{"answer": "Products can be returned within 30 days."}
```

## Good Example
```json
{
    "answer": "Products can be returned within 30 days.",
    "sources": [{"title": "Return Policy", "section": "Returns Timeline"}]
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users cannot verify answers, reducing trust in the search system.

---
## Rule Name
Implement Fallback to Search Results

## Category
Reliability

## Rule
Always return raw search results when LLM generation is unavailable or times out.

## Reason
LLM APIs have downtime and rate limits. The search feature should not break entirely when generation fails.

## Bad Example
```php
try {
    $answer = $llm->generate($prompt);
} catch (Exception $e) {
    abort(500);  // Complete failure
}
```

## Good Example
```php
try {
    $answer = $llm->generate($prompt);
} catch (Exception $e) {
    Log::warning('LLM unavailable, returning search results');
    return $searchResults;
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complete search outage during LLM API downtime.
