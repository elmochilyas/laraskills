---
## Rule Name
Declare Facetable Attributes in Engine Config

## Category
Architecture

## Rule
Always configure all facetable attributes in the search engine settings before indexing.

## Reason
Facets require engine-level configuration. Scout's `where()` and facet features rely on these declarations.

## Bad Example
```php
// No facet declaration — facets won't work
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
No common exceptions.

## Consequences Of Violation
Facet counts not returned, filter functionality silently broken.

---
## Rule Name
Limit Visible Facets to Top Values

## Category
UX

## Rule
Display only the top 10 facet values by count; aggregate remaining values under "Show more".

## Reason
Long facet lists overwhelm users and are rarely fully scanned. Top values capture 90%+ of user selections.

## Bad Example
```php
@foreach($facets['brand'] as $brand => $count)
    <li>{{ $brand }} ({{ $count }})</li>  <!-- 50 brands — unusable -->
@endforeach
```

## Good Example
```php
@foreach(array_slice($facets['brand'], 0, 10) as $brand => $count)
    <li>{{ $brand }} ({{ $count }})</li>
@endforeach
@if(count($facets['brand']) > 10)
    <li><button x-on:click="showAllBrands = true">Show all {{ count($facets['brand']) }} brands</button></li>
@endif
```

## Exceptions
Facets with inherently few values (<5).

## Consequences Of Violation
Poor usability — users must scroll through long lists to find desired facet values.

---
## Rule Name
Implement Dynamic Facet Count Updates

## Category
UX

## Rule
Always update facet counts dynamically when a filter is selected or deselected.

## Reason
Static facet counts mislead users — selected filters change the available result set, and facet counts must reflect the new set.

## Bad Example
```php
// Static counts — don't update when filters change
$facets = Product::search($query)->getFacets();
```

## Good Example
```php
// Dynamic counts — re-query when filters change
$facets = Product::search($query)
    ->where('category', 'electronics')  // Counts reflect this filter
    ->getFacets();
```

## Exceptions
Very low-traffic applications where re-query overhead isn't justified.

## Consequences Of Violation
Users see inaccurate facet counts, click facets that return 0 results, and have a confusing experience.
