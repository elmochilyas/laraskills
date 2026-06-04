# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: Laravel Http Facade API (get, post, put, patch, delete, pool, concurrent)
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel's Http facade provides an expressive, fluent API built on top of Guzzle for making outgoing HTTP requests. It abstracts away low-level Guzzle configuration while exposing key capabilities: macroable customization, connection pooling, async/concurrent requests, automatic retry, configurable timeouts, middleware hooks, and a comprehensive faking system for testing.

## Core Concepts
- The Http facade proxies to `Illuminate\Http\Client\Factory` which manages Guzzle client instances
- Every request method (get, post, put, patch, delete, head) returns `Illuminate\Http\Client\Response`
- Connection pooling via `pool()` allows concurrent request execution with result aggregation
- `Http::fake()` intercepts requests at the Guzzle middleware level, returning predefined responses
- Macros extend the facade with custom methods via `Http::macro()`
- Global and per-request middleware hooks via `withRequestMiddleware`/`withResponseMiddleware`

## Mental Models
- **Fluent Builder**: Each method call returns a pending request builder; terminate by calling a verb method
- **Proxy Pattern**: The facade proxies through Laravel's container to a factory class that manages Guzzle instances
- **Middleware Pipeline**: Request/response middleware compose in a pipeline, similar to Laravel HTTP kernel middleware

## Internal Mechanics
- Laravel's HTTP client creates a Guzzle `Client` with a custom `HandlerStack` that includes Laravel middleware
- `pool()` creates a `Pool` object that maps requests to array keys using Guzzle's `Pool` for concurrent execution
- The retry mechanism wraps the handler stack with middleware that captures exceptions and retries based on configurable decision logic
- `Http::fake()` replaces the Guzzle handler with a mock handler that matches URL patterns against predefined responses
- Timeout is set via Guzzle's `timeout` and `connect_timeout` request options

## Patterns
- **Fake-First Testing**: Define expected responses before writing consumption code using `Http::fake()->sequence()`
- **Macro Registration**: Register domain-specific HTTP shortcuts in `AppServiceProvider::boot()`
- **Global Middleware**: Register request/response middleware globally for logging, headers, or tracing
- **Response Sequence**: Chain `Http::sequence()` for testing multiple API calls in order
- **PreventStrayRequests**: Call `Http::preventStrayRequests()` in tests to catch un-mocked requests

## Architectural Decisions
- Prefer `Http::fake()` over mocking Guzzle directly for simpler, more readable tests
- Use `Http::pool()` when making multiple independent API calls to reduce total latency
- Use global middleware for cross-cutting concerns (auth headers, user-agent), per-request middleware for specific transformations
- Configure `retry()` with `throw: false` to handle errors manually when you need custom fallback logic

## Tradeoffs
- The facade sacrifices some Guzzle customization for developer ergonomics; use `withOptions()` for Guzzle-specific options
- Pooling increases throughput but complicates error handling per request
- Faking all responses in tests can miss real-world edge cases; use a mix of fakes and recording for integration tests
- Macros are global and can lead to naming conflicts across packages

## Performance Considerations
- Each `Http::pool()` reduces total wall time to the slowest single request, linear to ~max(individual latencies)
- Using `timeout()` prevents hung workers but setting too aggressively causes spurious failures
- Response streaming (`Http::withOptions(['stream' => true])`) reduces memory for large payloads
- `Http::fake()` has near-zero overhead for tests but should never reach production

## Production Considerations
- Never disable SSL verification in production (`verify => false`)
- Configure sensible timeouts: 5-30s connect, 30-60s total for typical APIs
- Use `Http::retry()` with exponential backoff and `throw: false` for resilient consumption
- Log response bodies on failure for debugging but redact sensitive fields
- Monitor 4xx/5xx response rates per API endpoint via Laravel Pulse or Telescope

## Common Mistakes
- Calling `Http::fake()` without `preventStrayRequests()` leading to accidentally real HTTP calls in tests
- Using `dd()` or `dump()` inside middleware which breaks the response pipeline
- Forgetting to call `->body()` on `Response` objects where array access is expected
- Setting `retry()` with `throw: true` (default) and manually catching, leading to double-handling
- Using `Http::pool()` for sequential-dependent requests that must be ordered

## Failure Modes
- DNS resolution failures manifest as `ConnectException` with no response code
- Timeouts produce `ConnectException` indistinguishable from network drops
- SSL certificate errors throw `ConnectException` with `cURL error 60`
- `Http::fake()` with mismatched URL patterns returns 404 in test mode
- Pool responses may arrive out of order; always use array keys to identify responses

## Ecosystem Usage
- Used by all major Laravel packages that consume external APIs (socialite, cashier, spark, etc.)
- Integrated with Laravel Telescope for request/response debugging
- Works with Laravel Pulse for integration health monitoring
- Replaced Guzzle as the default HTTP client choice in the Laravel ecosystem
- Community packages often provide facade macros for specific APIs

## Related Knowledge Units
- K002: Guzzle HTTP Client Internals (underlying transport for the facade)
- K004: Service Class Pattern for API Encapsulation (how to organize facade usage)
- K028: Laravel Horizon Monitoring (monitoring queues that consume APIs via the facade)
- K029: Laravel Telescope Debugging (debugging HTTP client calls)

## Research Notes
- Laravel 13.x HTTP Client documentation confirms pool/async, middleware, retry, and fake capabilities
- Community sources consistently recommend the facade over direct Guzzle for Laravel apps
- Ash Allen's "Consuming APIs In Laravel" book provides the most comprehensive treatment of facade patterns
- The facade's macro system enables clean DSL creation for domain-specific API clients
