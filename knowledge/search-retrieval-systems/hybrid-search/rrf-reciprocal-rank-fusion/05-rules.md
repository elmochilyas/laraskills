---
## Rule Name
Implement RRF in Under 20 Lines

## Category
Maintainability

## Rule
Implement RRF as a standalone pure PHP function of under 20 lines; avoid external libraries or dependencies.

## Reason
RRF is trivially simple. External dependencies introduce unnecessary version constraints and maintenance burden.

## Bad Example
```bash
composer require vendor/rrf-library  # Unnecessary dependency
```

## Good Example
```php
function rrf(array $lists, int $k = 60, int $topK = 20): array {
    $scores = [];
    foreach ($lists as $list) {
        foreach ($list as $rank => $id) {
            $scores[$id] = ($scores[$id] ?? 0) + 1 / ($k + $rank + 1);
        }
    }
    arsort($scores);
    return array_keys(array_slice($scores, 0, $topK));
}
```

## Exceptions
Team convention requires using a specific fusion library.

## Consequences Of Violation
Unnecessary dependency and version management for a trivial algorithm.

---
## Rule Name
Normalize Input Ranks for Unequal List Lengths

## Category
Design

## Rule
Always consider rank normalization when input result lists have significantly different lengths.

## Reason
A list of 100 items gives each item lower RRF scores than a list of 10 items simply due to longer tail. This biases fusion against the shorter list.

## Bad Example
```php
$fused = rrf([$keyword100, $vector10]);  // 100-item list biased against 10-item list
```

## Good Example
```php
// Pad or trim to equal length before fusion
$keyword = array_slice($keywordResults, 0, 10);  // Match shorter list
$fused = rrf([$keyword, $vector10]);
```

## Exceptions
Both retrieval paths consistently return similar candidate pool sizes.

## Consequences Of Violation
Systematic bias favoring the retrieval path with the larger candidate pool.

---
## Rule Name
Use RRF Only When Multiple Ranked Lists Exist

## Category
Design

## Rule
Never apply RRF with only a single ranked result list.

## Reason
RRF has no effect on a single list — the sum of 1/(k+rank) is monotonically decreasing with rank, producing the same ordering.

## Bad Example
```php
// Single list — RRF is a no-op
$fused = rrf([$keywordResults], k: 60);
```

## Good Example
```php
if (count($retrievalPaths) <= 1) {
    return $singlePathResults;  // Skip fusion entirely
}
$fused = rrf($retrievalPaths, k: 60);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Dead code and unnecessary computation.
