---
## Rule Name
Use Scout Callback API for Dynamic Parameters

## Category
Framework Usage

## Rule
Always use Scout's callback API to pass Typesense-specific search parameters per query.

## Reason
Scout's generic methods don't expose Typesense-specific parameters. The callback API allows full control while keeping Scout's abstractions.

## Bad Example
```php
Product::search($query)->get();  // Uses defaults — no parameter control
```

## Good Example
```php
Product::search($query)->query(function ($typesense, $queryStr) {
    $typesense->setQueryBy('title,description,tags');
    $typesense->setQueryByWeights('5,2,1');
    $typesense->setNumTypos(1);
})->get();
```

## Exceptions
Simple search where default parameters are sufficient.

## Consequences Of Violation
Inability to tune search behavior per query, resulting in suboptimal relevance.

---
## Rule Name
Order query_by by Field Importance

## Category
Design

## Rule
Always order Typesense's `query_by` fields with the most important field first.

## Reason
Typesense weights fields by their position in `query_by`. Titles before bodies ensure title matches rank higher.

## Bad Example
```php
$typesense->setQueryBy('description,title,tags');  // Title least important
```

## Good Example
```php
$typesense->setQueryBy('title,description,tags');  // Title first = most weight
```

## Exceptions
Content types where body or tags are more important than titles.

## Consequences Of Violation
Less relevant results — title matches diluted by body content matches.

---
## Rule Name
Tune num_typos Per Field Type

## Category
Performance

## Rule
Set stricter typo tolerance (0-1) for code/SKU fields and relaxed tolerance (2) for text fields.

## Reason
SKUs and codes must match exactly or with minimal typos to avoid false positives. Descriptive text benefits from lenient typo tolerance.

## Bad Example
```php
// Same typo tolerance for all fields
$typesense->setNumTypos(2);  // SKU matches 2-typo variants incorrectly
```

## Good Example
```php
$typesense->setQueryBy('sku,title,description');
$typesense->setNumTypos(0);  // Strict for all fields
// Or per-field using Typesense's per-field num_typos syntax
```

## Exceptions
No common exceptions.

## Consequences Of Violation
SKU/code searches return false positives from overly lenient typo matching.
