## Generate Key Once Per Operation (Outside Retry Loop)
---
## Category
Reliability
---
## Rule
Generate the idempotency key as UUID v4 once per operation, before entering any retry loop or queue dispatch.
---
## Reason
The key must remain consistent across all retries so the server detects duplicates. Generating inside the loop defeats idempotency and causes duplicate side effects.
---
## Bad Example
```php
Http::retry(3, 1000)->withHeader('Idempotency-Key', (string) Str::uuid())->post('/charges', $data);
```
---
## Good Example
```php
$key = (string) Str::uuid();
Http::retry(3, 1000)->withHeader('Idempotency-Key', $key)->post('/charges', $data);
```
---
## Exceptions
None — always generate once per operation.
---
## Consequences Of Violation
Each retry creates a new operation; duplicate charges, duplicate orders, duplicate side effects.
## Add Unique Constraint on Idempotency Key Column
---
## Category
Reliability
---
## Rule
Add a database unique constraint on the idempotency key column; never rely solely on application-level existence checks.
---
## Reason
Application-level checks (SELECT then INSERT) have a time-of-check-to-time-of-use race condition allowing duplicates under concurrent requests.
---
## Bad Example
```php
if (IdempotencyKey::where('key', $key)->exists()) { return; } // race — concurrent passes
```
---
## Good Example
```php
try {
    IdempotencyKey::create(['key' => $key, 'response' => $response]);
} catch (UniqueConstraintViolationException $e) {
    return response($existing->response, $existing->status);
}
```
---
## Exceptions
Single-worker serial processing where concurrent requests are impossible.
---
## Consequences Of Violation
Duplicate processing under concurrent request delivery, data corruption from duplicate side effects.
## Align TTL with Provider's Maximum Retry Window
---
## Category
Architecture
---
## Rule
Set idempotency key TTL to at least the upstream provider's documented retry window duration (typically 24h).
---
## Reason
If TTL expires before the provider stops retrying, late retries bypass idempotency and create duplicate operations.
---
## Bad Example
```php
Cache::put("idempotency:$key", $response, 3600); // 1h — provider retries for 24h
```
---
## Good Example
```php
$ttl = $this->getProviderRetryWindow($provider); // 86400 for Stripe
Cache::put("idempotency:$key", $response, $ttl);
```
---
## Exceptions
Providers with documented shorter retry windows.
---
## Consequences Of Violation
Late retries create duplicate side effects; financial operations may charge twice.
## Return Cached Response on Duplicate Detection
---
## Category
Reliability
---
## Rule
When a duplicate idempotency key is detected, return the exact same response (status code + body) as the original successful request.
---
## Reason
The caller expects identical responses for identical keys; different responses break the idempotency contract and may cause incorrect caller behavior.
---
## Bad Example
```php
return response('Already processed', 200); // different response body than original
```
---
## Good Example
```php
$cached = IdempotencyKey::where('key', $key)->first();
return response($cached->response_body, $cached->response_status)
    ->withHeaders($cached->response_headers);
```
---
## Exceptions
None — return exactly the cached response.
---
## Consequences Of Violation
Caller receives unexpected response, may mis-handle the duplicate, idempotency contract violated.
## Reject Different Body with Same Key (Return 422)
---
## Category
Security
---
## Rule
When a duplicate idempotency key is received with a different request body, reject with 422 Unprocessable Entity.
---
## Reason
Same key + different body indicates key collision, replay attack, or client bug — all require rejection to prevent data corruption.
---
## Bad Example
```php
// Processes with different body — silently corrupts data
```
---
## Good Example
```php
$existing = IdempotencyKey::where('key', $key)->first();
if ($existing && $existing->body_hash !== hash('sha256', $request->getContent())) {
    return response()->json([
        'error' => 'idempotency_key_mismatch',
        'message' => 'Idempotency key already used with different request body',
    ], 422);
}
```
---
## Exceptions
None — always reject with 422.
---
## Consequences Of Violation
Data corruption from key collision, undetected replay attacks, silent data integrity violations.
## Implement Key Expiry Cleanup Strategy
---
## Category
Maintainability
---
## Rule
Run a scheduled job to purge expired idempotency keys from the database (for DB-backed storage) or set TTL for cache-backed storage.
---
## Reason
Without cleanup, expired keys accumulate indefinitely, degrading storage and query performance.
---
## Bad Example
```php
// Cache or DB with no TTL or cleanup — unbounded growth
```
---
## Good Example
```php
// For DB-backed storage:
$schedule->call(function () {
    IdempotencyKey::where('created_at', '<', now()->subDays(31))->delete();
})->daily();
// For cache-backed: TTL handles cleanup automatically
```
---
## Exceptions
Cache-backed storage where TTL auto-cleans.
---
## Consequences Of Violation
Unbounded table growth, slow queries, increased storage costs, degraded application performance.
