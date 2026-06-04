---
## Rule Name
Never Expose the Admin API Key Client-Side

## Category
Security

## Rule
Always use the Search-Only API Key for frontend requests; never use the Admin API Key in client-side code.

## Reason
The Admin API Key grants full access to create, modify, and delete indexes and settings. Exposure leads to account compromise.

## Bad Example
```javascript
fetch('https://YOUR_APP_ID.algolia.net/1/indexes/products/query', {
  headers: { 'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_KEY }
});
```

## Good Example
```javascript
fetch('https://YOUR_APP_ID.algolia.net/1/indexes/products/query', {
  headers: { 'X-Algolia-API-Key': process.env.ALGOLIA_SEARCH_KEY }
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Full account compromise, unauthorized index manipulation, and potentially massive cost overruns from abuse.

---
## Rule Name
Configure Index Settings in Code, Not Dashboard

## Category
Maintainability

## Rule
Always define Algolia index settings in `config/scout.php` under `algolia.index-settings` rather than in the Algolia dashboard.

## Reason
Dashboard-only configuration is invisible to other developers, unreviewable in PRs, and lost on environment rebuild.

## Bad Example
```php
// Empty index-settings — all config exists only in dashboard
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
            'searchableAttributes' => ['title', 'description', 'brand'],
            'attributesForFaceting' => ['category', 'brand'],
        ],
    ],
],
```

## Exceptions
Ephemeral A/B test configurations that are actively managed in dashboard.

## Consequences Of Violation
Configuration drift between environments, unreproducible setups, and difficult rollbacks.

---
## Rule Name
Set Budget Caps and Usage Alerts

## Category
Scalability

## Rule
Always configure budget caps and usage alerts in the Algolia dashboard before processing production traffic.

## Reason
Algolia prices per search request plus record count. Traffic spikes from marketing campaigns or bot attacks can cause unexpected costs.

## Bad Example
```bash
# No budget alerts configured
# Traffic spike from social media -> thousands in unexpected charges
```

## Good Example
```bash
# Configure in Algolia dashboard:
# Budget alert at 80% of monthly budget
# Usage alert at 500K operations/day
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected infrastructure bills, financial overruns, and emergency service restrictions.

---
## Rule Name
Use SCOUT_IDENTIFY for Analytics

## Category
Framework Usage

## Rule
Always call `Scout::identify($user)` in authenticated contexts to link searches to users for analytics.

## Reason
Without user identification, Algolia analytics cannot track per-user behavior, personalize results, or measure search-to-conversion funnels.

## Bad Example
```php
public function search(Request $request)
{
    // No user identification — anonymous analytics
    return Product::search($request->q)->paginate(20);
}
```

## Good Example
```php
use Laravel\Scout\Scout;

public function search(Request $request)
{
    if ($request->user()) {
        Scout::identify($request->user());
    }
    return Product::search($request->q)->paginate(20);
}
```

## Exceptions
Public, unauthenticated search endpoints.

## Consequences Of Violation
Limited analytics data, inability to measure per-user search quality, and lost personalization opportunity.

---
## Rule Name
Set Relevance Tiers via searchableAttributes Order

## Category
Design

## Rule
Always order `searchableAttributes` by field importance, with the most relevant field first.

## Reason
Algolia uses `searchableAttributes` order to determine field weighting. Fields listed first have higher relevance impact on ranking.

## Bad Example
```php
'searchableAttributes' => ['description', 'title', 'sku'],
// Description matched first — less relevant than title
```

## Good Example
```php
'searchableAttributes' => ['title', 'brand', 'description', 'sku'],
// Title matched first — highest relevance weight
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal search ranking where body content outranks titles, degrading user search experience.

---
## Rule Name
Use Environment-Specific Algolia Applications

## Category
Architecture

## Rule
Always use a separate Algolia application (or at minimum separate indexes) for each environment: dev, staging, and production.

## Reason
Shared indexes cause data contamination, accidental deletion of production data during testing, and skew analytics.

## Bad Example
```env
ALGOLIA_APP_ID=PRODUCTION_APP_ID
# Same app for all environments
```

## Good Example
```env
# .env.production
ALGOLIA_APP_ID=PROD_APP_ID

# .env.staging
ALGOLIA_APP_ID=STAGING_APP_ID
```

## Exceptions
Single-developer projects with no separate staging environment.

## Consequences Of Violation
Accidental production index corruption, unreliable staging data, and polluted analytics.
