---
## Rule Name
Start with RRF Before Weighted Fusion

## Category
Design

## Rule
Use Reciprocal Rank Fusion (RRF) as the default fusion strategy; only move to weighted fusion if RRF does not meet quality requirements.

## Reason
RRF requires no score normalization and works immediately. Weighted fusion adds complexity (normalization, α tuning) that may not yield measurably better results.

## Bad Example
```php
// Complex weighted fusion without trying RRF first
$normalizedKeyword = normalize($keywordScores);
$normalizedVector = normalize($vectorScores);
$fused = weightedFusion($normalizedKeyword, $normalizedVector, alpha: 0.5);
```

## Good Example
```php
// RRF first — simple, effective
$fused = rrfFusion($keywordRanks, $vectorRanks, k: 60);
// Upgrade to weighted only if benchmarks show improvement
```

## Exceptions
Applications requiring fine-grained α control per query type or category.

## Consequences Of Violation
Unnecessary complexity and brittle normalization logic without measurable quality improvement.

---
## Rule Name
Always Normalize Scores Before Weighted Fusion

## Category
Performance

## Rule
Always normalize keyword and vector scores to [0,1] before applying weighted fusion.

## Reason
Different search engines produce scores on different scales. Raw scores are incomparable — one path will dominate fusion without normalization.

## Bad Example
```php
// No normalization — vector will dominate (or be dominated)
$score = 0.5 * $keywordScore + 0.5 * $vectorScore;
```

## Good Example
```php
function normalize(array $scores): array {
    $min = min($scores);
    $max = max($scores);
    $range = $max - $min ?: 1;
    return array_map(fn($s) => ($s - $min) / $range, $scores);
}
$nKeyword = normalize($keywordScores);
$nVector = normalize($vectorScores);
$score = 0.5 * $nKeyword + 0.5 * $nVector;
```

## Exceptions
Both engines produce scores on the identical scale (e.g., same engine, same model).

## Consequences Of Violation
Weighted fusion produces meaningless results dominated by one retrieval path's scoring scale.

---
## Rule Name
Benchmark Weighted Fusion Against RRF

## Category
Testing

## Rule
Always benchmark weighted fusion against a simple RRF baseline before deploying.

## Reason
Weighted fusion must provide measurable quality improvement to justify its added complexity. If RRF performs equally well, prefer the simpler approach.

## Bad Example
```bash
# Deploying weighted fusion without comparison
# May not actually improve over RRF
```

## Good Example
```php
$rrfQuality = benchmarkQuality(fn() => rrfFusion(...));
$weightedQuality = benchmarkQuality(fn() => weightedFusion(...));
if ($weightedQuality['ndcg'] <= $rrfQuality['ndcg']) {
    // Use simpler RRF instead
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Deploying a more complex system that provides no measurable benefit over simpler alternatives.

---
## Rule Name
Test α in 0.3-0.7 Range

## Category
Testing

## Rule
Always test weight parameter α within the 0.3-0.7 range and tune empirically for your data.

## Reason
Extreme α values (0 or 1) defeat the purpose of hybrid search. The optimal balance is data-dependent and must be discovered through testing.

## Bad Example
```php
$fused = weightedFusion($keyword, $vector, alpha: 0.5);  // Guessed default
```

## Good Example
```php
$alphas = [0.3, 0.4, 0.5, 0.6, 0.7];
$best = null;
$bestScore = 0;
foreach ($alphas as $alpha) {
    $score = benchmarkQuality(fn() => weightedFusion($keyword, $vector, alpha: $alpha));
    if ($score > $bestScore) { $best = $alpha; $bestScore = $score; }
}
// Use best α in production
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal keyword-vector balance, potentially matching RRF quality without the additional flexibility.
