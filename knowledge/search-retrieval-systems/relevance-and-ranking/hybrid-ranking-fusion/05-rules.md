---
## Rule Name
Start with RRF Before Weighted Fusion

## Category
Design

## Rule
Use Reciprocal Rank Fusion (RRF) as the default hybrid ranking fusion method before considering weighted fusion or cross-encoder re-ranking.

## Reason
RRF requires no tuning, no score normalization, and works immediately with any retrieval path. It is the simplest effective fusion method.

## Bad Example
```php
// Complex weighted fusion with normalization as first attempt
$normalized = normalize(minMax($keywordScores));
$fused = weightedSum($keywordScores, $vectorScores, alpha: 0.5);
```

## Good Example
```php
// RRF first — simple, no tuning, works immediately
$fused = rrfFusion($keywordRanks, $vectorRanks, k: 60, topK: 20);
```

## Exceptions
Applications where weighted fusion provides measurably better quality than RRF with specific data.

## Consequences Of Violation
Unnecessary complexity (normalization, α tuning) when RRF would produce comparable or better results.

---
## Rule Name
Benchmark Individual Paths Before Fusing

## Category
Testing

## Rule
Always benchmark each retrieval path's quality independently before evaluating fusion improvement.

## Reason
Fusion cannot fix a fundamentally broken retrieval path. If one path has poor recall, fix it before expecting fusion to help.

## Bad Example
```bash
# Fusing without checking individual paths — one may be broken
# Tuning fusion when path quality is the problem
```

## Good Example
```php
$keywordQuality = benchmark(fn() => keywordSearch($query));
$vectorQuality = benchmark(fn() => vectorSearch($query));
if ($keywordQuality['recall'] < 0.7) improveKeywordSearch();
if ($vectorQuality['recall'] < 0.7) improveVectorSearch();
// Only then evaluate hybrid fusion
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Poor hybrid results masked as fusion problem when root cause is poor individual path quality.

---
## Rule Name
Limit Fusion Input to Top-100

## Category
Performance

## Rule
Always limit candidate pool to top-100 per retrieval path before fusion.

## Reason
Fusing more than top-100 candidates provides diminishing recall returns while increasing computation and latency.

## Bad Example
```php
$keyword = Product::search($query)->take(1000)->keys();
$vector = VectorSearch::search($embeddings, topK: 1000);
$fused = rrf($keyword, $vector);  // 2000 candidates — diminishing returns
```

## Good Example
```php
$keyword = Product::search($query)->take(100)->keys();
$vector = VectorSearch::search($embeddings, topK: 100);
$fused = rrf($keyword, $vector, topK: 20);  // 200 candidates — sufficient
```

## Exceptions
Recall-critical applications where every percentage point matters and latency budget allows larger pools.

## Consequences Of Violation
Wasted computation on candidates that rarely make the final top-K.
