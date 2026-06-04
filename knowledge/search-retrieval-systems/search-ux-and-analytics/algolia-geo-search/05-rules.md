---
## Rule Name
Include _geoloc in toSearchableArray

## Category
Architecture

## Rule
Always include a `_geoloc` key with lat/lng in the model's `toSearchableArray()` for geo-search.

## Reason
Algolia geo-search requires the `_geoloc` attribute on each record. Without it, geo-queries silently ignore location filtering.

## Bad Example
```php
public function toSearchableArray(): array
{
    return ['name' => $this->name, 'description' => $this->description];
    // Missing _geoloc — geo-search won't work
}
```

## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'name' => $this->name,
        'description' => $this->description,
        '_geoloc' => ['lat' => $this->latitude, 'lng' => $this->longitude],
    ];
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Geo-filters silently ignored — location-based search appears broken.

---
## Rule Name
Set aroundRadius Based on Use Case

## Category
Design

## Rule
Always set a reasonable `aroundRadius` for Algolia geo-queries based on your application context.

## Reason
Too-small radius returns few results; too-large radius defeats geo-filtering performance benefits and returns irrelevant distant results.

## Bad Example
```php
// No radius — may return country-wide results
Product::search($query)->options(['aroundLatLng' => '48.85,2.35']);
```

## Good Example
```php
// Urban: 5km, Suburban: 20km, Rural: 50km
$radius = match ($locationType) {
    'urban' => 5000,
    'suburban' => 20000,
    'rural' => 50000,
};
Product::search($query)->options([
    'aroundLatLng' => '48.85,2.35',
    'aroundRadius' => $radius,
]);
```

## Exceptions
Applications using 'all' radius with sorting by distance.

## Consequences Of Violation
Too many distant results (large radius) or too few results (small radius).

---
## Rule Name
Implement Fallback Radius on Zero Results

## Category
Reliability

## Rule
Always expand the search radius when geo-queries return zero results.

## Reason
A fixed radius may miss results just outside the boundary. Expanding the radius iteratively prevents empty geo-search results.

## Bad Example
```php
// Fixed radius — empty results close to boundary
Product::search($query)->options(['aroundRadius' => 5000])->get();
```

## Good Example
```php
$radius = 5000;
do {
    $results = Product::search($query)->options(['aroundRadius' => $radius])->get();
    $radius *= 2;
} while ($results->isEmpty() && $radius <= 100000);
```

## Exceptions
Applications where results outside the specified radius are not useful.

## Consequences Of Violation
Users see zero results when matching items exist just outside the radius boundary.
