## Enable Telescope with Full Capture in Local/Staging
---
## Category
Observability
---
## Rule
Enable Telescope with full request/response capture in local and staging environments; never disable Telescope without a replacement debugging tool.
---
## Reason
Telescope's full capture is essential for debugging integration issues during development; without it, identifying HTTP request problems requires verbose logging or debugging proxies.
---
## Bad Example
```php
// Telescope disabled locally — debugging HTTP calls requires external tools
```
---
## Good Example
```php
// config/telescope.php — local: full capture
'filter' => fn () => true, // local/staging: capture everything
```
---
## Exceptions
Local environments with extremely limited storage.
---
## Consequences Of Violation
Slow debugging of integration issues, reliance on verbose logging or external debugging proxies, reduced developer productivity.
## Use Sampling in Production (10-25%)
---
## Category
Performance
---
## Rule
Configure Telescope with sampling in production to capture 10-25% of HTTP requests; never enable full capture in production on high-traffic applications.
---
## Reason
Full capture on high-traffic apps causes storage overflow, performance degradation, and excessive database writes.
---
## Bad Example
```php
// Production with full capture — storage fills within hours
```
---
## Good Example
```php
// config/telescope.php
'filter' => function ($entry) {
    if ($entry->type === 'request' && app()->environment('production')) {
        return mt_rand(1, 100) <= 10; // 10% sampling
    }
    return true;
},
```
---
## Exceptions
Low-traffic production apps where storage impact is negligible.
---
## Consequences Of Violation
Storage overflow, performance degradation, database bloat, Telescope dashboard slow or unavailable.
## Redact Sensitive Data via Filter
---
## Category
Security
---
## Rule
Configure Telescope's `filter` callback to redact Authorization headers, API keys, and PII from captured entries.
---
## Reason
Telescope stores request/response details in plain text; unredacted credentials in Telescope entries are accessible to anyone with dashboard access.
---
## Bad Example
```php
// No redaction — API keys visible in Telescope dashboard
```
---
## Good Example
```php
// config/telescope.php
'filter' => function ($entry) {
    if ($entry->type === 'request') {
        $entry->content['headers']['authorization'] = '[REDACTED]';
        $entry->content['headers']['x-api-key'] = '[REDACTED]';
    }
    return true;
},
```
---
## Exceptions
Local environments where sensitive data exposure risk is acceptable.
---
## Consequences Of Violation
Credential exposure in Telescope dashboard, compliance violations (PII exposure), unauthorized access to API keys.
## Implement Automatic Pruning (24-48h Retention)
---
## Category
Maintainability
---
## Rule
Configure Telescope pruning to keep entries for 24-48 hours; never disable pruning.
---
## Reason
Without pruning, Telescope entries accumulate indefinitely, consuming storage and degrading dashboard query performance.
---
## Bad Example
```php
// No pruning — telescope_entries table grows unbounded
```
---
## Good Example
```php
// config/telescope.php
'prune' => [
    'retention' => 48, // hours
],
// Or: php artisan telescope:prune --hours=48 (scheduled)
```
---
## Exceptions
Compliance requirements mandating longer Telescope retention.
---
## Consequences Of Violation
Database bloat, slow Telescope dashboard, increased storage costs, pruning takes hours on large tables.
## Filter Out Health Check Noise
---
## Category
Maintainability
---
## Rule
Use Telescope's filter callback to exclude health check and monitoring endpoints from entries.
---
## Reason
Health check requests occur every 30-60s and contain no useful debugging data; they clutter Telescope entries and consume storage.
---
## Bad Example
```php
// All requests captured — health checks dominate entries
```
---
## Good Example
```php
'filter' => function ($entry) {
    if (str_contains($entry->content['uri'] ?? '', '/health')) {
        return false; // exclude health checks
    }
    return true;
},
```
---
## Exceptions
None — always filter health checks.
---
## Consequences Of Violation
Telescope entries flooded with health check data, useful debugging information buried, increased storage consumption.
## Combine Telescope with Horizon for Full Observability
---
## Category
Observability
---
## Rule
Use Telescope for HTTP request debugging AND Horizon for queue job monitoring; neither alone provides complete integration observability.
---
## Reason
Telescope shows HTTP calls but not queue behavior; Horizon shows queue jobs but not HTTP details. Both are needed for end-to-end integration visibility.
---
## Bad Example
```php
// Only Telescope — queue job failures and retries invisible
```
---
## Good Example
```php
// Both enabled:
// Telescope: HTTP request/response details
// Horizon: Webhook job metrics, failures, retry status
```
---
## Exceptions
Simple integrations that don't use queues.
---
## Consequences Of Violation
Incomplete debugging capability, queue job issues invisible in Telescope, HTTP request issues invisible in Horizon.
