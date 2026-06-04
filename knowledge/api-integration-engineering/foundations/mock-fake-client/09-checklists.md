# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** mock-fake-client
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `preventStrayRequests()` enabled in test suite
- [ ] All integration tests use `Http::fake()` or `MockClient`
- [ ] Error scenarios tested with fake responses (timeout, 500, 429)
- [ ] Always Use Http::preventStrayRequests() in Tests
- [ ] Mock at the Correct Level
- [ ] Prefer URL Pattern Matching Over Exact URLs
- [ ] Record Real Requests for Accurate Fixtures
- [ ] Use Response Sequences for Retry Testing
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] All external URLs faked in integration tests
- [ ] Assertions verify correct requests were sent
- [ ] Assert on sent requests: `Http::assertSent(function ($request) { ... })`
- [ ] Clear fakes between tests to prevent state leakage
- [ ] Enable `Http::preventStrayRequests()` in test setup

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Assert on sent requests: `Http::assertSent(function ($request) { ... })`
- [ ] Clear fakes between tests to prevent state leakage
- [ ] Enable `Http::preventStrayRequests()` in test setup
- [ ] Fake specific URLs: `Http::fake(['api.example.com/*' => Http::response($body, 200)])`
- [ ] For SaloonPHP: use `MockClient`, `FakeConnector`, and `FakeResponse`
- [ ] Test error scenarios: timeout, 500, 429, connection errors
- [ ] Test retry behavior with mocked failure sequences
- [ ] Use `Http::sequence()` for ordered multiple responses
- [ ] Always Use Http::preventStrayRequests() in Tests
- [ ] Mock at the Correct Level
- [ ] Prefer URL Pattern Matching Over Exact URLs
- [ ] Record Real Requests for Accurate Fixtures

---

# Performance Checklist

- [ ] `Http::fake()` has near-zero overhead in tests
- [ ] MockClient runs in-memory, eliminating network latency
- [ ] Response recording writes to disk; may be slow in write-constrained CI
- [ ] Sequential fake responses support unlimited chaining with zero cost

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Calling `Http::fake()` without `preventStrayRequests()` â€” accidentally making real HTTP calls in tests
- [ ] Faking all tests identically (same response for every scenario) â€” missing edge case coverage
- [ ] Not testing error scenarios (timeouts, 429, 500) â€” production failures go undetected
- [ ] Using real HTTP calls in CI â€” flaky tests from network issues
- [ ] Always Use Http::preventStrayRequests() in Tests
- [ ] Use Response Sequences for Retry Testing

---

# Testing Checklist

- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] `preventStrayRequests()` enabled in test suite
- [ ] All external URLs faked in integration tests
- [ ] All integration tests use `Http::fake()` or `MockClient`
- [ ] Assertions verify correct requests were sent
- [ ] Error scenarios tested (timeout, 5xx, 429)
- [ ] Error scenarios tested with fake responses (timeout, 500, 429)
- [ ] Fakes cleared between tests
- [ ] No real HTTP calls in test suite
- [ ] Retry behavior tested with failure sequences

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using Http::fake() Without preventStrayRequests()]
- [ ] [Identical Fake Responses for All Tests (No Error Scenario Coverage)]
- [ ] [Mocking at the Guzzle Handler Level Instead of Facade/Saloon]
- [ ] [Hand-Written Fixtures That Don't Match Real API Responses]
- [ ] [Not Testing Retry Logic with Response Sequences]

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


