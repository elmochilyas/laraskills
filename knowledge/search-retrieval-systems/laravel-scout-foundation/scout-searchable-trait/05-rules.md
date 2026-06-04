## Always Customize toSearchableArray
---
## Category
Performance
---
## Rule
Always override `toSearchableArray()` on any model using the `Searchable` trait; never rely on the default that returns all attributes.
---
## Reason
The default `$this->toArray()` sends all model attributes to the search engine, including non-searchable fields, increasing storage, cost, and latency.
---
## Bad Example
```php
use Searchable; // No toSearchableArray override — entire model sent to index
```
---
## Good Example
```php
use Searchable;

public function toSearchableArray(): array
{
    return ['title' => $this->title, 'body' => $this->body];
}
```
---
## Exceptions
Development environments only, not production.
---
## Consequences Of Violation
Index bloat, higher costs, slower searches, potential sensitive data exposure.

## Type Cast All Indexed Fields
---
## Category
Reliability
---
## Rule
Always ensure every field returned by `toSearchableArray()` has a consistent, predictable PHP type (string, int, float, bool, array).
---
## Reason
Search engines infer schema from indexed data. Mixed types (null vs int, string vs float) cause schema inference errors, silent index failures, or query-time crashes.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return ['price' => $this->price]; // Could be null, string, or float
}
```
---
## Good Example
```php
public function toSearchableArray(): array
{
    return ['price' => (float) $this->price];
}
```
---
## Exceptions
Schema-free engines (Meilisearch) can handle mixed types in some cases, but explicit casting is still safer.
---
## Consequences Of Violation
Indexing failures, query-time type errors, inconsistent search results.

## Implement shouldBeSearchable for Status-Based Models
---
## Category
Design
---
## Rule
Always implement `shouldBeSearchable()` on models with status-based visibility (published/draft, active/inactive, visible/hidden).
---
## Reason
Without gating, models in non-visible states appear in search results, degrading user experience and potentially exposing confidential data.
---
## Bad Example
```php
class Post extends Model
{
    use Searchable;
    // Draft posts appear in public search results
}
```
---
## Good Example
```php
class Post extends Model
{
    use Searchable;

    public function shouldBeSearchable(): bool
    {
        return $this->status === 'published';
    }
}
```
---
## Exceptions
Models where every record is always intended for public search.
---
## Consequences Of Violation
Draft/private content exposed in search, poor UX, potential compliance violations.

## Override searchableAs for Descriptive Index Names
---
## Category
Code Organization
---
## Rule
Always override `searchableAs()` to return a meaningful, consistent index name reflecting environment and model purpose.
---
## Reason
Default table-name-based indexes become confusing in multi-environment, multi-tenant, or multi-model setups, causing accidental cross-pollution.
---
## Bad Example
```php
// Uses default table name "posts" — same in dev, staging, prod
```
---
## Good Example
```php
public function searchableAs(): string
{
    return env('SCOUT_PREFIX', 'dev_') . 'posts';
}
```
---
## Exceptions
Single-environment, single-tenant applications where default naming suffices.
---
## Consequences Of Violation
Environment collision, confusing index naming, accidental data mixing.
