---
## Rule Name
Enable Click Analytics via Scout Callback

## Category
Testing

## Rule
Always enable `clickAnalytics: true` in Algolia search queries via Scout's callback API.

## Reason
Algolia requires `clickAnalytics: true` per query to capture click events. Without it, the analytics dashboard shows queries but no click data.

## Bad Example
```php
Product::search($query)->get();  // No click analytics
```

## Good Example
```php
Product::search($query)->query(function ($algolia) {
    $algolia->setClickAnalytics(true);
})->get();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Algolia analytics dashboard shows query counts but zero click data — useless for relevance tuning.

---
## Rule Name
Configure SCOUT_IDENTIFY for User Tracking

## Category
Testing

## Rule
Always configure `SCOUT_IDENTIFY` in `.env` to link searches to authenticated users.

## Reason
Without `SCOUT_IDENTIFY`, Algolia cannot track which users perform which searches, preventing user-level analytics and personalization.

## Bad Example
```bash
# SCOUT_IDENTIFY not configured — anonymous search tracking only
# ALGOLIA_APP_ID=xxx
```

## Good Example
```bash
SCOUT_IDENTIFY=true
```

## Exceptions
Applications where user identification is not needed or restricted by privacy policy.

## Consequences Of Violation
Loss of user-level search analytics — cannot identify query patterns per user segment.

---
## Rule Name
Review Analytics Weekly

## Category
Maintainability

## Rule
Always review Algolia analytics dashboard weekly to identify trends and issues.

## Reason
Search quality degrades gradually. Weekly review catches zero-result queries, CTR drops, and trending searches before they become major issues.

## Bad Example
```bash
# Never reviewed — zero-result queries pile up unnoticed
```

## Good Example
```php
// Scheduled weekly report
$schedule->call(function () {
    $zeroResultQueries = Algolia::getTopSearches('products', ['zeroResults' => true]);
    if (count($zeroResultQueries) > 10) {
        Log::warning("High zero-result queries: " . count($zeroResultQueries));
    }
})->weekly();
```

## Exceptions
Very low-traffic search where weekly review yields no actionable data.

## Consequences Of Violation
Degraded search quality goes undetected until users complain.
