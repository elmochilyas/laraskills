## Create Handler Stack Per Service
---
## Category
Code Organization
---
## Rule
Create a separate Guzzle handler stack per service; never mutate the global default handler stack.
---
## Reason
Shared handler stack mutation causes cross-service interference — middleware added for one service affects all others.
---
## Bad Example
```php
$stack = HandlerStack::create();
$stack->push($monitoringMiddleware); // mutates shared state
$client = new Client(['handler' => $stack]);
```
---
## Good Example
```php
$stack = HandlerStack::create();
$stack->push($monitoringMiddleware);
$client = new Client(['handler' => clone $stack]); // isolate per service
```
---
## Exceptions
Single-service applications where no isolation is needed.
---
## Consequences Of Violation
Mysterious middleware interactions, duplicate logging, unintended retry behavior across services.
## Order Middleware Correctly (Auth Inside Retry)
---
## Category
Architecture
---
## Rule
Push monitoring middleware as outer layers (executed last) and auth middleware as inner layers (executed first).
---
## Reason
Auth inside retry ensures auth only runs once; monitoring outside guarantees it captures all attempts including retries.
---
## Bad Example
```php
$stack->push($retryMiddleware);  // outer
$stack->push($loggingMiddleware); // inner — logs before retry, misses retry details
```
---
## Good Example
```php
$stack->push($loggingMiddleware); // outer — captures all attempts
$stack->push($retryMiddleware);
$stack->push($authMiddleware);    // inner — runs once before retry
```
---
## Exceptions
None — middleware ordering is deterministic.
---
## Consequences Of Violation
Auth tokens sent on every retry attempt (wasteful), incomplete monitoring data, debugging difficulty.
## Avoid Mutable State Inside Middleware Closures
---
## Category
Maintainability
---
## Rule
Keep Guzzle middleware stateless and side-effect-free; never mutate shared state inside middleware closures.
---
## Reason
Mutable state in middleware causes race conditions in concurrent request scenarios, producing unpredictable behavior.
---
## Bad Example
```php
$counter = 0;
$stack->push(function ($handler) use (&$counter) {
    return function ($request, $options) use ($handler, &$counter) {
        $counter++; // race condition
        return $handler($request, $options);
    };
});
```
---
## Good Example
```php
$stack->push(function ($handler) {
    return function ($request, $options) use ($handler) {
        $start = microtime(true);
        $result = $handler($request, $options);
        Log::debug('request completed', ['duration' => microtime(true) - $start]);
        return $result;
    };
});
```
---
## Exceptions
Lock-protected shared state when strictly necessary.
---
## Consequences Of Violation
Race conditions, non-deterministic behavior, hard-to-reproduce production bugs.
## Use tap() for Clean Stack Composition
---
## Category
Maintainability
---
## Rule
Use `tap()` with `HandlerStack::create()` for clean, readable handler stack composition.
---
## Reason
`tap()` allows pushing middleware in a fluent chain, making stack composition explicit and easy to review.
---
## Bad Example
```php
$stack = HandlerStack::create();
$stack->push($logging);
$stack->push($retry);
$stack->push($auth);
```
---
## Good Example
```php
$stack = tap(HandlerStack::create(), function ($stack) {
    $stack->push($logging);
    $stack->push($retry);
    $stack->push($auth);
});
```
---
## Exceptions
Trivial stacks with a single middleware.
---
## Consequences Of Violation
Less readable stack setup, harder to reason about middleware order in code reviews.
## Configure Timeouts via Guzzle Client, Not Each Request
---
## Category
Reliability
---
## Rule
Set `connect_timeout` and `timeout` at the Guzzle client constructor level, not on individual request options.
---
## Reason
Client-level timeouts ensure consistent behavior across all requests; per-request overrides are easily forgotten.
---
## Bad Example
```php
$client = new Client();
$response = $client->get('https://api.example.com', ['timeout' => 5]);
```
---
## Good Example
```php
$client = new Client(['connect_timeout' => 5, 'timeout' => 30]);
$response = $client->get('https://api.example.com');
```
---
## Exceptions
Specific endpoints with known different latency profiles may override.
---
## Consequences Of Violation
Inconsistent timeout behavior, some requests hanging indefinitely, resource exhaustion.
