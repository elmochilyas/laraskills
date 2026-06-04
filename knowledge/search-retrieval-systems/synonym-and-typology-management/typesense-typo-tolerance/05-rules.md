---
## Rule Name
Define Per-Field Typo Tolerance in Schema

## Category
Architecture

## Rule
Always define per-field typo tolerance in the Typesense collection schema at creation time.

## Reason
Typesense typo tolerance is configured at schema level. Changing it after creation may require collection re-creation, unlike Meilisearch which supports dynamic updates.

## Bad Example
```php
// After schema creation — may require re-creation
$collection->update(['fields' => [...]]);
```

## Good Example
```php
$schema = [
    'name' => 'products',
    'fields' => [
        ['name' => 'title', 'type' => 'string', 'typo_tolerance' => ['enabled' => true]],
        ['name' => 'sku', 'type' => 'string', 'typo_tolerance' => ['enabled' => false]],
        ['name' => 'description', 'type' => 'string', 'typo_tolerance' => ['enabled' => true]],
    ],
];
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Costly collection re-creation to adjust typo tolerance settings.

---
## Rule Name
Disable Typo Tolerance on Identifier Fields

## Category
Design

## Rule
Always disable typo tolerance on code fields like SKU, serial number, and order ID.

## Reason
Code fields require exact matching. Typo tolerance on "ABC-123" could match "ABD-123" or "ABC-124", returning incorrect products.

## Bad Example
```php
// Typo tolerance on SKU — false positives
['name' => 'sku', 'type' => 'string', 'typo_tolerance' => ['enabled' => true]]
```

## Good Example
```php
['name' => 'sku', 'type' => 'string', 'typo_tolerance' => ['enabled' => false]]
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Wrong products returned for identifier searches — users see incorrect results.

---
## Rule Name
Set num_typos Appropriately for Field Length

## Category
Design

## Rule
Allow higher `num_typos` (2) for long text fields and lower (1 or 0) for short fields like names.

## Reason
Short words with 2 typos match many unrelated terms. Long words rarely exceed 2 character errors naturally.

## Bad Example
```php
// Same tolerance for all fields — short fields get false positives
'num_typos' => 2  // "iPod" with 2 typos matches many unrelated products
```

## Good Example
```php
// Per-field: higher for long text, lower for short
['name' => 'title', 'type' => 'string', 'num_typos' => 1],
['name' => 'description', 'type' => 'string', 'num_typos' => 2],
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Short field searches return excessive false positives from overly permissive typo tolerance.
