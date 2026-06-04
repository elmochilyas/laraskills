## Only Filter Indexed Fields in where Clauses
---
## Category
Reliability
---
## Rule
Never apply `where()`, `whereIn()`, or `whereNotIn()` on fields that are not explicitly included in `toSearchableArray()`.
---
## Reason
Search engines can only filter on fields that exist in the indexed document. Filtering on non-indexed fields silently returns empty results or throws errors.
---
## Bad Example
```php
// searchable returns ['title', 'body'] but where filters on 'secret_field'
Product::search('shoes')->where('secret_field', true)->get();
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return ['title' => $this->title, 'is_visible' => $this->is_visible];
}

Product::search('shoes')->where('is_visible', true)->get();
```
---
## Exceptions
When the engine supports post-query filtering on non-indexed fields (rare, engine-specific).
---
## Consequences Of Violation
Silent empty results, broken filter functionality, developer confusion.

## Prefer whereIn Over Chained OR where Clauses
---
## Category
Performance
---
## Rule
Always use `whereIn()` for filtering by multiple values instead of chaining multiple `where()` calls with OR logic.
---
## Reason
`whereIn()` sends a single optimized filter to the search engine, while chained OR conditions often result in less efficient query plans.
---
## Bad Example
```php
Product::search('shoes')
    ->where('status', 'published')
    ->where('status', 'draft'); // Inefficient OR-equivalent
```
---
## Good Example
```php
Product::search('shoes')
    ->whereIn('status', ['published', 'draft']);
```
---
## Exceptions
When different conditions need different operators (equality vs range), requiring separate where clauses.
---
## Consequences Of Violation
Slower search queries, potential engine-specific filter limitations.

## Include Filter Fields in toSearchableArray Even If Not Displayed
---
## Category
Architecture
---
## Rule
Always include fields used for filtering (status, category_id, tenant_id) in `toSearchableArray()` even if they are not displayed in search results.
---
## Reason
Search engines can only filter on indexed fields. Leaving filter fields out of `toSearchableArray()` forces post-query filtering in PHP, negating engine-level performance benefits.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['title' => $this->title]; // Can't where('category_id', 5)
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'category_id' => $this->category_id, // Needed for filtering
        'status' => $this->status,
    ];
}
```
---
## Exceptions
When filtering is done post-query in PHP via collection filtering (small datasets only).
---
## Consequences Of Violation
Inability to filter at engine level, forcing slow PHP-side filtering, poor performance at scale.
