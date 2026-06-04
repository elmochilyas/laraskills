## Always Configure Both Connect and Request Timeouts
---
## Category
Reliability
---
## Rule
Set both `connectTimeout` (2-5s) and `timeout` (15-30s) on every outbound HTTP call.
---
## Reason
Connect timeout prevents hanging on TCP handshake; request timeout prevents waiting indefinitely for a slow response. Either without the other leaves a gap.
---
## Bad Example
```php
Http::timeout(30)->get('/endpoint'); // no connect timeout — may hang on TCP
Http::connectTimeout(5)->get('/endpoint'); // no request timeout — waits forever for response
```
---
## Good Example
```php
Http::connectTimeout(5)->timeout(30)->get('/endpoint'); // both configured
```
---
## Exceptions
Streaming responses where prolonged connections are expected.
---
## Consequences Of Violation
Worker hangs on TCP handshake failure or slow response, resource exhaustion, cascading failures.
## Configure Queue Job Timeout to Exceed Max API Time
---
## Category
Reliability
---
## Rule
Set queue job timeout to exceed the maximum expected API call time × max retries + buffer.
---
## Reason
Job timeout shorter than API processing time causes force-failure of legitimate operations.
---
## Bad Example
```php
class ProcessWebhook implements ShouldQueue {
    public $timeout = 30; // may not cover API call + processing + DB writes
}
```
---
## Good Example
```php
class ProcessWebhook implements ShouldQueue {
    public $timeout = 120; // covers max API time (30s) × 3 + buffer
}
```
---
## Exceptions
None — always configure explicit job timeouts.
---
## Consequences Of Violation
Jobs force-killed during legitimate processing, incomplete operations, data inconsistency.
## Combine Timeout with Retry
---
## Category
Reliability
---
## Rule
Configure shorter per-attempt timeouts on retry attempts to fail fast on persistently slow responses.
---
## Reason
If a request is timing out, it's likely to time out again; shorter retry timeouts conserve resources.
---
## Bad Example
```php
Http::retry(3, 1000)->timeout(30)->get('/endpoint');
// Each retry waits 30s — up to 90s total
```
---
## Good Example
```php
Http::retry(3, 1000, function ($e, $r, $attempt) {
    $request = $r->withOptions(['timeout' => max(5, 30 / $attempt)]); // shorter per attempt
    return $request;
})->get('/endpoint');
```
---
## Exceptions
Operations where timeout is not expected variance.
---
## Consequences Of Violation
Retries waste time on already-timeout-prone requests, delaying recovery and consuming resources.
## Log Timeout Exceptions with Context
---
## Category
Observability
---
## Rule
Log all timeout exceptions with service name, endpoint, and configured timeout value.
---
## Reason
Timeout logs are essential for identifying slow services, network issues, and misconfigured timeouts.
---
## Bad Example
```php
catch (ConnectException $e) { throw $e; } // timeout — no logging
```
---
## Good Example
```php
catch (ConnectException $e) {
    Log::warning('API timeout', [
        'service' => 'stripe', 'endpoint' => '/charges',
        'timeout' => 30, 'connect_timeout' => 5,
    ]);
    throw $e;
}
```
---
## Exceptions
None — always log timeouts for observability.
---
## Consequences Of Violation
Timeout issues invisible in monitoring, no data for timeout tuning, slow incident diagnosis.
## Set Timeout Configuration in Service Class, Not Per Call
---
## Category
Code Organization
---
## Rule
Configure timeouts at the service class or connector level; avoid per-call timeout variations.
---
## Reason
Centralized timeout config ensures consistent behavior and is easier to tune; per-call overrides are hard to audit.
---
## Bad Example
```php
Http::timeout(30)->get('/charges');
Http::timeout(60)->post('/charges', $data); // inconsistent
```
---
## Good Example
```php
// In StripeService constructor or connector
$this->timeout = config('services.stripe.timeout', 30);
$this->connectTimeout = config('services.stripe.connect_timeout', 5);
// All methods use consistent timeouts
```
---
## Exceptions
Specific endpoints known to have different latency profiles.
---
## Consequences Of Violation
Inconsistent timeout behavior, hard to tune globally, some calls may hang while others fail fast.
