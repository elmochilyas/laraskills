---
## Rule Name
Place Custom Ranking After Default Rules

## Category
Design

## Rule
Always append custom ranking rules after the default text relevance rules in Meilisearch.

## Reason
Default rules handle text relevance (words, typo, proximity). Custom ranking should refine, not override, text results.

## Bad Example
```php
$index->updateRankingRules(['popularity:desc', 'words', 'typo']);  // Business signal overrides relevance
```

## Good Example
```php
$index->updateRankingRules([
    'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
    'popularity:desc', 'created_at:desc'  // Business signals after text rules
]);
```

## Exceptions
Applications where business metrics must override text relevance (promotional campaigns).

## Consequences Of Violation
Popular but textually irrelevant results ranking above meaningful matches.

---
## Rule Name
Use Numeric Attributes Only

## Category
Design

## Rule
Only use numeric attributes for custom ranking rules in Meilisearch.

## Reason
Meilisearch custom ranking only supports ascending/descending sort on numeric fields. Non-numeric attributes are silently ignored or cause errors.

## Bad Example
```php
// String attribute — won't work as custom ranking
$index->updateRankingRules(['name:asc']);
```

## Good Example
```php
// Numeric attributes only
$index->updateRankingRules([
    'popularity:desc',  // integer
    'created_at:desc',  // timestamp
    'price:asc',        // float
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent failure — custom ranking on non-numeric attributes has no effect.

---
## Rule Name
Test Custom Ranking Impact on Text Relevance

## Category
Testing

## Rule
Always test that custom ranking rules do not excessively dilute text relevance.

## Reason
Aggressive custom ranking (very high popularity weights) can push textually relevant results below popular but irrelevant matches.

## Bad Example
```php
// Very strong popularity boost — may drown text relevance
$index->updateRankingRules(['words', 'typo', 'popularity:desc']);
```

## Good Example
```php
$before = evaluateRanking(fn() => searchWithDefaults($query));
$after = evaluateRanking(fn() => searchWithCustomRanking($query));
// Ensure custom ranking improves or maintains NDCG
assert($after['ndcg'] >= $before['ndcg']);
```

## Exceptions
Applications where business goals (clearance sales, promotions) explicitly prioritize certain items.

## Consequences Of Violation
Degraded user experience from popular but irrelevant results at top of search.
