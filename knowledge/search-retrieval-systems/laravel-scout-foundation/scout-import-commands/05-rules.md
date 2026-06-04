## Use Queue for Production Imports
---
## Category
Performance
---
## Rule
Always use `scout:import --queue` for production import operations to avoid HTTP timeout and blocking the CLI.
---
## Reason
Without queue, `scout:import` blocks the CLI process until all records are indexed — large datasets may take hours and time out.
---
## Bad Example
```bash
php artisan scout:import "App\Models\Post"  # Blocks until complete
```
---
## Good Example
```bash
php artisan scout:import "App\Models\Post" --queue  # Dispatches queued jobs
```
---
## Exceptions
Small datasets (<1K records) where synchronous import completes within acceptable time.
---
## Consequences Of Violation
CLI timeouts, incomplete imports, failed deployments.

## Run scout:sync-index-settings in Every Deployment
---
## Category
Reliability
---
## Rule
Always include `php artisan scout:sync-index-settings` in your deployment pipeline to ensure engine settings match code.
---
## Reason
Index settings configured in `scout.php` are not auto-applied. Without explicit sync, filterable/sortable configurations silently diverge from code.
---
## Bad Example
```yaml
deploy:
  - php artisan migrate  # No scout:sync-index-settings
```
---
## Good Example
```yaml
deploy:
  - php artisan migrate
  - php artisan scout:sync-index-settings
```
---
## Exceptions
No common exceptions for any Scout-based search implementation.
---
## Consequences Of Violation
Broken filters/sorting, silent search failures, debugging time waste.

## Run scout:flush Before scout:import for Clean Rebuild
---
## Category
Reliability
---
## Rule
Always run `scout:flush` before `scout:import` when performing a complete index rebuild to prevent duplicate records.
---
## Reason
Without flushing, old records remain in the index alongside newly imported ones, causing duplicates for records that were deleted or changed since last import.
---
## Bad Example
```bash
php artisan scout:import "App\Models\Post"  # Imports on top of stale data
```
---
## Good Example
```bash
php artisan scout:flush "App\Models\Post"
php artisan scout:import "App\Models\Post" --queue
```
---
## Exceptions
When using incremental-only indexing with no batch rebuilds.
---
## Consequences Of Violation
Duplicate search results, stale records appearing, index inconsistency.

## Automate Import Commands in CI/CD
---
## Category
Reliability
---
## Rule
Always script import, flush, and sync-index-settings commands into your CI/CD pipeline rather than running them manually.
---
## Reason
Manual import steps are forgotten during deployments, leading to stale indexes, missing records, and production incidents.
---
## Bad Example
```bash
# Manual process — often forgotten
php artisan scout:import "App\Models\Post"
```
---
## Good Example
```yaml
# deploy.yml — automated
- run: php artisan scout:flush "App\Models\Post"
- run: php artisan scout:import "App\Models\Post" --queue
```
---
## Exceptions
No common exceptions for any Scout-based production deployment.
---
## Consequences Of Violation
Stale search indexes, missing new records, production search outages.
