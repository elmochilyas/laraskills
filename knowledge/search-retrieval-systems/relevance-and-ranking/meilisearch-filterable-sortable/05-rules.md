---
## Rule Name
Declare Filterable Attributes Before Indexing

## Category
Architecture

## Rule
Always declare `filterableAttributes` in Scout config before importing data into Meilisearch.

## Reason
Meilisearch only allows filtering on explicitly declared attributes. Scout's `where()` silently fails on undeclared fields. Declaration after indexing requires full re-import.

## Bad Example
```php
// Using where() without declaring — silently returns unfiltered results
Product::search($query)->where('category_id', 5)->get();
```

## Good Example
```php
// config/scout.php
'meilisearch' => [
    'index-settings' => [
        Product::class => [
            'filterableAttributes' => ['category_id', 'brand_id', 'price', 'in_stock'],
        ],
    ],
],
```

## Exceptions
Fields that will never be used for filtering.

## Consequences Of Violation
Filters silently ignored, returning unfiltered results and giving the illusion of functional filtering.

---
## Rule Name
Declare Only Necessary Attributes

## Category
Performance

## Rule
Declare only filterable/sortable attributes that are actually used in queries.

## Reason
Each declared attribute increases index size and slows index updates. Unnecessary declarations waste resources.

## Bad Example
```php
'filterableAttributes' => ['id', 'name', 'slug', 'description', 'category_id', 'brand_id', 'price', 'created_at', 'updated_at', 'meta_title', 'meta_description'],
// Many fields never filtered on
```

## Good Example
```php
'filterableAttributes' => ['category_id', 'brand_id', 'price', 'in_stock'],  // Only what's needed
'sortableAttributes' => ['price', 'created_at'],
```

## Exceptions
Very small datasets (<10K documents) where index size impact is negligible.

## Consequences Of Violation
Unnecessary index bloat and slower index update performance.

---
## Rule Name
Use Numeric Types for Sorting

## Category
Design

## Rule
Always use numeric or timestamp types for sortable attributes in Meilisearch.

## Reason
Meilisearch sorts alphabetically for string fields — "100" sorts before "20". Numeric types ensure correct ordering.

## Bad Example
```php
'sortableAttributes' => ['price']  // If stored as string, "9.99" > "100.00"
```

## Good Example
```php
// Ensure price is cast to float/numeric in model
protected $casts = ['price' => 'float'];
'sortableAttributes' => ['price', 'created_at']  // created_at = timestamp
```

## Exceptions
Sorting by string fields where alphabetical order is intended (product names in dropdowns).

## Consequences Of Violation
Incorrect sort order for numeric fields stored as strings.
