---
## Rule Name
Always Use Search-Only Key for Frontend

## Category
Security

## Rule
Never use the Admin API Key in any frontend or client-side code; always use the Search-Only API Key for public search requests.

## Reason
The Admin API Key provides full control over indexes, settings, and billing. Exposure leads to account compromise and cost abuse.

## Bad Example
```javascript
// Frontend code — Admin key exposed
algolia.init({
  appId: 'YOUR_APP_ID',
  apiKey: process.env.ALGOLIA_ADMIN_KEY
});
```

## Good Example
```javascript
algolia.init({
  appId: 'YOUR_APP_ID',
  apiKey: process.env.ALGOLIA_SEARCH_KEY
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Full account compromise, unauthorized index operations, and massive cost overruns.

---
## Rule Name
Set Budget Cap to Control Costs

## Category
Scalability

## Rule
Always configure a budget cap and usage alerts in the Algolia dashboard before going to production.

## Reason
Algolia's per-query pricing means traffic spikes directly increase costs. Without caps, marketing campaigns or abuse can cause unexpected bills.

## Bad Example
```bash
# No budget caps configured
# Viral campaign -> thousands in unexpected charges
```

## Good Example
```bash
# Configure budget alert at 80% of monthly limit
# Set hard cap if available in plan
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Unexpected infrastructure costs, budget overruns, and emergency service disruption.

---
## Rule Name
Configure Index Settings in scout.php

## Category
Maintainability

## Rule
Always store Algolia index settings in `config/scout.php` under `algolia.index-settings` for version control and reproducibility.

## Reason
Dashboard-only configuration is invisible to team members, unreviewable, and irreproducible in new environments.

## Bad Example
```php
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
            'searchableAttributes' => ['title', 'description'],
            'attributesForFaceting' => ['category'],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Configuration drift, difficulty debugging search behavior, and unreproducible environments.

---
## Rule Name
Monitor Monthly Usage

## Category
Scalability

## Rule
Always review Algolia usage metrics (operations count, search volume) monthly to track costs and plan capacity.

## Reason
Algolia costs scale with usage. Without monitoring, gradual traffic growth goes unnoticed until the invoice arrives.

## Bad Example
```bash
# Never reviewing usage — surprised by month-end bills
```

## Good Example
```bash
# Monthly review of Algolia dashboard:
# - Search operations count
# - Record count
# - Cost projection
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Budget overruns from unchecked usage growth and inability to forecast infrastructure costs.
