---
## Rule Name
Store Coordinates in geopoint Field Type

## Category
Architecture

## Rule
Always store location coordinates using Typesense's `geopoint` field type in the collection schema.

## Reason
Geo-queries (`_geo_distance`, `_geo_bounding_box`) require the `geopoint` field type. Plain string or float arrays won't work.

## Bad Example
```php
// Wrong field type — geo-queries won't work
['name' => 'location', 'type' => 'string'],
```

## Good Example
```php
['name' => 'location', 'type' => 'geopoint'],
// Data format: [lat, lng] or {lat: 48.85, lng: 2.35}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Geo-queries silently fail or return incorrect results.

---
## Rule Name
Combine Geo-Filters with Full-Text Search

## Category
Architecture

## Rule
Always combine geo-filters (`filter_by`) with keyword search (`query_by`) in a single Typesense query.

## Example
Typesense supports combined geo + text queries natively. Splitting into separate geo and text queries eliminates the engine's ability to optimize combined search.

## Bad Example
```php
// Separate queries — can't combine geo + text relevance
```

## Good Example
```php
Product::search($query)->options([
    'query_by' => 'name,description',
    'filter_by' => '_geo_distance(location, 48.85, 2.35, 5000)',
    'sort_by' => '_geo_distance(location, 48.85, 2.35):asc',
])->get();
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Inability to have geo-aware textual search rankings.

---
## Rule Name
Set Reasonable Radius Limits

## Category
Performance

## Rule
Always set a maximum search radius for geo-queries to prevent unbounded scans.

## Reason
Unbounded geo-queries scan all documents, negating the performance benefit of radius filtering.

## Bad Example
```php
// No radius limit — scans all documents
'filter_by' => '_geo_distance(location, 48.85, 2.35, 100000)',  // 100km — too large
```

## Good Example
```php
'filter_by' => '_geo_distance(location, 48.85, 2.35, 5000)',  // 5km — focused
```

## Exceptions
Rural applications where larger radius is needed for sufficient results.

## Consequences Of Violation
Slow geo-queries scanning all documents instead of efficiently filtering by radius.
