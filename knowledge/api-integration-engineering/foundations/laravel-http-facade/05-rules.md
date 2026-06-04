## Always Set Timeouts
---
## Category
Reliability
---
## Rule
Always configure `->timeout()` and `->connectTimeout()` on every outbound HTTP request.
---
## Reason
Prevents a single slow or hanging API call from blocking request processing resources indefinitely.
---
## Bad Example
```php
Http::post('https://api.example.com/charges', $data);
```
---
## Good Example
```php
Http::timeout(30)->connectTimeout(5)->post('https://api.example.com/charges', $data);
```
---
## Exceptions
Streaming responses (SSE, large file downloads) may require longer or no timeout.
---
## Consequences Of Violation
Worker process hangs, request queue backs up, cascading timeout failures across the application.
## Always Use `->throw()`
---
## Category
Reliability
---
## Rule
Always chain `->throw()` or explicitly handle HTTP error status codes on Http facade calls.
---
## Reason
Silently ignoring 4xx/5xx responses leads to logic errors, data corruption, and hard-to-debug failures.
---
## Bad Example
```php
$response = Http::get('https://api.example.com/users');
$data = $response->json(); // works on 200 and 500
```
---
## Good Example
```php
$response = Http::get('https://api.example.com/users')->throw();
$data = $response->json();
```
---
## Exceptions
When the response status is intentionally checked for branching logic (e.g., 404 means "not found").
---
## Consequences Of Violation
Silent data corruption, unexpected null values propagating through the application, debugging difficulty.
## Always Use Http::pool() for Concurrent Requests
---
## Category
Performance
---
## Rule
Prefer `Http::pool()` over sequential `Http::get()` calls in loops when requests are independent.
---
## Reason
Sequential requests in loops multiply wall-clock time by the number of requests; pooling executes them concurrently.
---
## Bad Example
```php
foreach ($userIds as $id) {
    $responses[] = Http::get("https://api.example.com/users/{$id}");
}
```
---
## Good Example
```php
$responses = Http::pool(fn (Pool $pool) => array_map(
    fn ($id) => $pool->get("https://api.example.com/users/{$id}"),
    $userIds
));
```
---
## Exceptions
When requests have sequential data dependencies (each depends on the previous response).
---
## Consequences Of Violation
N+1 latency problem, unnecessarily slow page loads, poor user experience under load.
## Enable Http::preventStrayRequests() in Tests
---
## Category
Testing
---
## Rule
Always enable `Http::preventStrayRequests()` in your test suite to catch unmocked HTTP calls.
---
## Reason
Prevents accidental real HTTP requests during testing that cause flaky, slow, or environment-dependent tests.
---
## Bad Example
```php
public function setUp(): void { Http::fake(); /* but stray requests silently pass */ }
```
---
## Good Example
```php
public function setUp(): void { Http::preventStrayRequests(); Http::fake(); }
```
---
## Exceptions
End-to-end tests that intentionally hit real APIs.
---
## Consequences Of Violation
Flaky tests that fail only in CI, accidental rate limit hits on production APIs, test pollution.
## Use Http::macro() for Service-Specific Defaults
---
## Category
Code Organization
---
## Rule
Use `Http::macro()` to define pre-configured client defaults per external service instead of repeating config.
---
## Reason
Centralizes base URL, headers, timeouts, and retry config in one place, reducing duplication and misconfiguration.
---
## Bad Example
```php
Http::withToken($token)->baseUrl('https://api.stripe.com/v1')->timeout(30)->get('/charges');
Http::withToken($token)->baseUrl('https://api.stripe.com/v1')->timeout(30)->post('/charges', $data);
```
---
## Good Example
```php
Http::macro('stripe', fn () => Http::withToken(config('services.stripe.secret'))
    ->baseUrl('https://api.stripe.com/v1')->timeout(30)->acceptJson()
);
Http::stripe()->get('/charges');
Http::stripe()->post('/charges', $data);
```
---
## Exceptions
Very simple single-endpoint integrations where a macro adds unnecessary indirection.
---
## Consequences Of Violation
Scattered configuration, inconsistent timeout/retry settings, difficult to update service-wide defaults.
