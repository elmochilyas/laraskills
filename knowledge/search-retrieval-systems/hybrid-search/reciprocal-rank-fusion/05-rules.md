---
## Rule Name
Use RRF for Most Fusion Scenarios

## Category
Design

## Rule
Use Reciprocal Rank Fusion (RRF) as the default fusion method for combining keyword and vector search results.

## Reason
RRF is rank-based — no score normalization needed, no training, works immediately with any retrieval engines.

## Bad Example
```php
// Weighted fusion without normalization — one path dominates
$score = $keywordScore + $vectorScore;  // Different scales
```

## Good Example
```php
// RRF — rank-based, no normalization needed
function rrf(array $lists, int $k = 60, int $topK = 20): array { ... }
$fused = rrf([$keywordRanks, $vectorRanks], k: 60);
```

## Exceptions
Cross-encoder re-ranking is needed for maximum accuracy, or weighted fusion provides measurably better results for your data.

## Consequences Of Violation
Complex normalization code, brittle fusion logic, or one retrieval path dominating results.

---
## Rule Name
Use k=60 as Default for RRF

## Category
Performance

## Rule
Always start with k=60 as the damping parameter in RRF fusion.

## Reason
k=60 is empirically established as the optimal default from the original RRF paper. It balances top-ranked and lower-ranked item contributions.

## Bad Example
```php
$fused = rrf([$keyword, $vector], k: 5);  // Too low — top-1 dominates
```

## Good Example
```php
$fused = rrf([$keyword, $vector], k: 60);  // Industry standard default
```

## Exceptions
Specific data where benchmarking shows a different k value improves results.

## Consequences Of Violation
Either the top-1 result dominates (k too low) or lower ranks contribute too little (k too high).

---
## Rule Name
Limit RRF Candidate Pool to Top-100

## Category
Performance

## Rule
Always limit the input result lists to top-100 per retrieval path before applying RRF.

## Reason
RRF computation cost is O(m × n). Beyond top-100, additional candidates have negligible impact on final top-20 results.

## Bad Example
```php
$keyword = Product::search($query)->take(1000)->keys();
$vector = VectorSearch::search($embeddings, topK: 1000);
$fused = rrf([$keyword, $vector], k: 60);
```

## Good Example
```php
$keyword = Product::search($query)->take(100)->keys();
$vector = VectorSearch::search($embeddings, topK: 100);
$fused = rrf([$keyword, $vector], k: 60, topK: 20);
```

## Exceptions
Recall-critical applications where every percentage point matters.

## Consequences Of Violation
Wasted computation on candidates that rarely make the final top-20.

---
## Rule Name
Handle Empty Result Lists Gracefully

## Category
Reliability

## Rule
Always handle empty result lists in RRF to prevent PHP errors when one retrieval path returns no results.

## Reason
A failed keyword or vector query should not crash the fusion step. Graceful handling returns results from the surviving path.

## Bad Example
```php
$fused = rrf([$keywordResults, $vectorResults]);  // PHP error if empty
```

## Good Example
```php
function rrf(array $lists, int $k = 60, int $topK = 20): array {
    if (empty($lists) || count(array_filter($lists)) === 0) return [];
    // ... fusion logic that handles empty lists
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
PHP errors and search failure when one retrieval path returns no results.
