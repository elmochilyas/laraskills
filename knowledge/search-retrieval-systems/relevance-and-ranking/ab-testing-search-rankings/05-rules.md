---
## Rule Name
Run Offline Evaluation First

## Category
Testing

## Rule
Always evaluate ranking changes offline (test set with NDCG/MRR) before running an A/B test with live traffic.

## Reason
Offline evaluation is fast, cheap, and identifies regressions without exposing users to potentially worse results.

## Bad Example
```bash
# Direct A/B test without offline evaluation
# Users exposed to potentially degraded search
```

## Good Example
```php
$baselineNdcg = evaluateOffline($queries, 'current_config');
$proposedNdcg = evaluateOffline($queries, 'proposed_config');
if ($proposedNdcg > $baselineNdcg) {
    // Worth running A/B test with real traffic
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users experience search degradation during A/B tests that could have been caught offline.

---
## Rule Name
Define Primary Metric Before Testing

## Category
Testing

## Rule
Always define the primary success metric before starting an A/B test, not after results are collected.

## Reason
Post-hoc metric selection introduces confirmation bias. Pre-defined metrics ensure objective evaluation.

## Bad Example
```bash
# No pre-defined metric — after seeing results, pick the one that shows improvement
```

## Good Example
```php
// Pre-test documentation
$testConfig = [
    'primary_metric' => 'ctr',
    'secondary_metrics' => ['conversion_rate', 'zero_result_rate', 'average_click_position'],
    'minimum_effect' => 0.05,  // 5% improvement
];
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Confirmation bias — declaring success based on whichever metric happened to improve.

---
## Rule Name
Calculate Required Sample Size Upfront

## Category
Testing

## Rule
Always calculate the required sample size (query count) before starting an A/B test using power analysis.

## Reason
Insufficient sample size leads to inconclusive results. Running a test that can never reach significance wastes time.

## Bad Example
```bash
# Starting A/B test without sample size calculation
# May never reach statistical significance
```

## Good Example
```php
// Power analysis: baseline CTR 5%, minimum detectable effect 10%
// Required: ~50,000 queries per variant
if (expectedQueriesPerWeek() < 100000) {
    // Extend test duration or accept larger minimum effect
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Inconclusive A/B test results after weeks of running — wasted effort.
