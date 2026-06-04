# Skill: Mock and Fake HTTP Responses in Integration Tests

## Purpose
Use `Http::fake()`, `Http::preventStrayRequests()`, and Saloon's `MockClient` to write deterministic, fast integration tests without hitting real external APIs.

## When To Use
- Every integration test for API-consuming code
- Preventing accidental real HTTP calls during testing
- Testing error scenarios (timeouts, 5xx, 429) deterministically
- CI/CD pipelines where external API access is unavailable

## When NOT To Use
- End-to-end tests intentionally hitting real APIs
- Tests where real API interaction is required (contract tests)

## Prerequisites
- PHPUnit configured
- Http facade or SaloonPHP in use

## Workflow
1. Enable `Http::preventStrayRequests()` in test setup
2. Fake specific URLs: `Http::fake(['api.example.com/*' => Http::response($body, 200)])`
3. Use `Http::sequence()` for ordered multiple responses
4. Test error scenarios: timeout, 500, 429, connection errors
5. Assert on sent requests: `Http::assertSent(function ($request) { ... })`
6. For SaloonPHP: use `MockClient`, `FakeConnector`, and `FakeResponse`
7. Clear fakes between tests to prevent state leakage
8. Test retry behavior with mocked failure sequences

## Validation Checklist
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] All external URLs faked in integration tests
- [ ] Error scenarios tested (timeout, 5xx, 429)
- [ ] Assertions verify correct requests were sent
- [ ] Fakes cleared between tests
- [ ] Retry behavior tested with failure sequences
