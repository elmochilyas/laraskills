---
## Rule Name
Normalize Scores Before Weighted Fusion

## Category
Performance

## Rule
Always normalize keyword and vector scores to [0,1] before applying weighted hybrid scoring.

## Reason
Different engines produce scores on different scales. Without normalization, one retrieval path dominates regardless of α.

## Bad Example
```php
// Raw scores — vector cosine (0-1) vs BM25 (0-20+) not comparable
$score = 0.5 * $bm25Score + 0.5 * $cosineScore;
```

## Good Example
```php
function minMaxNormalize(array $scores): array {
    $min = min($scores);
    $max = max($scores);
    $range = $max - $min ?: 1;
    return array_map(fn($s) => ($s - $min) / $range, $scores);
}
$score = 0.5 * minMaxNormalize($bm25Scores) + 0.5 * minMaxNormalize($cosineScores);
```

## Exceptions
Both retrieval paths produce scores on identical scales (same engine, same model).

## Consequences Of Violation
Brittle fusion results where one path dominates, making α tuning meaningless.

---
## Rule Name
Benchmark Weighted Fusion Against RRF

## Category
Testing

## Rule
Always benchmark weighted fusion against a simple RRF baseline before deploying.

## Reason
Weighted fusion adds normalization complexity and α tuning. If RRF performs equally well, prefer the simpler approach.

## Bad Example
```bash
# Deploying weighted fusion without RRF comparison
# May not actually improve over simpler baseline
```

## Good Example
```php
$rrfNdcg = benchmark(fn() => rrfFusion($keyword, $vector));
$weightedNdcg = benchmark(fn() => weightedFusion($keyword, $vector, alpha: 0.5));
if ($weightedNdcg <= $rrfNdcg) return rrfFusion($keyword, $vector);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Deploying a more complex, harder-to-maintain fusion strategy with no measurable benefit.

---
## Rule Name
Handle Score Outliers with Robust Normalization

## Category
Reliability

## Rule
Use sigmoid normalization or score clipping to handle outlier scores in weighted fusion.

## Reason
Min-max normalization is highly sensitive to outliers — a single extreme score compresses all other scores near zero.

## Bad Example
```php
function normalize(array $scores): array {
    $min = min($scores); $max = max($scores);
    return array_map(fn($s) => ($s - $min) / ($max - $min), $scores);
    // Outlier at 1000 compresses [0, 1, 2, 1000] -> [0, 0.001, 0.002, 1]
}
```

## Good Example
```php
function sigmoidNormalize(array $scores): array {
    $mean = array_sum($scores) / count($scores);
    $std = sqrt(array_sum(array_map(fn($s) => ($s - $mean) ** 2, $scores)) / count($scores)) ?: 1;
    return array_map(fn($s) => 1 / (1 + exp(-($s - $mean) / $std)), $scores);
}
```

## Exceptions
Score distributions known to be outlier-free (bounded scoring systems like cosine similarity [0,1]).

## Consequences Of Violation
Normalization failure that compresses meaningful score differences near zero.
