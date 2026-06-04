---
## Rule Name
Version-Control Index Settings in scout.php

## Category
Maintainability

## Rule
Always configure Algolia index settings in `config/scout.php` rather than the Algolia dashboard.

## Reason
Code-based configuration is version-controlled, reproducible across environments, and deployable via CI/CD.

## Bad Example
```php
// No index settings in code — configured manually in dashboard
// Changes lost on environment reset
```

## Good Example
```php
// config/scout.php
'algolia' => [
    'index-settings' => [
        Product::class => [
            'searchableAttributes' => ['title', 'description', 'brand'],
            'attributesForFaceting' => ['category', 'brand', 'price'],
            'customRanking' => ['desc(popularity)', 'desc(created_at)'],
        ],
    ],
],
```

## Exceptions
Frequently changing settings that are easier to manage in the dashboard.

## Consequences Of Violation
Configuration drift between environments and inability to reproduce index settings.

---
## Rule Name
Order searchableAttributes by Importance

## Category
Design

## Rule
Always order Algolia's `searchableAttributes` with the most important fields first.

## Reason
Algolia ranks results based on field attribute order. Earlier fields have higher influence on ranking.

## Bad Example
```php
'searchableAttributes' => ['description', 'tags', 'title']  // Title least important
```

## Good Example
```php
'searchableAttributes' => ['title', 'brand', 'tags', 'description']  // Title most important
```

## Exceptions
Content types where other fields are more relevant than titles (document bodies, transcripts).

## Consequences Of Violation
Less relevant top results — title matches diluted by body matches.

---
## Rule Name
Declare All attributesForFaceting

## Category
Architecture

## Rule
Always include all fields used in Scout `where()` calls in Algolia's `attributesForFaceting`.

## Reason
Algolia's filtering silently fails on undeclared facet attributes, returning unfiltered results.

## Bad Example
```php
// where() on undeclared field — silently returns unfiltered
Product::search($query)->where('category', 'electronics')->get();
```

## Good Example
```php
'attributesForFaceting' => ['category', 'brand', 'price'],
Product::search($query)->where('category', 'electronics')->get();
```

## Exceptions
Fields that will never be used for filtering.

## Consequences Of Violation
Silent filter failure — users see unfiltered results and assume filtering is broken.

---
## Rule Name
Use Replicas for Different Sort Orders

## Category
Architecture

## Rule
Use Algolia replica indexes for each required sort order (price asc, price desc, newest).

## Reason
Algolia sorts by relevance by default. Different sort orders require dedicated replica indexes with their own ranking configurations.

## Bad Example
```php
// Sorting without replica — unexpected results
Product::search($query)->orderBy('price', 'asc');
```

## Good Example
```php
// Replica index configured in scout.php
'algolia' => [
    'index-settings' => [
        Product::class => [
            'replicas' => ['products_price_asc', 'products_price_desc'],
        ],
    ],
],
// Then use in queries
Product::search($query)->orderBy('price', 'asc');
```

## Exceptions
Applications where only default relevance sorting is needed.

## Consequences Of Violation
Sort requests fail silently or return unexpected orderings.
