---
## Rule Name
Create Query Test Set Before Tuning

## Category
Testing

## Rule
Always create a curated set of 50-100 representative queries with expected top-3 results before starting relevance tuning.

## Reason
Without a test set, tuning decisions are subjective and unmeasurable. A test set provides the baseline to measure improvement against.

## Bad Example
```bash
# Tuning without test set — success measured by gut feel
```

## Good Example
```php
$testQueries = [
    ['query' => 'red running shoes', 'expected' => [101, 203, 45]],
    ['query' => 'wireless headphones', 'expected' => [88, 12, 67]],
    // ... 50-100 queries
];
$baselineNdcg = evaluateRanking($testQueries, 'current_config');
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Subjective, unreproducible relevance tuning that may not actually improve search quality.

---
## Rule Name
Tune in Order of Impact

## Category
Maintainability

## Rule
Always follow the tuning hierarchy: data quality → field weights → typo tolerance → ranking rules → custom ranking → personalization.

## Reason
Data quality has the highest impact on relevance. Tuning lower-level levers before fixing data quality wastes effort and masks the real issues.

## Bad Example
```php
// Tuning custom ranking before fixing data quality — premature
$index->updateRankingRules(['popularity:desc', ...]);
// Still have missing titles, wrong categories
```

## Good Example
```bash
# 1. Fix data quality (missing titles, wrong categories)
# 2. Tune field weights (title > description > tags)
# 3. If needed: typo tolerance, ranking rules, custom ranking
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complex tuning adjustments that don't address the root cause of poor relevance.

---
## Rule Name
Document Every Tuning Change

## Category
Maintainability

## Rule
Always document each tuning change: why it was made, what was changed, and what the impact was.

## Reason
Undocumented tuning is unreproducible. Future team members (including future you) need to understand the ranking configuration rationale.

## Bad Example
```bash
# Changed ranking rules last week — no record of why
```

## Good Example
```php
// 2024-03-15: Added popularity:desc ranking rule
// Reason: Homepage searches showed 40% CTR on popular items
// Impact: +12% CTR on top-3 results, NDCG unchanged
// Revert: comment out popularity rule and re-index
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unreproducible tuning changes and knowledge loss when team members change.
