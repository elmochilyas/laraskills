# ECC Anti-Patterns — Mock/Fake Client

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Mock/Fake Client |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using `Http::fake()` Without `preventStrayRequests()`
2. Identical Fake Responses for All Tests (No Error Scenario Coverage)
3. Mocking at the Guzzle Handler Level Instead of Facade/Saloon
4. Hand-Written Fixtures That Don't Match Real API Responses
5. Not Testing Retry Logic with Response Sequences

---

## Repository-Wide Anti-Patterns

- Premature Optimization

---

## Anti-Pattern 1: Using `Http::fake()` Without `preventStrayRequests()`

### Category
Testing | Reliability

### Description
Calling `Http::fake()` in test setup without also enabling `Http::preventStrayRequests()`. Un-mocked URL patterns silently make real HTTP calls.

### Why It Happens
Most blog posts and documentation show `Http::fake()` but omit `preventStrayRequests()`. Developers assume fake intercepts everything.

### Warning Signs
- `Http::fake()` called without `Http::preventStrayRequests()`
- Tests occasionally slow down (real network calls)
- Flaky CI failures due to API rate limits or network issues

### Why It Is Harmful
Real HTTP calls in tests create flakiness, slow execution, environment-dependent failures, and risk of modifying production data. Silent real calls undermine the entire purpose of faking.

### Real-World Consequences
A new developer adds an endpoint without faking it. The test suite makes 100 real API calls per run. 50 developers × 10 runs/day = 500 unintended API calls. The API provider rate-limits the application's IP, affecting production traffic.

### Preferred Alternative
Always enable `Http::preventStrayRequests()` after `Http::fake()`.

### Refactoring Strategy
1. Add `Http::preventStrayRequests()` to test `setUp()` methods
2. Fix any tests that break (add proper fakes for all URLs)
3. Consider adding to a base test class
4. Verify no real HTTP calls with network monitoring

### Detection Checklist
- [ ] No `Http::preventStrayRequests()` where `Http::fake()` is used
- [ ] Tests make real HTTP calls
- [ ] Test suite flakiness from network issues

### Related Rules
Always Use Http::preventStrayRequests() in Tests (05-rules.md)

### Related Skills
Mock and Fake HTTP Responses in Integration Tests (06-skills.md)

### Related Decision Trees
Mocking Tool Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Identical Fake Responses for All Tests (No Error Scenario Coverage)

### Category
Testing | Reliability

### Description
Using the same successful HTTP response for all test scenarios. Error cases (timeout, 500, 429, malformed response) are never tested.

### Why It Happens
Happy-path tests are written first. Error scenarios are perceived as "edge cases" that are unlikely and not worth the test effort.

### Warning Signs
- Every test fakes the same 200 OK response
- No test for HTTP 500 handling
- No test for timeout exceptions
- No test for 429 rate limit responses

### Why It Is Harmful
Error handling code is the least exercised but most critical path. Production failures from untested error scenarios cause service degradation. The code that handles API errors is the code most likely to have bugs.

### Real-World Consequences
Stripe API returns 429 (rate limited). The code's retry-after handling has a bug that causes infinite retry loop. Because no test covered 429, this bug reaches production. 10,000 retry requests in 5 minutes. Stripe temporarily bans the integration.

### Preferred Alternative
Test timeout, 500, 429, and malformed response scenarios for every service.

### Refactoring Strategy
1. Audit error handling code for each service
2. Write tests for each error scenario (timeout, 500, 429, malformed)
3. Use `Http::sequence()` for progressive responses (fail → success)
4. Include assertion that error handling triggers the correct behavior
5. Run error tests in CI

### Detection Checklist
- [ ] No error scenario tests exist
- [ ] All fakes return 200 OK
- [ ] Untested code paths in error handling

### Related Rules
Use Response Sequences for Retry Testing (05-rules.md)

### Related Skills
Mock and Fake HTTP Responses in Integration Tests (06-skills.md)

### Related Decision Trees
Error Scenario Coverage (07-decision-trees.md)

---

## Anti-Pattern 3: Mocking at the Guzzle Handler Level Instead of Facade/Saloon

### Category
Testing | Maintainability

### Description
Using Guzzle's `MockHandler` directly instead of `Http::fake()` (for facade) or `MockClient` (for Saloon). Creates brittle, over-specified tests coupled to Guzzle internals.

### Why It Happens
Developers familiar with Guzzle from non-Laravel projects use the Guzzle mocking API they know. They don't realize Laravel provides higher-level faking utilities.

### Warning Signs
- `MockHandler`, `HandlerStack::create($mock)`, or `History` in test code
- Tests break on Laravel version upgrades
- Test setup requires understanding Guzzle handler stack internals

