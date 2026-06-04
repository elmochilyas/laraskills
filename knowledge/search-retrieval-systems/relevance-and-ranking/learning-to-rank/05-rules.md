---
## Rule Name
Exhaust Rules-Based Ranking Before LTR

## Category
Architecture

## Rule
Only consider Learning to Rank after rules-based ranking (field weights, custom ranking, synonyms) has reached diminishing returns.

## Reason
LTR requires significant ML infrastructure, training data, and ongoing maintenance. Most applications achieve sufficient relevance with rules alone.

## Bad Example
```bash
# Implementing LTR before tuning basic ranking rules
# Premature — rules may be sufficient
```

## Good Example
```php
// Step 1: tune field weights, ranking rules, custom ranking
// Step 2: add synonyms, typo tuning
// Step 3: if NDCG still below target, consider LTR
if (currentNdcg < targetNdcg && searchVolume > 10000) {
    evaluateLtrFeasibility();
}
```

## Exceptions
High-traffic search with complex ranking requirements where LTR is known to be necessary from the start.

## Consequences Of Violation
Unnecessary ML infrastructure investment when simpler tuning would suffice.

---
## Rule Name
Use Pairwise LTR for Most Applications

## Category
Design

## Rule
Prefer pairwise Learning to Rank approaches over pointwise or listwise.

## Reason
Pairwise balances implementation complexity and effectiveness. Pointwise requires accurate absolute scores (harder to collect). Listwise is more complex to train.

## Bad Example
```bash
# Pointwise — needs absolute relevance judgments (expensive to collect)
# Listwise — complex optimization; overkill for most uses
```

## Good Example
```bash
# Pairwise — learns which of two items is more relevant
# Training data: click logs (clicked > not clicked)
```

## Exceptions
Applications with existing pointwise relevance judgments or listwise metrics as primary objective.

## Consequences Of Violation
Training complexity without commensurate ranking improvement.

---
## Rule Name
Feature Engineering Over Model Choice

## Category
Design

## Rule
Invest more effort in feature engineering than model architecture selection for LTR.

## Reason
Good features consistently outperform model complexity. Click-through rate, dwell time, recency, and user preferences matter more than algorithm choice.

## Bad Example
```bash
# Tuning complex models with few features — overfitting
```

## Good Example
```php
// Feature engineering first: query features, document features, match features
$features = [
    'bm25_score', 'vector_similarity', 'popularity', 'recency',
    'click_rate', 'same_category', 'price_match', 'user_preference'
];
// Then choose simple model (pairwise) with good features
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complex models overfitting to weak features, performing worse than simple models with good features.
