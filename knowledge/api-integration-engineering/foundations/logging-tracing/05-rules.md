## Log All Outbound API Calls with Duration and Status
---
## Category
Observability
---
## Rule
Log every outbound API call with duration, HTTP status, service name, and endpoint; never leave calls unlogged.
---
## Reason
Without logging, diagnosing integration failures requires reproducing the issue; logged calls provide immediate forensic evidence.
---
## Bad Example
```php
$response = Http::get('https://api.example.com/users'); // no logging
```
---
## Good Example
```php
$start = microtime(true);
$response = Http::get('https://api.example.com/users');
Log::debug('API call completed', [
    'service' => 'example', 'endpoint' => '/users', 'status' => $response->status(),
    'duration_ms' => (microtime(true) - $start) * 1000,
]);
```
---
## Exceptions
Health check endpoints where logging would produce excessive noise.
---
## Consequences Of Violation
Integration failures require guesswork, incident response is slow, no audit trail of API activity.
## Redact Sensitive Data Before Logging
---
## Category
Security
---
## Rule
Strip Authorization headers, API keys, tokens, and PII from all logged request/response data.
---
## Reason
Logs are often stored with less protection than the original data source; exposed credentials in logs are a common breach vector.
---
## Bad Example
```php
Log::debug('Request headers', $request->headers()); // includes Authorization: Bearer xxx
```
---
## Good Example
```php
Log::debug('Request headers', collect($request->headers())
    ->except(['authorization', 'cookie', 'x-api-key'])->toArray());
```
---
## Exceptions
Debugging auth issues in local development with non-production credentials.
---
## Consequences Of Violation
Credential exposure in log aggregation tools, PCI/HIPAA compliance violations, security incidents.
## Enable Telescope with Sampling in Production
---
## Category
Observability
---
## Rule
Enable Telescope's HTTP watcher with sampling (10-25%) in production; use full capture only in local/staging.
---
## Reason
Full Telescope capture at scale causes storage overflow and performance degradation; sampling provides sufficient debug data.
---
## Bad Example
```php
// config/telescope.php — no sampling, full capture in production
```
---
## Good Example
```php
'filter' => function ($entry) {
    if ($entry->type === 'request' && app()->environment('production')) {
        return mt_rand(1, 100) <= 10; // 10% sampling
    }
    return true;
},
```
---
## Exceptions
High-priority integrations where 100% capture is required for compliance.
---
## Consequences Of Violation
Telescope table grows unbounded, query performance degrades, storage costs spike.
## Use Correlation IDs Across Request Chains
---
## Category
Observability
---
## Rule
Propagate a correlation ID across outbound HTTP calls, queue jobs, and webhook processing for end-to-end tracing.
---
## Reason
Correlation IDs connect a webhook receipt → queue job → outbound API call → response chain in a single trace, essential for debugging.
---
## Bad Example
```php
// No correlation ID — can't trace a webhook through processing
Http::post('https://api.example.com/notify', $payload);
```
---
## Good Example
```php
$correlationId = Str::uuid();
Http::withHeaders(['X-Correlation-Id' => $correlationId])
    ->post('https://api.example.com/notify', $payload);
Log::withContext(['correlation_id' => $correlationId]);
```
---
## Exceptions
Non-critical calls where tracing overhead isn't justified.
---
## Consequences Of Violation
Impossible to trace a request's full lifecycle, incident investigation takes significantly longer.
## Implement Log Pruning with Retention Policy
---
## Category
Maintainability
---
## Rule
Configure automatic pruning of Telescope entries and structured logs with a defined retention policy (24-48h typical).
---
## Reason
Without pruning, log and Telescope storage grows unbounded, causing performance degradation and storage cost spikes.
---
## Bad Example
```php
// No pruning configured — telescope_entries table grows infinitely
```
---
## Good Example
```php
// config/telescope.php
'prune' => [
    'hours' => 48, // keep 48 hours of data
],
```
---
## Exceptions
Compliance requirements mandating longer retention periods.
---
## Consequences Of Violation
Database bloat, slow dashboard queries, increased storage costs, potential application slowdown.
