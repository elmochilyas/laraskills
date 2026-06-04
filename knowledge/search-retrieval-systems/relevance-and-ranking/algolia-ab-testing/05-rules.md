---
## Rule Name
Test One Change at a Time

## Category
Testing

## Rule
Always test a single configuration change per A/B test in Algolia.

## Reason
Multiple simultaneous changes make it impossible to attribute metric changes to a specific change. Single-variable tests yield actionable results.

## Bad Example
```bash
# Multiple changes in one test — cannot identify which caused improvement
# A: default settings
# B: new ranking rules + different searchableAttributes + new facets
```

## Good Example
```bash
# Test 1: searchableAttributes order only
# Test 2: customRanking rules (if Test 1 deployed)
```

## Exceptions
Combined configuration bundles that are deployed as a unit.

## Consequences Of Violation
Inconclusive A/B test results — unknown which change caused improvement or regression.

---
## Rule Name
Run Tests Minimum One Week

## Category
Testing

## Rule
Always run A/B tests for at least one full week to capture weekly usage patterns.

## Reason
Search behavior varies by day of week (weekday vs weekend queries). Shorter tests miss these patterns and produce biased results.

## Bad Example
```bash
# 2-day test — misses weekend vs weekday differences
```

## Good Example
```bash
# 14-day test — captures two full weekly cycles
# Minimum: 7 days
```

## Exceptions
High-traffic applications where statistical significance is reached in under 7 days.

## Consequences Of Violation
Biased test results that don't reflect real-world search patterns across all days.

---
## Rule Name
Define Primary Success Metric Before Starting

## Category
Testing

## Rule
Always define the primary success metric (CTR, conversion rate, zero-result rate) before starting an A/B test.

## Reason
Post-hoc metric selection introduces confirmation bias. Pre-defined metrics ensure objective evaluation.

## Bad Example
```bash
# Running test without clear primary metric
# After: cherry-picking the metric that shows improvement
```

## Good Example
```bash
# Pre-defined: primary = CTR, secondary = zero-result rate
# Evaluate against these pre-set metrics only
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Confirmation bias — declaring success based on whichever metric happened to improve.

---
## Rule Name
Ensure Minimum Traffic for Statistical Validity

## Category
Testing

## Rule
Only run A/B tests when search traffic exceeds 1000 queries per day.

## Reason
Low-traffic tests lack statistical power to detect meaningful differences. Results are indistinguishable from random noise.

## Bad Example
```bash
# 50 queries/day — not enough data for meaningful results
```

## Good Example
```php
if (dailySearchQueries() < 1000) {
    // Use offline evaluation instead of A/B test
    evaluateOffline($baseline, $variant);
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Inconclusive results — the test cannot distinguish between real improvement and random variation.
