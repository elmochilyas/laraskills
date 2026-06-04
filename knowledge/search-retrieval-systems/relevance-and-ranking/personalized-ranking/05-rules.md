---
## Rule Name
Start with Signal Boosting Before User Embeddings

## Category
Design

## Rule
Implement signal boosting (boost results matching user preferences) before user embedding approaches.

## Reason
Signal boosting is simpler, more interpretable, and requires no ML infrastructure. Many applications achieve sufficient personalization with boosting alone.

## Bad Example
```php
// Complex user embedding before trying simple boosting
$userVector = generateUserEmbedding($userId);
$results = VectorSearch::search($userVector, topK: 20);
```

## Good Example
```php
// Simple signal boosting first
Product::search($query)
    ->whereIn('category', $user->preferredCategories)
    ->where('price', '<=', $user->maxBudget)
    ->get();
```

## Exceptions
High-traffic applications where signal boosting has reached diminishing returns and user embeddings are validated to improve CTR.

## Consequences Of Violation
Unnecessary ML infrastructure and complexity when simpler boosting would suffice.

---
## Rule Name
Implement Cold Start Fallback

## Category
Reliability

## Rule
Always fall back to global (non-personalized) ranking for users without interaction history.

## Reason
New users have no behavioral data. Personalization applied to cold start users produces random or empty results.

## Bad Example
```php
// Personalization on users with no history — empty preferences
$results = Product::search($query)
    ->whereIn('category', $user->preferredCategories)  // Empty array
    ->get();  // Returns nothing
```

## Good Example
```php
if ($user->hasHistory()) {
    $results = personalizedSearch($query, $user);
} else {
    $results = globalSearch($query);  // Cold start fallback
}
```

## Exceptions
Applications where user identification is always accompanied by behavioral data.

## Consequences Of Violation
New users see empty or poor results, creating a negative first experience.

---
## Rule Name
A/B Test Personalization Impact

## Category
Testing

## Rule
Always A/B test personalization against non-personalized ranking before full deployment.

## Reason
Personalization can harm search quality if user preference signals are weak or misleading. A/B testing validates improvement.

## Bad Example
```bash
# Deploying personalization without A/B test — may degrade results
```

## Good Example
```php
$abTest = runABTest(
    'personalized_vs_global',
    control: fn() => globalSearch($query),
    variant: fn() => personalizedSearch($query, $user),
    metrics: ['ctr', 'conversion_rate', 'zero_result_rate']
);
if ($abTest->variant->ctr <= $abTest->control->ctr) {
    // Revert to global ranking
}
```

## Exceptions
Low-traffic applications (<1000 queries/day) where A/B tests lack statistical power.

## Consequences Of Violation
Deploying personalization that degrades search quality for some or all users.
