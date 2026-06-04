---
## Rule Name
Declare Facetable Fields in Schema

## Category
Architecture

## Rule
Always set `facet: true` for all filterable fields in the Typesense collection schema before indexing.

## Reason
Typesense only returns facet counts for fields declared with `facet: true`. Undeclared fields silently return no facet data.

## Bad Example
```php
// No facet declaration — no facet counts returned
Product::search($query)->where('category', 'electronics')->get();
```

## Good Example
```php
// Collection schema with facet declarations
'fields' => [
    ['name' => 'category', 'type' => 'string', 'facet' => true],
    ['name' => 'brand', 'type' => 'string', 'facet' => true],
    ['name' => 'price', 'type' => 'float', 'facet' => true],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Facet counts not returned — faceted search UI silently broken.

---
## Rule Name
Display Top Facet Values by Count

## Category
UX

## Rule
Always order facet values by count in descending order in the UI.

## Reason
Users most frequently engage with popular facet values. Ordering by count surfaces the most used values first.

## Bad Example
```php
// Alphabetical order — popular values may be buried
Category: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
```

## Good Example
```php
// Count order — popular values first
Category: Electronics (1200), Clothing (800), Books (350), Music (200)
```

## Exceptions
Facets where alphabetical order makes more sense (sizes, ratings).

## Consequences Of Violation
Users must scroll past irrelevant values to find popular options.

---
## Rule Name
Enable Facet Search for High-Cardinality Facets

## Category
UX

## Rule
Always enable facet search for facets with 100+ unique values.

## Reason
Scrolling through 500 brands is impractical. Facet search lets users type to find specific values.

## Bad Example
```php
// 500 brands — no built-in search
$results = Product::search($query)->options(['facets' => ['brand']]);
```

## Good Example
```php
$results = Product::search($query)->options([
    'facets' => ['brand'],
    'facet_query' => 'sony',
]);
```

## Exceptions
Facets with inherently few values (<100).

## Consequences Of Violation
Users cannot efficiently find specific values in large facet lists.
