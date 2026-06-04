---
## Rule Name
Define Schemas Explicitly Before Indexing

## Category
Framework Usage

## Rule
Always define explicit collection schemas in `config/scout.php` under `typesense.model-settings` before importing documents.

## Reason
Typesense requires pre-defined schemas and does not auto-create indexes like Meilisearch. Missing schemas cause import failures.

## Bad Example
```php
// No model-settings configured
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
],
```

## Good Example
```php
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
    'model-settings' => [
        Product::class => [
            'collection-schema' => [
                'fields' => [
                    ['name' => 'id', 'type' => 'string'],
                    ['name' => 'title', 'type' => 'string'],
                    ['name' => 'price', 'type' => 'float', 'facet' => true, 'sort' => true],
                ],
                'default_sorting_field' => 'price',
            ],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
`scout:import` fails with schema errors, blocking deployment and requiring emergency schema creation.

---
## Rule Name
Avoid Auto Type in Production Schemas

## Category
Reliability

## Rule
Always specify explicit field types in collection schemas; never rely on the `auto` type in production.

## Reason
`auto` type inference is brittle — it chooses the type based on the first document, which may not represent all data. Type mismatches cause silent import failures.

## Bad Example
```php
['name' => 'price', 'type' => 'auto'],
// First doc has price as float, later doc has null -> type conflict
```

## Good Example
```php
['name' => 'price', 'type' => 'float', 'optional' => true],
```

## Exceptions
Rapid prototyping and development-only environments.

## Consequences Of Violation
Index corruption, silent document rejections, and hard-to-debug schema conflicts.

---
## Rule Name
Plan Schema Migrations with Re-Indexing

## Category
Architecture

## Rule
Always document and automate the re-indexing process for every schema change; Typesense does not support in-place schema alterations.

## Reason
Adding, removing, or changing field types requires dropping and recreating the collection. Without automation, this process is error-prone and time-consuming.

## Bad Example
```bash
# Manual process — forget to back up data
php artisan scout:flush "App\Models\Product"
php artisan scout:import "App\Models\Product"
```

## Good Example
```bash
# Alias swap pattern in deployment script
# 1. Create new collection with updated schema
# 2. Import data into new collection
# 3. Swap alias from old to new
# 4. Drop old collection
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Data loss during migration, extended downtime, and manual recovery effort.

---
## Rule Name
Declare All Facetable Fields

## Category
Framework Usage

## Rule
Always add `'facet' => true` to any field used in faceted search or `where()` filter conditions.

## Reason
Undeclared facet fields cannot be used for filtering. Scout's `where()` calls on non-facet fields silently fail or return zero results.

## Bad Example
```php
['name' => 'category', 'type' => 'string'],
// No facet: true — where('category', 'electronics') fails
```

## Good Example
```php
['name' => 'category', 'type' => 'string', 'facet' => true],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent filtering failures, incorrect search results, and debugging confusion.

---
## Rule Name
Declare All Sortable Fields

## Category
Framework Usage

## Rule
Always add `'sort' => true` to any field used in `orderBy()` sorting.

## Reason
Typesense requires explicit sort declaration. Undeclared sort fields are ignored, and sorting silently fails.

## Bad Example
```php
['name' => 'price', 'type' => 'float'],
// No sort: true — orderBy('price') has no effect
```

## Good Example
```php
['name' => 'price', 'type' => 'float', 'sort' => true],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Sorting options silently not working, users seeing default ordering regardless of selection.

---
## Rule Name
Version-Control Schemas in scout.php

## Category
Maintainability

## Rule
Always store Typesense collection schema definitions in `config/scout.php` for version control and environment reproducibility.

## Reason
Schema definitions that exist only as API calls or documentation are invisible to other developers, unreviewable, and lost on rebuild.

## Bad Example
```php
// Schema created manually via API, no config
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
],
```

## Good Example
```php
'typesense' => [
    'host' => env('TYPESENSE_HOST'),
    'model-settings' => [
        Product::class => [
            'collection-schema' => [
                'fields' => [ /* all field definitions */ ],
            ],
        ],
    ],
],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Configuration drift, unreproducible environments, and opaque schema changes.
