---
## Rule Name
Never Expose Admin API Key to Frontend

## Category
Security

## Rule
Always use the Search-Only API Key for browser and mobile requests; never use the Admin API Key outside server-side code.

## Reason
The Admin API Key grants unrestricted access to all indexes, settings, and billing operations. Client-side exposure leads to account compromise.

## Bad Example
```javascript
// Public frontend code
const client = algoliasearch('APP_ID', 'ADMIN_API_KEY');
```

## Good Example
```javascript
const client = algoliasearch('APP_ID', 'SEARCH_ONLY_API_KEY');
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Full account takeover, unauthorized data access, and potential cost abuse.

---
## Rule Name
Set Budget Cap Before Production

## Category
Scalability

## Rule
Always configure a budget cap and usage alerts in the Algolia dashboard before launching to production.

## Reason
Algolia's per-operation pricing model means traffic surges directly translate to cost spikes without warning.

## Bad Example
```bash
# No budget configured
# Bot attack generates millions of search requests
```

## Good Example
```bash
# Budget alert at 80% in Algolia dashboard
# Hard monthly cap set
```

## Exceptions
Enterprise contracts with unlimited usage plans.

## Consequences Of Violation
Unexpected invoices, service suspension for non-payment, and emergency cost containment.

---
## Rule Name
Configure Index Settings in scout.php

## Category
Maintainability

## Rule
Always store Algolia index configuration in `config/scout.php` for version control and deployment reproducibility.

## Reason
Settings managed only through the dashboard are invisible to the development team, cause environment drift, and prevent rollback.

## Bad Example
```php
// No index-settings — all configured manually in dashboard
'algolia' => [
    'id' => env('ALGOLIA_APP_ID'),
    'secret' => env('ALGOLIA_SECRET'),
],
```

## Good Example
```php
'algolia' => [
    'id' => env('ALGOLIA_APP_ID'),
    'secret' => env('ALGOLIA_SECRET'),
    'index-settings' => [
        Product::class => [
            'searchableAttributes' => ['title', 'description', 'sku'],
            'customRanking' => ['desc(popularity)', 'desc(created_at)'],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Environment configuration drift, difficult rollbacks, and unreproducible deployments.

---
## Rule Name
Enable User Identification for Analytics

## Category
Framework Usage

## Rule
Always use `Scout::identify($user)` in authenticated contexts to enable user-specific analytics tracking.

## Reason
Without user identification, Algolia analytics cannot distinguish between users, measure per-user behavior, or personalize results.

## Bad Example
```php
public function search(Request $request)
{
    return Product::search($request->q)->paginate(20);
    // No identify call — anonymous analytics
}
```

## Good Example
```php
public function search(Request $request)
{
    if ($request->user()) {
        Scout::identify($request->user());
    }
    return Product::search($request->q)->paginate(20);
}
```

## Exceptions
Public unauthenticated search endpoints.

## Consequences Of Violation
Loss of user-level analytics, inability to personalize, and reduced search quality insights.

---
## Rule Name
Log Analytics from Day One

## Category
Design

## Rule
Always enable click analytics (`clickAnalytics: true`) and configure `SCOUT_IDENTIFY` from the initial search implementation.

## Reason
Analytics data is only valuable with historical baseline. Retrospective analytics cannot capture past user behavior.

## Bad Example
```php
// No analytics enabled at launch
Product::search($query)->paginate(20);
// No historical data when tuning relevance later
```

## Good Example
```php
Product::search($query)
    ->options(['clickAnalytics' => true])
    ->paginate(20);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
No baseline search metrics, inability to measure improvement, and guesswork-based relevance tuning.
