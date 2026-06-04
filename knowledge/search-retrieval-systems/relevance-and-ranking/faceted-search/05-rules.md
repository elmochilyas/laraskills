---
## Rule Name
Declare All Facetable Attributes in Engine Config

## Category
Architecture

## Rule
Always declare all facetable attributes in the search engine settings before indexing data.

## Reason
Facets silently fail on undeclared attributes. Scout's `where()` and facet features won't work without proper engine configuration.

## Bad Example
```php
// Faceting on undeclared attribute — silently returns no counts
Product::search($query)->where('category', 'electronics')->get();
```

## Good Example
```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        Product::class => [
            'filterableAttributes' => ['category', 'brand', 'price', 'rating'],
        ],
    ],
],
```

## Exceptions
Fields that will never be used for faceting or filtering.

## Consequences Of Violation
Facet counts not returned, filter functionality silently broken.

---
## Rule Name
Limit Visible Facet Values

## Category
UX

## Rule
Display only the top 5-10 facet values; aggregate the rest under "Show more".

## Reason
Showing too many facet values overwhelms users. Long lists of facet values (50+ brands) are unusable without searching or scrolling.

## Bad Example
```php
// Displaying all 50 brands — unusable UI
@foreach($facets['brand'] as $brand => $count)
    <li>{{ $brand }} ({{ $count }})</li>
@endforeach
```

## Good Example
```php
@foreach(array_slice($facets['brand'], 0, 10) as $brand => $count)
    <li>{{ $brand }} ({{ $count }})</li>
@endforeach
@if(count($facets['brand']) > 10)
    <li><button>Show all {{ count($facets['brand']) }} brands</button></li>
@endif
```

## Exceptions
Facets with very few values (gender, size).

## Consequences Of Violation
Overwhelming UI with too many facet choices, reducing usability.

---
## Rule Name
Order Facets by Importance

## Category
UX

## Rule
Always order facets with the most important attributes first (category, price, brand).

## Reason
Users scan facets top-to-bottom. Important facets should appear first without scrolling.

## Bad Example
```php
// Alphabetical order — not prioritizing important facets
['brand', 'category', 'color', 'price', 'size']
```

## Good Example
```php
// Importance order — most used filters first
['category', 'price', 'brand', 'size', 'color']
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users miss important filtering options that appear below the fold.
