---
## Rule Name
Keep Default Ranking Rule Order

## Category
Design

## Rule
Keep Meilisearch's default ranking rule order unless you have a specific, tested reason to change it.

## Reason
The default rules (words, typo, proximity, attribute, sort, position, exactness) have been tuned for general-purpose search by Meilisearch. Changing order risks degrading relevance.

## Bad Example
```php
// Reordering rules without testing — likely degrades relevance
$index->updateRankingRules(['exactness', 'words', 'typo', 'sort']);
```

## Good Example
```php
// Append custom rules after defaults — preserve text relevance
$index->updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'popularity:desc',
]);
```

## Exceptions
Specific use cases where testing shows different rule ordering improves relevance.

## Consequences Of Violation
Degraded search relevance from rule order that doesn't align with user expectations.

---
## Rule Name
Add Custom Ranking After Default Rules

## Category
Design

## Rule
Always add custom ranking rules (popularity, recency) after all seven default text relevance rules.

## Reason
Text relevance should be the primary ranking criterion. Business signals should refine, not override, text-based ranking.

## Bad Example
```php
// Custom ranking before text rules — business signals dominate relevance
$index->updateRankingRules(['popularity:desc', 'words', 'typo', 'proximity']);
```

## Good Example
```php
// Custom ranking after text rules — business signals refine relevance
$index->updateRankingRules([
    'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
    'popularity:desc',
]);
```

## Exceptions
Applications where business metrics (inventory clearance, promotions) must override text relevance.

## Consequences Of Violation
Highly popular but textually irrelevant results ranking above precise matches.

---
## Rule Name
Test Rule Changes Before Production

## Category
Testing

## Rule
Always A/B test ranking rule changes with representative queries before deploying to production.

## Reason
Ranking rule changes have unpredictable effects on different query types. Testing reveals regressions before users experience them.

## Bad Example
```bash
# Deploying rule changes without testing — undetected regressions
```

## Good Example
```php
$baselineQuality = benchmarkQueries('current_rules');
$proposedQuality = benchmarkQueries('proposed_rules');
if ($proposedQuality['ndcg'] < $baselineQuality['ndcg']) {
    // Revert proposed changes
}
```

## Exceptions
Minor changes like removing unused rules where degradation is impossible.

## Consequences Of Violation
Search quality regression reaching production users without detection.
