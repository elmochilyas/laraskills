## Reuse Same Client Instance for Connection Pooling
---
## Category
Performance
---
## Rule
Reuse the same Guzzle client instance for all requests to the same host; never create a new client per request.
---
## Reason
TCP connection reuse eliminates handshake overhead; each new client instance starts with a fresh connection pool.
---
## Bad Example
```php
$response = (new Client())->get('https://api.example.com/users'); // new connection each time
```
---
## Good Example
```php
$client = app(Client::class); // shared singleton
$response = $client->get('https://api.example.com/users'); // reuses connection
```
---
## Exceptions
Multi-tenant services requiring different TLS certificates per tenant.
---
## Consequences Of Violation
Higher latency, increased socket usage, unnecessary TLS handshake overhead on every request.
## Set Connection Pool Limits
---
## Category
Reliability
---
## Rule
Configure `CURLMOPT_MAX_TOTAL_CONNECTIONS` and per-host connection limits to prevent socket exhaustion.
---
## Reason
Unbounded connection pools exhaust file descriptors under load, causing `EMFILE` errors and application crashes.
---
## Bad Example
```php
$client = new Client(); // defaults to unlimited connections
```
---
## Good Example
```php
$handler = CurlMultiHandler::create(['max_handles' => 25]);
$stack = HandlerStack::create($handler);
$client = new Client(['handler' => $stack]);
```
---
## Exceptions
Low-traffic applications where connection exhaustion is not a concern.
---
## Consequences Of Violation
Socket exhaustion, EMFILE errors, application instability under load.
## Use Named Pool Keys for Response Correlation
---
## Category
Architecture
---
## Rule
Use named keys in concurrent request pools to correlate responses deterministically.
---
## Reason
Pool responses complete in indeterminate order; named keys guarantee correct response-to-request mapping.
---
## Bad Example
```php
$responses = Http::pool(fn ($pool) => [
    $pool->get('/users'), $pool->get('/orders'),
]);
// $responses[0] may not be /users
```
---
## Good Example
```php
$responses = Http::pool(fn ($pool) => [
    'users' => $pool->get('/users'),
    'orders' => $pool->get('/orders'),
]);
// $responses['users'] is always /users
```
---
## Exceptions
Single-request pools where ordering is irrelevant.
---
## Consequences Of Violation
Intermittent data misalignment bugs, hard to reproduce and debug.
## Separate Pools Per Service for Failure Isolation
---
## Category
Reliability
---
## Rule
Use separate connection pools per upstream service; never share a single pool across different APIs.
---
## Reason
A slow or failing service's connections occupy the shared pool, starving other services of connections (cascading failure).
---
## Bad Example
```php
$sharedClient = new Client(); // Stripe slowness affects Mailgun calls
```
---
## Good Example
```php
$stripeClient = new Client(['timeout' => 30]); // isolated pool
$mailgunClient = new Client(['timeout' => 10]); // isolated pool
```
---
## Exceptions
Very low-traffic applications where pool exhaustion is not possible.
---
## Consequences Of Violation
Cascading failures across unrelated services during upstream degradation.
## Implement Timeout for the Entire Pool
---
## Category
Reliability
---
## Rule
Set a total timeout for the pool operation to bound execution time.
---
## Reason
Without a pool-level timeout, a single hanging request keeps the entire pool waiting indefinitely.
---
## Bad Example
```php
$responses = Http::pool(fn ($pool) => [
    $pool->get('/slow-endpoint'), // hangs entire pool
]);
```
---
## Good Example
```php
$responses = Http::pool(fn ($pool) => [
    $pool->withOptions(['timeout' => 5])->get('/slow-endpoint'),
    $pool->get('/fast-endpoint'),
]);
```
---
## Exceptions
Streaming pools where prolonged connections are intentional.
---
## Consequences Of Violation
Worker threads blocked on hanging requests, queue backpressure, degraded throughput.