### Why It Is Harmful
Tests are coupled to the transport implementation. Upgrading Guzzle or switching to a non-curl handler breaks all tests. Setup is verbose and complex.

### Real-World Consequences
Laravel upgrades from Guzzle 7 to 8. The `MockHandler` API changes slightly. All 50 integration tests break simultaneously. The team spends 2 days updating tests instead of upgrading the application.

### Preferred Alternative
Use `Http::fake()` for Laravel Http facade code and `Saloon::fake()` with `MockClient` for Saloon connector code.

### Refactoring Strategy
1. Identify tests using Guzzle `MockHandler`
2. Replace with `Http::fake()` for Laravel facade tests
3. Replace with `MockClient` for Saloon connector tests
4. Remove Guzzle mocking imports
5. Simplify test setup

### Detection Checklist
- [ ] `MockHandler` or `HandlerStack::create($mock)` in test code
- [ ] Tests import Guzzle mocking classes
- [ ] Test setup is complex and verbose

### Related Rules
Mock at the Correct Level (05-rules.md)

### Related Skills
Mock and Fake HTTP Responses in Integration Tests (06-skills.md)

### Related Decision Trees
Mocking Tool Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Hand-Written Fixtures That Don't Match Real API Responses

### Category
Testing | Reliability

### Description
Creating fake response data manually instead of recording real API responses. Hand-written fixtures often differ from actual API responses in structure, field types, or nullability.

### Why It Happens
Developers write fixture data based on API documentation, which may be incomplete or out of date. Recording requires a real API call, which seems like extra effort.

### Warning Signs
- Fixture data written inline in test methods
- Tests pass but integration fails with real API data
- Field types in fixtures don't match real API (string vs null, int vs string)

### Why It Is Harmful
Tests validate against imaginary data shapes. The DTO parsing code may work with hand-written fixtures but fail with real API responses that have unexpected fields, nullable values, or different key formats.

### Real-World Consequences
Stripe adds a new nullable field `payment_method_details` to charge responses. Hand-written fixtures don't include it. The DTO parser works in tests. In production, null handling for this field is broken, causing 500 errors on 30% of charges.

### Preferred Alternative
Record real API responses using Saloon's request recording or manual capture. Use those as test fixtures.

### Refactoring Strategy
1. Make a real API call to capture the actual response
2. Save the response JSON to `tests/Fixtures/{service}/{endpoint}.json`
3. Use the fixture file in all test fakes
4. Periodically re-record fixtures to catch API changes
5. For error scenarios, craft fixtures based on real error responses

### Detection Checklist
- [ ] Fixture data written inline without real API capture
- [ ] Fixtures differ from real API responses
- [ ] DTO parsing fails in production but passes in tests

### Related Rules
Record Real Requests for Accurate Fixtures (05-rules.md)

### Related Skills
Mock and Fake HTTP Responses in Integration Tests (06-skills.md)

### Related Decision Trees
Test Fixture Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Not Testing Retry Logic with Response Sequences

### Category
Testing | Reliability

### Description
Testing with single fake responses that never exercise the retry code path. Retry logic may have bugs that are only discovered during production failures.

### Why It Happens
Developers test the happy path where the first request succeeds. Setting up response sequences requires understanding the retry configuration and the expected number of attempts.

### Warning Signs
- All fake responses return 200 OK
- Retry configuration exists but no test exercises it
- No `Http::sequence()` usage in test suite

### Why It Is Harmful
Retry logic is the most likely code path to have bugs: wrong backoff calculation, infinite retry loops, max attempt count not respected, idempotency not maintained across retries. These bugs only surface during real failures.

### Real-World Consequences
`->retry(3, 100)` is configured but the actual backoff uses milliseconds instead of milliseconds. All 3 retries happen within 300ms, exhausting the rate limit. No test caught this because retry was never exercised in tests.

### Preferred Alternative
Use `Http::sequence()` to test retry behavior with failure-then-success response chains.

### Refactoring Strategy
1. Identify all retry configurations in the codebase
2. For each, write a test using `Http::sequence()` with failures followed by success
3. Assert that retry count, backoff timing, and success outcome are correct
4. Test max retries exhaustion (all failures)
5. Test that idempotency key is preserved across retries

### Detection Checklist
- [ ] Retry configured but not tested
- [ ] No `Http::sequence()` in tests
- [ ] All fakes return success

### Related Rules
Use Response Sequences for Retry Testing (05-rules.md)

### Related Skills
Mock and Fake HTTP Responses in Integration Tests (06-skills.md)

### Related Decision Trees
Error Scenario Coverage (07-decision-trees.md)
