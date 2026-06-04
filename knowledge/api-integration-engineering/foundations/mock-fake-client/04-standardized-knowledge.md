# ECC Standardized Knowledge — Mock/Fake Client

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-06 |
| Knowledge Unit | Mock/Fake Client |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K010 |

## Overview (Engineering Value)
Mock and fake HTTP clients enable deterministic testing of API integration code without real network calls. Laravel's `Http::fake()` intercepts requests at the Guzzle middleware level, returning predefined responses based on URL patterns. SaloonPHP extends this with `MockClient` for connector-level mocking, request recording, and fixture replay. Faking ensures fast, reliable tests that don't depend on external service availability, while also enabling testing of edge cases (timeouts, errors, rate limits) that are difficult to reproduce with real APIs.

## Core Concepts
- **Http::fake()**: Intercepts all Http facade calls, returns predefined responses per URL pattern
- **Response Sequences**: Chain of responses for testing multiple sequential calls
- **PreventStrayRequests**: Catches un-mocked requests, preventing accidental real HTTP calls in tests
- **Saloon MockClient**: Per-connector or global fake with request recording and fixture replay
- **Request Recording**: Capture real request/response pairs for deterministic test replay
- **Fake Response Builder**: Fluent API for defining status, headers, and body on fake responses

## When To Use
- All unit tests for API integration code
- Integration tests where external service availability is unreliable
- Testing error scenarios (timeouts, 500, 429) that are rare in production
- CI/CD pipelines where network access is restricted

## When NOT To Use
- End-to-end tests that validate real API behavior
- Production code (fakes should never reach production)
- Tests specifically designed to verify HTTP client behavior

## Best Practices
- Always call `Http::preventStrayRequests()` in tests to catch un-mocked requests
- Use response sequences for testing retry logic with progressive responses
- Prefer URL pattern matching over exact URLs for flexible test setup
- Use Saloon's request recording for accurate test fixtures from real API calls
- Avoid mocking at the Guzzle level; use `Http::fake()` for Laravel facade, `MockClient` for Saloon

## Architecture Guidelines
- `Http::fake()` in `setUp()` or per-test for Laravel facade integrations
- `Saloon::fake()` with `MockClient` for Saloon connector integrations
- Fixture files in `tests/Fixtures/` for reusable response data
- Request recording for initial fixture creation, then commit fixtures
- Fake response sequences for testing retry and circuit breaker scenarios

## Performance Considerations
- `Http::fake()` has near-zero overhead in tests
- MockClient runs in-memory, eliminating network latency
- Response recording writes to disk; may be slow in write-constrained CI
- Sequential fake responses support unlimited chaining with zero cost

## Common Mistakes
- Calling `Http::fake()` without `preventStrayRequests()` — accidentally making real HTTP calls in tests
- Faking all tests identically (same response for every scenario) — missing edge case coverage
- Not testing error scenarios (timeouts, 429, 500) — production failures go undetected
- Using real HTTP calls in CI — flaky tests from network issues

## Related Topics
- **Prerequisites**: Laravel Http facade, PHPUnit basics
- **Closely Related**: Service class testing, integration testing, response sequences
- **Advanced**: Saloon request recording, contract testing with Pact
- **Cross-Domain**: Test-driven development, test fixtures

## Verification
- [ ] All integration tests use `Http::fake()` or `MockClient`
- [ ] `preventStrayRequests()` enabled in test suite
- [ ] Error scenarios tested with fake responses (timeout, 500, 429)
- [ ] Retry logic tested with response sequences
- [ ] No real HTTP calls in test suite
