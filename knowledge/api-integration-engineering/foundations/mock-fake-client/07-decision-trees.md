# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** mock-fake-client
**Generated:** 2026-06-03

---

# Decision Inventory

1. Mocking Tool Selection
2. Test Fixture Strategy
3. Error Scenario Coverage

---

# Architecture-Level Decision Trees

---

## Mocking Tool Selection

---

## Decision Context

Choosing between Http::fake(), Saloon MockClient, or Guzzle mocking.

---

## Decision Criteria

* maintainability
* architectural
* performance

---

## Decision Tree

Is the integration using Laravel Http facade directly?
↓
YES → Use Http::fake() (simplest, built-in, no extra packages)
  ↓
  Using service class pattern?
  ↓
  YES ->Http::fake() in test setup; inject faked client
  NO ->Http::fake() globally or per-test
NO → Is the integration using SaloonPHP?
  ↓
  YES → Use Saloon MockClient (connector-aware, record/replay)
  ↓
  Need response recording from real API?
  ↓
  YES → MockClient::record() for fixture creation → commit fixtures
  NO → Manual MockClient response setup
NO → Use GuzzleMockHandler (low-level, rare use case)

---

## Rationale

Match the mocking tool to the HTTP client layer. Http::fake() is simplest for facade users; MockClient provides richer features for Saloon users. Guzzle-level mocking is for custom handler stacks.

---

## Recommended Default

**Default:** Http::fake() for facade-based code; MockClient for Saloon
**Reason:** Matches abstraction level of the code under test

---

## Risks Of Wrong Choice

Mocking at wrong layer (Guzzle for facade code) creates brittle tests. No mocking at all makes tests slow and flaky.

---

## Related Rules

Use Http::fake() for facade, MockClient for Saloon

---

## Related Skills

Mock HTTP Clients in Tests

---

## Test Fixture Strategy

---

## Decision Context

Creating and managing fake response data for integration tests.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Are the API responses complex (>20 fields)?
↓
YES → Store JSON fixture files in tests/Fixtures/
  ↓
  Need accurate data from real API?
  ↓
  YES → Use Saloon request recording to capture fixtures
  NO → Manually create fixture files from API docs
NO → Use inline Http::response([...]) in test methods
  ↓
  Need same fixture for multiple tests?
  ↓
  YES → Extract to test helper method or fixture constant
  NO → Inline is fine

---

## Rationale

Fixture files keep tests readable and reusable. Recorded fixtures accurately reflect real API responses. Inline responses are fine for simple, single-use cases.

---

## Recommended Default

**Default:** JSON fixtures in tests/Fixtures/ with helper factory methods
**Reason:** Reusable, readable, and maintainable across the test suite

---

## Risks Of Wrong Choice

Inline responses for complex APIs make tests unreadable. Unrealistic fixtures cause tests to pass but integration to fail.

---

## Related Rules

Use fixtures in tests/Fixtures/ for reusable response data

---

## Related Skills

Mock HTTP Clients in Tests

---

## Error Scenario Coverage

---

## Decision Context

Ensuring tests cover failure modes beyond happy path.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does the code handle timeout exceptions?
↓
YES → Test with fake timeout: Http::response(null, 500, ['timeout' => true])
  ↓
  Handle 500 errors?
  ↓
  YES → Test with 500 response sequence → verify retry/circuit breaker
  NO → Add 500 handling; uncovered error path
NO → Does the code handle rate limiting (429)?
  ↓
  YES → Test with 429 + Retry-After header → verify backoff
  NO → May cause silent failures on rate limit
  ↓
  Test malformed response bodies?
  ↓
  YES → Test with missing fields, wrong types → verify DTO parsing
  NO → Production failures from unexpected API changes

---

## Rationale

Error scenario testing ensures resilience patterns work when needed. Each failure mode needs explicit test coverage since real failures are rare and hard to reproduce.

---

## Recommended Default

**Default:** Test timeout, 500, 429, and malformed responses per service
**Reason:** Covers 90%+ of production failure modes

---

## Risks Of Wrong Choice

Untested error paths fail in production, often at the worst time. Missing malformed response testing causes cryptic JSON parsing errors.

---

## Related Rules

Test error scenarios with fake responses

---

## Related Skills

Mock HTTP Clients in Tests
