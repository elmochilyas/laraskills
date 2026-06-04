## Always Eager-Load Relations in makeAllSearchableUsing
---
## Category
Performance
---
## Rule
Override `makeAllSearchableUsing()` on any Searchable model whose `toSearchableArray()` accesses relationships.
---
## Reason
Without eager loading, batch import triggers a separate database query for each relation on each record, causing N+1 explosion and extremely slow imports.
---
## Bad Example
```php
// No makeAllSearchableUsing — imports trigger N+1 queries
public function toSearchableArray(): array
{
    return ['author_name' => $this->author->name]; // Query per record
}
```
---
## Good Example
```php
public function makeAllSearchableUsing($query)
{
    return $query->with(['author', 'category', 'tags']);
}

public function toSearchableArray(): array
{
    return ['author_name' => $this->author->name];
}
```
---
## Exceptions
When `toSearchableArray()` only uses the model's own attributes (no relationship access).
---
## Consequences Of Violation
Extremely slow imports (30,000+ queries for 10K records), database overload, import failures.

## Apply Import Filters in makeAllSearchableUsing
---
## Category
Design
---
## Rule
Use `makeAllSearchableUsing()` to apply filters (like `where('status', 'published')`) that should only affect batch import, not incremental indexing.
---
## Reason
Business rules for batch imports often differ from incremental sync. Applying these filters in the query builder prevents importing records that should only be searchable via incremental create events.
---
## Bad Example
```php
// Batch import includes all records regardless of status
```
---
## Good Example
```php
public function makeAllSearchableUsing($query)
{
    return $query->with(['author'])
        ->where('status', 'published'); // Only import published
}
```
---
## Exceptions
When batch import and incremental indexing should follow identical rules.
---
## Consequences Of Violation
Unwanted records indexed via batch import, inconsistency between import and incremental indexing.
