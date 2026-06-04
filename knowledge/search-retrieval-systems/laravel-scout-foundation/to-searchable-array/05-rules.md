## Limit Indexed Fields to Necessary Only
---
## Category
Performance
---
## Rule
Always return only the fields needed for search display and filtering from `toSearchableArray()`; never send all model attributes.
---
## Reason
Larger indexed payloads increase storage costs, slow down indexing, degrade search latency, and expose sensitive data.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return $this->toArray(); // Sends all columns
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'body' => $this->body,
        'status' => $this->status,
    ];
}
```
---
## Exceptions
Development environments where indexing all data is acceptable temporarily.
---
## Consequences Of Violation
Higher costs, slower searches, potential data exposure.

## Eager-Load Relations in makeAllSearchableUsing
---
## Category
Performance
---
## Rule
Always override `makeAllSearchableUsing()` to eager-load any relationships accessed in `toSearchableArray()`.
---
## Reason
Without eager loading, importing 10,000 records each with 3 relations generates 30,001 database queries instead of 4, causing massive import slowdowns.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['author_name' => $this->author->name]; // N+1 on import!
}
```
---
## Good Example
```php
public function makeAllSearchableUsing($query): Builder
{
    return $query->with(['author', 'category']);
}

public function toSearchableArray(): array
{
    return ['author_name' => $this->author->name];
}
```
---
## Exceptions
When `toSearchableArray()` only accesses the model's own attributes (no relationships).
---
## Consequences Of Violation
Extremely slow imports, database connection exhaustion, failed batch operations.

## Include Filtering Fields in toSearchableArray
---
## Category
Architecture
---
## Rule
Always include fields used for filtering (status, category_id, tenant_id) in `toSearchableArray()` even if they are not displayed in search result cards.
---
## Reason
Search engines can only filter on indexed fields. Omitting filter fields forces PHP-side post-filtering, negating engine performance benefits.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['title' => $this->title]; // Can't filter by category
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return [
        'title' => $this->title,
        'category_id' => $this->category_id, // Needed for where()
    ];
}
```
---
## Exceptions
When filtering is done via post-query PHP collection filtering on small datasets.
---
## Consequences Of Violation
Inefficient filtering, inability to use engine-level where().
