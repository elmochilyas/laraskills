## Always Use Http::preventStrayRequests() in Tests
---
## Category
Testing
---
## Rule
Enable `Http::preventStrayRequests()` in every test that uses `Http::fake()` to fail tests on unmocked requests.
---
## Reason
Catches unintentional real HTTP requests that make tests flaky, slow, and dependent on external API availability.
---
## Bad Example
```php
public function setUp(): void { Http::fake(); /* unmocked requests go to real API */ }
```
---
## Good Example
```php
public function setUp(): void { Http::preventStrayRequests(); Http::fake(); }
```
---
## Exceptions
End-to-end tests that intentionally call real APIs.
---
## Consequences Of Violation
Flaky tests that pass locally but fail in CI, accidental rate limit consumption, test pollution.
## Use Response Sequences for Retry Testing
---
## Category
Testing
---
## Rule
Use `Http::sequence()` to test retry logic with progressive failure-then-success responses.
---
## Reason
Response sequences simulate transient failures that trigger retry, verifying that retry logic works correctly.
---
## Bad Example
```php
Http::fake(['*' => Http::response(['status' => 'ok'], 200)]); // never tests retry path
```
---
## Good Example
```php
Http::fake(['*' => Http::sequence()
    ->pushStatus(503) // first attempt fails
    ->pushStatus(503) // second attempt fails
    ->pushStatus(200) // third attempt succeeds
]);
```
---
## Exceptions
Tests specifically for non-retryable error handling.
---
## Consequences Of Violation
Retry logic untested in tests, production retry loops behave unexpectedly under failure.
## Prefer URL Pattern Matching Over Exact URLs
---
## Category
Testing
---
## Rule
Use URL pattern matching in `Http::fake()` instead of exact URLs for flexible, maintainable test setup.
---
## Reason
Pattern matching allows the same fake to work across minor URL variations and makes tests less brittle to URL changes.
---
## Bad Example
```php
Http::fake(['https://api.stripe.com/v1/charges' => Http::response([])]); // breaks if URL changes
```
---
## Good Example
```php
Http::fake(['api.stripe.com/*' => Http::response([])]); // flexible pattern match
```
---
## Exceptions
When you need to assert exact URL was called (use pattern + `Http::assertSent()`).
---
## Consequences Of Violation
Tests break on minor URL changes (trailing slashes, version bumps), high maintenance burden.
## Mock at the Correct Level
---
## Category
Testing
---
## Rule
Use `Http::fake()` for Laravel Http facade integrations and `MockClient` for Saloon connector integrations; never mock at the Guzzle level.
---
## Reason
Http facade and Saloon have their own testing utilities; mocking at the Guzzle level is complex and bypasses application-layer behavior.
---
## Bad Example
```php
// Mocking HandlerStack directly — fragile and complex
$mock = new MockHandler([...]);
$stack = HandlerStack::create($mock);
```
---
## Good Example
```php
// Laravel Http facade
Http::fake(['api.example.com/*' => Http::response([])]);
// Saloon connector
$connector->withMockClient(new MockClient([...]));
```
---
## Exceptions
Writing a custom Guzzle middleware test where HandlerStack manipulation must be verified.
---
## Consequences Of Violation
Overly complex test setup, tests that break on Laravel upgrades, missed application-level logic.
## Record Real Requests for Accurate Fixtures
---
## Category
Testing
---
## Rule
Use Saloon's request recording or manual capture to create test fixtures from real API responses.
---
## Reason
Hand-written fixtures often miss real-world response shapes (nullable fields, unexpected keys, error formats), causing tests to pass but production to fail.
---
## Bad Example
```php
// Hand-written fixture that doesn't match real API
Http::fake(['*' => Http::response(['id' => 1, 'name' => 'test'])]);
```
---
## Good Example
```php
// Recorded from real API call
Http::fake(['*' => Http::response(
    json_decode(file_get_contents('tests/Fixtures/stripe/charge.json'), true)
)]);
```
---
## Exceptions
Simple APIs with stable, well-documented response schemas.
---
## Consequences Of Violation
Tests pass with fictional data shapes but fail against real API responses in production.
