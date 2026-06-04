---
## Rule Name
Start with Spelling Correction Before Expansion

## Category
Design

## Rule
Implement spelling correction before query expansion or HyDE in the RAG pipeline.

## Reason
Spelling correction is simple, fast (<5ms), and directly fixes the most common retrieval issue — typos. Expansion and HyDE add complexity that may not be needed.

## Bad Example
```php
// Complex HyDE before fixing typos
$hypothetical = $llm->generate("Write a document about: $query");
$embedding = $embedder->embed($hypothetical);
```

## Good Example
```php
// Spelling correction first — fast and impactful
$corrected = $spellChecker->correct($query);
$embedding = $embedder->embed($corrected);
```

## Exceptions
Applications where user queries are rarely misspelled (API-to-API search).

## Consequences Of Violation
Expensive rewriting techniques applied to queries that typos prevent from matching.

---
## Rule Name
Cache All Rewritten Queries

## Category
Performance

## Rule
Always cache rewritten/expanded queries to avoid redundant processing.

## Reason
The same query is rewritten identically each time. LLM-based rewriting takes 100-500ms. Caching eliminates repeated work.

## Bad Example
```php
// Re-rewrites same query every time
$rewritten = $rewriter->rewrite($query);
```

## Good Example
```php
$rewritten = Cache::remember("rewritten:$query", 86400, fn() => $rewriter->rewrite($query));
```

## Exceptions
Queries that are almost never repeated.

## Consequences Of Violation
100-500ms overhead on every repeated query for a computation that produces identical results.

---
## Rule Name
Keep Original Query as Fallback

## Category
Reliability

## Rule
Always use both the rewritten query AND the original query for retrieval; do not replace the original.

## Reason
Rewriting can degrade query semantics. If rewriting is harmful, the original query still returns good results. Using both ensures neither is lost.

## Bad Example
```php
// Replaces original — if rewriting degrades, retrieval fails
$query = $rewriter->rewrite($original);
$results = search($query);
```

## Good Example
```php
// Use both original and rewritten
$rewritten = $rewriter->rewrite($original);
$results = hybridSearch([$original, $rewritten]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
All retrieval quality lost if query rewriting degrades the semantics.
