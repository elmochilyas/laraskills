---
## Rule Name
Leave Default Typo Tolerance for Text Fields

## Category
Design

## Rule
Keep Meilisearch's default typo tolerance settings for general text fields (title, description, body).

## Reason
Default thresholds (1 typo for 5+ chars, 2 typos for 9+ chars) work well for most applications. Premature tuning often degrades UX.

## Bad Example
```php
// Disabling globally — degrades UX
$index->updateTypoTolerance(['enabled' => false]);
```

## Good Example
```php
// No explicit config needed — defaults work
// Only customize when analytics show specific issues
```

## Exceptions
Specific text fields where user analytics show systematic spelling issues.

## Consequences Of Violation
Users see zero results for common misspellings that defaults would have corrected.

---
## Rule Name
Disable Typo Tolerance on Code Fields

## Category
Design

## Rule
Always disable typo tolerance on identifier fields (SKU, serial number, order ID).

## Reason
Code fields require exact matches. A 1-typo tolerance on "ABC-123" can match "ABD-123" — returning wrong products.

## Bad Example
```php
// Typo tolerance on SKU — false positives
// "ABC-123" could match "ABD-123" or "ABC-124"
```

## Good Example
```php
$index->updateTypoTolerance([
    'disableOnAttributes' => ['sku', 'serial_number', 'order_id']
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Wrong products returned for code/identifier searches — users see incorrect results.

---
## Rule Name
Adjust Thresholds for Language

## Category
Design

## Rule
Always adjust `minWordSizeForTypos` thresholds for non-English content.

## Reason
English default thresholds (5/9 chars) assume English word lengths. Languages like German or Finnish have longer average words; CJK languages need entirely different handling.

## Bad Example
```php
// English defaults on German — too strict for compound words
// "Donaudampfschiffahrtsgesellschaftskapitän" needs 2+ typos
```

## Good Example
```php
$index->updateTypoTolerance([
    'minWordSizeForTypos' => [
        '1' => 3,  // 1 typo starting at 3 chars for short German words
        '2' => 7,  // 2 typos starting at 7 chars
    ]
]);
```

## Exceptions
English-only content.

## Consequences Of Violation
Users searching in non-English languages experience poor typo correction.
