# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: Guzzle HTTP Client Internals (Middleware Stack, Handlers, PSR-18)
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Guzzle is the foundational HTTP client powering Laravel's Http facade and SaloonPHP. Its architecture centers on a handler stack pattern where middleware functions compose around a core handler to form a processing pipeline. Understanding Guzzle's internals—handler resolution, middleware composition, PSR-7/PSR-17/PSR-18 compliance, and promise-based async—is essential for building custom middleware, debugging low-level HTTP issues, and extending Laravel's HTTP client capabilities.

## Core Concepts
- **HandlerStack**: A push/pop stack of middleware that wraps a core handler function
- **Handler**: A callable that accepts `RequestInterface` and options array, returns `PromiseInterface` with `ResponseInterface`
- **Middleware**: Higher-order functions that wrap handlers to augment behavior (logging, retry, auth, redirects)
- **PSR-18 (HttpClient)**: `ClientInterface::sendRequest()` contract for interoperability
- **PSR-7 (Message Interfaces)**: `RequestInterface`, `ResponseInterface`, `StreamInterface`, `UriInterface`
- **PSR-17 (HTTP Factories)**: `RequestFactoryInterface`, `ResponseFactoryInterface`, `StreamFactoryInterface`
- **cURL Handler**: Default handler using `curl_multi_exec` for async capabilities
- **Promise**: Guzzle wraps every request in a promise, enabling sync-to-async unification

## Mental Models
- **Onion Layers**: The handler stack is an onion; the outermost middleware runs first, peeling through to the core handler, then responses pass back out
- **Function Composition**: Each middleware returns a function that receives the next handler; `HandlerStack::resolve()` composes them into a single callable
- **Transport Abstraction**: The handler abstracts the transport (cURL, streams, mock); middleware provides cross-cutting behaviors

## Internal Mechanics
- `HandlerStack::create()` adds default middleware: `http_errors`, `allow_redirects`, `cookies`, `prepare_body`
- `HandlerStack::resolve()` iterates the stack in reverse order, composing each middleware with the next inner handler
- The core handler (e.g., `CurlMultiHandler`) interacts with PHP's cURL multi-handle for async I/O
- Response processing happens in reverse middleware order: `prepare_body` → `cookies` → `allow_redirects` → `http_errors`
- `GuzzleHttp\Promise` library implements thenables and `Each::of()` for concurrency control
- Request options (`timeout`, `headers`, `proxy`) are consumed at different stack layers
- SaloonPHP wraps Guzzle's handler stack to inject its own middleware (auth, mock client, recording)

## Patterns
- **Custom Middleware**: Create middleware via `Middleware::mapRequest()`/`mapResponse()` for request/response transformation
- **Named Middleware**: Register middleware with names via `HandlerStack::push($fn, $name)` to enable before/after ordering
- **Handler Replacement**: Replace the core handler for testing (`MockHandler`) or custom transport
- **Tap Middleware**: Use `$handler->before('name', ...)` and `$handler->after('name', ...)` for relative positioning

## Architectural Decisions
- Prefer middleware over client events for request/response modification (middleware is more performant and explicit)
- Use `HandlerStack::create()` rather than a raw handler to retain default middleware unless you want full control
- Use `GuzzleHttp\Handler\MockHandler` for unit tests, `GuzzleHttp\Handler\CurlMultiHandler` for production
- When building custom middleware, implement `__invoke(callable $handler): callable` for Guzzle compatibility

## Tradeoffs
- Composing middleware in the wrong order can break behavior (e.g., error handling before retry causes retry of already-handled errors)
- Custom handlers bypass Guzzle's default middleware stack; you must re-add required middleware
- Promise-based architecture adds complexity for simple synchronous requests
- PSR-18 compliance narrows interface; some Guzzle features (async, pooling) require non-standard methods

## Performance Considerations
- cURL multi-handle reuses connections via keep-alive, significantly reducing latency for multiple requests to the same host
- `CurlMultiHandler` uses `curl_multi_select()` with configurable select timeout
- Handler stack resolution is cached per client instance; repeated calls avoid recomposition
- Memory for large responses is mitigated via `StreamInterface` which lazily reads from PHP streams

## Production Considerations
- Configure `curl` options via `CurlFactory` for fine-tuning connection pools, DNS caching, and SSL behavior
- Use `HandlerStack::remove('http_errors')` and handle errors manually for fine-grained control
- Register logging middleware to capture request/response pairs for debugging
- Configure connection pooling via `CurlMultiHandler` settings to avoid port exhaustion
- Use `debug` option (or custom middleware) to log curl verbose output during troubleshooting

## Common Mistakes
- Adding middleware without naming, making it impossible to remove or reorder later
- Creating a new handler stack per request instead of per client, skipping middleware resolution cache
- Assuming synchronous `send()` is separate from async; both use the same promise-based pipeline
- Modifying `RequestInterface` after passing to `send()` (PSR-7 requests are immutable in practice but not enforced)
- Using `before()`/`after()` with names that don't exist, silently failing to position middleware

## Failure Modes
- cURL extension not installed: `FatalError` on `CurlMultiHandler` construction
- Handler stack without `http_errors`: 404/500 responses returned as successful `ResponseInterface`
- Missing `prepare_body` middleware: POST requests without Content-Type header
- Incorrect `HandlerStack::resolve()` ordering: middleware executing out of intended order
- Memory exhaustion with large stream responses if `StreamInterface::getContents()` called eagerly

## Ecosystem Usage
- Underpins Laravel's HTTP client (every `Http::get()` call goes through Guzzle handler stack)
- SaloonPHP builds its connector/request system on top of Guzzle handler stack
- PHP SDKs for Stripe, GitHub, AWS, and most major APIs use Guzzle internally
- PSR-18 enables swap-in replacement of HTTP clients across PHP ecosystem

## Related Knowledge Units
- K001: Laravel Http Facade API (built on Guzzle handler stack)
- K010: SaloonPHP Connector/Request/Response Pattern (uses Guzzle as transport)
- K005: Retry Strategies (implemented as Guzzle middleware)
- K007: Circuit Breaker Pattern (can be implemented as Guzzle middleware)

## Research Notes
- Guzzle v7.x is the current stable version, used by Laravel 10-13
- PSR-18 compliance ensures Guzzle can be replaced by any PSR-18 client
- Guzzle's internal `HandlerStack` class is marked `@final` indicating future composition changes
- The promise library is standalone (`guzzlehttp/promises`) and reusable outside Guzzle
