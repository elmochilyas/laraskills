# ECC Standardized Knowledge — Laravel HTTP Client Facade

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Laravel HTTP Client Facade |
| Difficulty | Beginner |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K016 |

## Overview (Engineering Value)
The `Http` facade is Laravel's primary API for making outbound HTTP calls. It provides a fluent, expressive interface wrapping Guzzle, with built-in support for testing (Http fake), macros, pools, concurrent requests, and retry middleware. Understanding the facade's full API enables concise, standardized HTTP communication across all integrations.

## Core Concepts
- **Http Facade**: `Http::get()`, `Http::post()`, `Http::withHeaders()`, etc.
- **PendingRequest**: Mutable builder object accumulating request configuration
- **Response Object**: Rich response with `->body()`, `->json()`, `->status()`, `->header()`
- **Macros**: Custom macros extend Http facade with domain-specific defaults
- **Http Fake**: Testing helper intercepting all requests without real calls
- **Pool Requests**: `Http::pool()` for concurrent request execution
- **Request/Response Lifecycle**: Builder pattern → Guzzle middleware → cURL → response

## When To Use
- All Laravel-to-external-API communication as the default client
- Testing integrations without mocking Guzzle directly
- Simple to moderately complex API call patterns

## When NOT To Use
- When full Guzzle handler stack customization is required
- When Saloon's connector/pipeline abstractions are more appropriate
- When non-HTTP protocols are needed (gRPC, WebSocket, etc.)

## Best Practices
- Use `Http::macro()` for pre-configured client defaults per service
- Use `Http::fake()` in tests with sequence for ordered responses
- Prefer `Http::pool()` over async promises for cleaner concurrent code
- Always set timeouts: `->timeout(30)` and `->connectTimeout(10)`
- Use `->retry()` for transient failure handling
- Leverage `->throw()` to convert HTTP errors to exceptions

## Architecture Guidelines
- Never instantiate `Http` directly; always use the facade
- Centralize service-specific configuration in macro or dedicated class
- Use `Http::pool()` for fan-out patterns, not sequential loops
- Test coverage via `Http::fake()` with assertion on sent requests

## Performance Considerations
- Facade overhead is negligible (~0.01ms per call)
- Pool requests share the same Guzzle client for connection reuse
- Response body is a string until parsed (streaming large responses possible)
- Each fakeable assertion serializes the request for comparison

## Common Mistakes
- Using `Http::withOptions()` where facade methods suffice (over-configuration)
- Missing `->throw()` and silently ignoring 4xx/5xx responses
- Sequential `Http::get()` in loops instead of `Http::pool()`
- Not cleaning up `Http::preventStrayRequests()` in tests
- Using global `Http::fake()` instead of scoped fake for specific requests

## Related Topics
- **Prerequisites**: PHP HTTP fundamentals, Guzzle basics
- **Closely Related**: Guzzle internals, connection pooling, concurrency pools
- **Advanced**: Custom macros, response macros, streaming responses
- **Cross-Domain**: Laravel fundamentals, testing best practices

## Verification
- [ ] Timeouts set on all outgoing requests
- [ ] `->throw()` used or HTTP errors explicitly handled
- [ ] Pool used for concurrent requests instead of sequential loops
- [ ] `Http::fake()` used in integration tests
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] Macros defined for service-specific defaults
