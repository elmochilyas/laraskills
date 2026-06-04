## Reuse Same Connector Instance for Connection Pooling
---
## Category
Performance
---
## Rule
Reuse the same Guzzle client or Saloon connector instance for all requests to the same host to enable connection pooling.
---
## Reason
TCP connection reuse eliminates TLS handshake (1-2 RTT) overhead on subsequent requests, reducing latency by 50-200ms per request.
---
## Bad Example
```php
foreach ($ids as $id) {
    $client = new Client(); // new connection each time
    $client->get("https://api.example.com/{$id}");
}
```
---
## Good Example
```php
$client = new Client(); // single instance, reused connections
foreach ($ids as $id) {
    $client->get("https://api.example.com/{$id}");
}
```
---
## Exceptions
Requests to different hosts that don't benefit from shared connection pools.
---
## Consequences Of Violation
Higher latency per request, increased socket consumption, unnecessary TLS handshake overhead.
## Use Named Keys with Http::pool() for Response Correlation
---
## Category
Architecture
---
## Rule
Use named keys in `Http::pool()` to correlate responses back to their originating requests.
---
## Reason
Pool responses may arrive in any order; named keys provide deterministic response-to-request mapping.
---
## Bad Example
```php
$responses = Http::pool(fn (Pool $pool) => [
    $pool->get('https://api.example.com/users'),
    $pool->get('https://api.example.com/orders'),
]);
// $responses[0] could be users or orders — unpredictable
```
---
## Good Example
```php
$responses = Http::pool(fn (Pool $pool) => [
    'users' => $pool->get('https://api.example.com/users'),
    'orders' => $pool->get('https://api.example.com/orders'),
]);
$users = $responses['users']->json(); // deterministic
$orders = $responses['orders']->json();
```
---
## Exceptions
Single-pool requests where correlation is unnecessary.
---
## Consequences Of Violation
Bugs caused by assuming response order matches request order, hard-to-debug data misalignment.
## Set Conservative Concurrency for Rate-Limited APIs
---
## Category
Performance
---
## Rule
Limit pool concurrency to 5-10 for rate-limited upstream APIs; use 25-50 for internal services.
---
## Reason
Excessive concurrency triggers upstream rate limits (429) which cause retries and degraded throughput.
---
## Bad Example
```php
Http::pool(fn (Pool $pool) => [
    // 50 concurrent requests to a rate-limited API
    ...array_map(fn ($id) => $pool->get("/items/{$id}"), range(1, 50)),
]);
```
---
## Good Example
```php
// Limit concurrency via batch processing
foreach (array_chunk($ids, 5) as $batch) {
    $responses = Http::pool(fn (Pool $pool) => array_map(
        fn ($id) => $pool->get("/items/{$id}"), $batch
    ));
}
```
---
## Exceptions
Internal services with guaranteed capacity where higher concurrency is safe.
---
## Consequences Of Violation
429 rate limit errors, wasted retry resources, degraded throughput instead of improved.
## Separate Pools Per Upstream for Failure Isolation
---
## Category
Reliability
---
## Rule
Use separate connection pools per upstream service; never share a pool across different services.
---
## Reason
A slow or failing service should not exhaust connection pool resources needed by other services (bulkhead pattern).
---
## Bad Example
```php
$client = new Client(); // shared — Stripe slowness blocks Mailgun calls
```
---
## Good Example
```php
$stripeClient = new Client(['timeout' => 30]); // isolated
$mailgunClient = new Client(['timeout' => 15]); // isolated
```
---
## Exceptions
Very low-traffic environments where resource contention is impossible.
---
## Consequences Of Violation
Cascading failures — one service's latency spike exhausts the shared pool, blocking all integrations.
## Handle Individual Pool Request Errors
---
## Category
Reliability
---
## Rule
Wrap each pool request in try-catch or use per-request error handling; never let one failure crash the entire pool.
---
## Reason
A single failed request in a pool should not prevent other concurrent requests from completing.
---
## Bad Example
```php
$responses = Http::pool(fn (Pool $pool) => [
    $pool->get('/users'), // if this fails, exception propagates
    $pool->get('/orders'),
]);
```
---
## Good Example
```php
$responses = Http::pool(fn (Pool $pool) => [
    'users' => $pool->get('/users')->catch(fn () => null),
    'orders' => $pool->get('/orders')->catch(fn () => null),
]);
```
---
## Exceptions
When the pool result is only meaningful if all requests succeed.
---
## Consequences Of Violation
One failed request prevents use of successfully fetched data, reducing overall availability.
