## Always Use Queue for Production scout:import
---
## Category
Performance
---
## Rule
Always run `scout:import` with the `--queue` flag in production to prevent blocking and timeout.
---
## Reason
Without queue, the import command runs synchronously, holding the CLI process until all records are indexed. Large datasets may exceed execution time limits.
---
## Bad Example
```bash
php artisan scout:import "App\Models\Post" # Synchronous, may timeout
```
---
## Good Example
```bash
php artisan scout:import "App\Models\Post" --queue # Dispatch as jobs
```
---
## Exceptions
Development environments or datasets under 1000 records.
---
## Consequences Of Violation
CLI timeout, partial imports, failed deployments, missing data in search index.

## Run Flush Before Import for Clean Rebuilds
---
## Category
Reliability
---
## Rule
Always run `scout:flush` before `scout:import` to remove stale records before repopulating.
---
## Reason
Without flushing, records deleted from the database since the last import remain in the index, causing phantom results and index corruption.
---
## Bad Example
```bash
php artisan scout:import "App\Models\Post" # Imports on top of old data
```
---
## Good Example
```bash
php artisan scout:flush "App\Models\Post"
php artisan scout:import "App\Models\Post" --queue
```
---
## Exceptions
When the engine handles upserts and you are certain no records need removal.
---
## Consequences Of Violation
Stale search results, index inconsistency, inaccurate record counts.

## Exclude Sensitive Fields via toSearchableArray Before Import
---
## Category
Security
---
## Rule
Never run `scout:import` without first verifying that `toSearchableArray()` excludes sensitive fields (passwords, tokens, PII).
---
## Reason
`scout:import` sends all data returned by `toSearchableArray()` to the search engine. If sensitive fields are included, they become accessible through the search API.
---
## Bad Example
```php
public function toSearchableArray(): array
{
    return $this->toArray(); // Includes password_hash, internal notes
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
        // Sensitive fields deliberately excluded
    ];
}
```
---
## Exceptions
No common exceptions — never index sensitive data to external search engines.
---
## Consequences Of Violation
Data breach via search API, compliance violation (GDPR, HIPAA), reputational damage.
