---
## Rule Name
Run Offline Evaluation Before A/B Test

## Category
Testing

## Rule
Always evaluate ranking changes offline with a test set before running a live A/B test.

## Reason
Offline evaluation catches regressions without exposing users to potentially worse results.

## Bad Example
```bash
# Direct A/B test without offline evaluation — users experience degradation
```

## Good Example
```php
$offlineNdcg = evaluateOffline($loadTestSet(), 'proposed_config');
if ($offlineNdcg > $baselineNdcg) {
    runABTest('proposed_config', 'current_config');
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users experience search degradation during A/B tests that could have been caught offline.

---
## Rule Name
Define Primary Metric Before Starting

## Category
Testing

## Rule
Always define the primary success metric before starting a search A/B test.

## Reason
Post-hoc metric selection introduces confirmation bias. Pre-defined metrics ensure objective evaluation.

## Bad Example
```bash
# No primary metric — after seeing results, pick the one that shows improvement
```

## Good Example
```php
$abTest = new SearchABTest(
    name: 'ranking_v2',
    primaryMetric: 'ctr',
    secondaryMetrics: ['conversion_rate', 'zero_result_rate'],
    minimumEffect: 0.05,
);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Confirmation bias — declaring success based on whichever metric happened to improve.

---
## Rule Name
Run Tests Minimum One Week

## Category
Testing

## Rule
Always run search A/B tests for at least one full week to capture weekly usage patterns.

## Reason
Search behavior varies by day of week. A 3-day test may miss weekend patterns and produce biased results.

## Bad Example
```bash
# 3-day A/B test — misses weekend vs weekday differences
```

## Good Example
```bash
# 14-day test captures two full weekly cycles
```

## Exceptions
High-traffic applications where statistical significance is reached in under 7 days.

## Consequences Of Violation
Biased A/B test results that don't reflect real-world search patterns.
