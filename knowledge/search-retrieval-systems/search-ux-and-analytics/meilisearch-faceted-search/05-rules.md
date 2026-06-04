---
## Rule Name
Declare All Filterable Attributes Before Indexing

## Category
Architecture

## Rule
Always configure all filterable attributes in Meilisearch settings before importing data.

## Reason
Meilisearch only returns facet counts for declared filterable attributes. Undeclared attributes silently return no facet data.

## Bad Example
```php
// No filterable declaration — facets silently fail
Product::search($query)->where('category', 'electronics')->get();
```

## Good Example
```php
// config/scout.php
'meilisearch' => ['index-settings' => [
    Product::class => ['filterableAttributes' => ['category', 'brand', 'price']],
]],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Facet counts not returned, filter functionality silently broken.

---
## Rule Name
Limit Display Facets to Most Relevant

## Category
UX

## Rule
Display only the most relevant 10 facet values by count; aggregate the rest.

## Reason
Showing all 50 brand values overwhelms users and reduces UI usability.

## Bad Example
```php
// Displaying all facet values — unusable
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
    <li><a href="#">Show all {{ count($facets['brand']) }} brands</a></li>
@endif
```

## Exceptions
Facets with inherently few values (<10).

## Consequences Of Violation
Overwhelming facet UI that users don't engage with.

---
## Rule Name
Enable Facet Search for Large Value Lists

## Category
UX

## Rule
Always enable Meilisearch's facet search for attributes with 100+ values.

## Reason
Scrolling through hundreds of facet values is impractical. Facet search lets users type to find the value they need.

## Bad Example
```php
// 500 brands — no search, unusable
$results = Product::search($query)->getFacets(['brand']);
```

## Good Example
```php
// Facet search enabled — user can type to find brand
$results = Product::search($query)->getFacets(['brand' => ['search' => 'sony']]);
```

## Exceptions
Facets with <100 values where search isn't needed.

## Consequences Of Violation
Users cannot find specific values in large facet lists.
