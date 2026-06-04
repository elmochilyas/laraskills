## Include Environment in Index Names
---
## Category
Reliability
---
## Rule
Always prefix index names with the environment name in `searchableAs()` to prevent cross-environment data mixing.
---
## Reason
Without environment-specific names, development imports overwrite staging or production indexes, causing data corruption and search outages.
---
## Bad Example
```php
public function searchableAs(): string
{
    return 'posts'; // Same name in dev, staging, prod
}
```
---
## Good Example
```php
public function searchableAs(): string
{
    return app()->environment() . '_posts';
}
```
---
## Exceptions
Single-environment deployments with no risk of cross-environment contamination.
---
## Consequences Of Violation
Accidental overwriting of production indexes, corrupted search results, data recovery effort.

## Use Consistent Naming Convention Across Models
---
## Category
Code Organization
---
## Rule
Always adopt a consistent `{prefix}_{model}` naming convention for all `searchableAs()` return values.
---
## Reason
Inconsistent naming (some models use prefixes, others don't) causes confusion during debugging, monitoring, and cross-model search operations.
---
## Bad Example
```php
class Post extends Model
{
    public function searchableAs(): string { return 'blog_posts'; }
}
class Product extends Model
{
    public function searchableAs(): string { return 'shop_products'; }
}
```
---
## Good Example
```php
class Post extends Model
{
    public function searchableAs(): string { return env('SCOUT_PREFIX') . 'posts'; }
}
class Product extends Model
{
    public function searchableAs(): string { return env('SCOUT_PREFIX') . 'products'; }
}
```
---
## Exceptions
When different environments require different naming strategies documented separately.
---
## Consequences Of Violation
Confusing index layout, difficulty automating index management, operational errors.

## Avoid Special Characters in Index Names
---
## Category
Reliability
---
## Rule
Use only lowercase alphanumeric characters and underscores in `searchableAs()` return values.
---
## Reason
Many search engines (Meilisearch, Typesense, Algolia) have restrictions on index name characters. Special characters, uppercase, or spaces cause silent creation failures or runtime errors.
---
## Bad Example
```php
public function searchableAs(): string
{
    return 'My Posts! (2024)'; // Special chars — engine may reject
}
```
---
## Good Example
```php
public function searchableAs(): string
{
    return 'my_posts_2024'; // Safe for all engines
}
```
---
## Exceptions
No common exceptions; always follow engine naming rules.
---
## Consequences Of Violation
Index creation failures, runtime errors, hard-to-debug search issues.
