# Skill: Build Outbound HTTP Requests with the Laravel Http Facade

## Purpose
Use the `Http` facade to make type-safe, testable outbound HTTP requests with proper timeout, retry, and error handling.

## When To Use
- All Laravel-to-external-API communication as the default client
- Testing integrations without mocking Guzzle directly
- Simple to moderately complex API call patterns

## When NOT To Use
- When full Guzzle handler stack customization is required
- When Saloon's connector/pipeline abstractions are more appropriate
- When non-HTTP protocols are needed (gRPC, WebSocket)

## Prerequisites
- Laravel application with `Http` facade available

## Workflow
1. Use `Http::get()`, `Http::post()`, `Http::withHeaders()` for requests
2. Always set timeouts: `->timeout(30)->connectTimeout(10)`
3. Always chain `->throw()` or explicitly handle HTTP error status codes
4. Use `Http::pool()` for concurrent requests instead of sequential loops
5. Use `Http::macro()` for service-specific defaults (base URL, headers, auth)
6. Use `Http::fake()` in tests with `Http::preventStrayRequests()`
7. Handle responses: `->body()`, `->json()`, `->status()`, `->header()`
8. Use `->retry(3, 100)` for transient failure handling

## Validation Checklist
- [ ] Timeouts set on all outgoing requests
- [ ] `->throw()` used or HTTP errors explicitly handled
- [ ] Pool used for concurrent requests instead of sequential loops
- [ ] `Http::fake()` used in integration tests
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] Macros defined for service-specific defaults
