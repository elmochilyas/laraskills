## Only Retry on Retryable Status Codes
---
## Category
Reliability
---
## Rule
Configure retry to only trigger on 5xx, 429, and network errors; never retry on 4xx client errors.
---
## Reason
4xx errors (400, 401, 403, 404) indicate client-side issues — retrying will produce the same result and may cause account lockout.
---
## Bad Example
```php
Http::retry(3, 1000)->post('/charges', $data); // retries 401, 403, 404 — wastes resources
```
---
## Good Example
```php
Http::retry(3, 1000, function ($exception, $request) {
    return $exception->response && $exception->response->status() >= 500
        || $exception->response && $exception->response->status() === 429;
})->post('/charges', $data);
```
---
## Exceptions
408 (Request Timeout) which may succeed on retry.
---
## Consequences Of Violation
Retrying client errors causes account lockout (401), reveals attack patterns (403), wastes resources, and delays legitimate retries.
## Use Exponential Backoff with Jitter
---
## Category
Reliability
---
## Rule
Always add jitter to exponential backoff delays; never use pure exponential backoff.
---
## Reason
Pure exponential backoff causes thundering herd on service recovery — all retries hit simultaneously.
---
## Bad Example
```php
$delay = pow(2, $attempt); // no jitter — thundering herd on recovery
```
---
## Good Example
```php
$delay = min(30000, (pow(2, $attempt) * 1000) * (0.5 + mt_rand(0, 10000) / 20000)); // full jitter
```
---
## Exceptions
Rate-limited responses where the server provides explicit Retry-After.
---
## Consequences Of Violation
Synchronized retry storm on service recovery, overwhelmed downstream, prolonged outage.
## Cap Maximum Retries
---
## Category
Reliability
---
## Rule
Set a maximum retry count (3 default, 5 maximum for most use cases) to bound resource consumption.
---
## Reason
Infinite retries exhaust queue worker resources and delay other jobs; capped retries ensure eventual failure detection and escalation.
---
## Bad Example
```php
Http::retry(100, 1000)->get('/endpoint'); // 100 retries — excessive
```
---
## Good Example
```php
Http::retry(3, 1000)->get('/endpoint'); // 3 retries — reasonable bound
```
---
## Exceptions
Queue jobs with a very long retry horizon (24h+) where many retries are needed.
---
## Consequences Of Violation
Resource exhaustion, delayed failure detection, queue backlog of retrying jobs.
## Set Overall Deadline for Retry Sequence
---
## Category
Reliability
---
## Rule
Set a total timeout for the entire retry sequence, not just per-attempt timeouts.
---
## Reason
Without a total deadline, retries can continue for hours on slow responses, blocking resources.
---
## Bad Example
```php
Http::retry(5, 1000)->timeout(30)->get('/endpoint');
// 5 retries × 30s timeout = up to 150s total — potentially blocking
```
---
## Good Example
```php
// Implementation with total deadline
$deadline = microtime(true) + 30; // total 30s for all retries
Http::retry(5, 1000, function ($e, $r, $attempt) use ($deadline) {
    return microtime(true) < $deadline; // stop if deadline passed
})->timeout(10)->get('/endpoint');
```
---
## Exceptions
Queue jobs where the queue framework manages total execution time.
---
## Consequences Of Violation
Retry sequence exceeds acceptable latency, worker blocked for extended period, degraded throughput.
## Verify Idempotency Before Retrying Writes
---
## Category
Security
---
## Rule
Only retry write operations (POST, PUT, PATCH) if the request carries an idempotency key.
---
## Reason
Retrying a write without idempotency can cause duplicate side effects (double charges, duplicate orders).
---
## Bad Example
```php
Http::retry(3, 1000)->post('/charges', $data); // retries without idempotency — risk of double charge
```
---
## Good Example
```php
$response = Http::withHeader('Idempotency-Key', $key)
    ->retry(3, 1000)
    ->post('/charges', $data);
```
---
## Exceptions
Idempotent-by-definition operations (PUT replacing a resource, DELETE).
---
## Consequences Of Violation
Duplicate charges, double order processing, data corruption from re-executed writes.
