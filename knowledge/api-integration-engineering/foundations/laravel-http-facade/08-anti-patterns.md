# ECC Anti-Patterns — Laravel HTTP Client Facade

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Laravel HTTP Client Facade |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Missing Timeouts on Outbound HTTP Requests
2. Silent Failure: Not Using `->throw()` or Error Handling
3. Sequential HTTP Calls in Loops Instead of Pools
4. Missing `preventStrayRequests()` in Test Suites
5. Repeated Configuration Without Using `Http::macro()`

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Hidden Database Queries

---

## Anti-Pattern 1: Missing Timeouts on Outbound HTTP Requests

### Category
Reliability | Performance

### Description
Making HTTP requests without setting `->timeout()` and `->connectTimeout()`. A single hanging upstream call blocks the worker indefinitely.

### Why It Happens
Developers copy-paste example code that omits timeouts. Local development APIs respond instantly, so timeouts seem unnecessary.

### Warning Signs
- `Http::post(...)` without `->timeout()` chain
- Worker processes blocked for >60s on API calls
- Queue backpressure coinciding with upstream API issues

### Why It Is Harmful
A hanging API call blocks the PHP process. In queue workers, this holds the worker slot for minutes. In web requests, it consumes FPM/Octane worker. Cascading resource exhaustion.

### Real-World Consequences
Stripe API has a 5-second blip. All 20 queue workers hang on the timeout-default (default 300s). Jobs backlog grows to 10,000 in 5 minutes. Service is down for 30 minutes.

### Preferred Alternative
Always set `->timeout(30)->connectTimeout(10)` on every outbound request.

### Refactoring Strategy
1. Audit all Http facade calls for timeout configuration
2. Add `->timeout(30)->connectTimeout(10)` where missing
3. Create an `Http::macro()` with defaults to eliminate repetition
4. Add static analysis rule enforcing timeout on all requests

### Detection Checklist
- [ ] Http calls without `->timeout()` or `->connectTimeout()`
- [ ] Default Guzzle timeout (300s) in effect
- [ ] Workers blocked on API calls for >30s

### Related Rules
Always Set Timeouts (05-rules.md)

### Related Skills
Build Outbound HTTP Requests with the Laravel Http Facade (06-skills.md)

### Related Decision Trees
HTTP Client Method Selection (07-decision-trees.md)

---

## Anti-Pattern 2: Silent Failure — Not Using `->throw()` or Error Handling

### Category
Reliability | Testing

### Description
Calling `Http::get()` without chaining `->throw()`. 4xx/5xx responses are silently treated as successful, returning error bodies as if they were valid data.

### Why It Happens
The code `$response = Http::get(...); $data = $response->json();` works for the happy path and the developer doesn't consider error scenarios.

### Warning Signs
- `Http::get()` without `->throw()` in service code
- Error response bodies parsed as valid data downstream
- Null values propagating from API errors

### Why It Is Harmful
A 500 error response with `{"error": "internal"}` is parsed as JSON and treated as valid data. Null values cascade through the application, causing confusing secondary errors that are hard to trace back to the original HTTP failure.

### Real-World Consequences
Stripe returns 402 for a declined card. The code doesn't call `->throw()`, so `$response->json()` returns `{"error": {"code": "card_declined"}}`. This array passes through validation as valid data. Customer sees "success" but no charge is made.

### Preferred Alternative
Always chain `->throw()` or explicitly check `->successful()` / `->failed()`.

### Refactoring Strategy
1. Find all Http facade calls without `->throw()`
2. Add `->throw()` to all calls where HTTP errors should propagate
3. For branching logic, use `->successful()` or `->failed()` with explicit handling
4. Add static analysis or code review rule to enforce

### Detection Checklist
- [ ] `->throw()` not chained on Http calls
- [ ] No `->successful()` or `->failed()` check
- [ ] Error response bodies reaching business logic

### Related Rules
Always Use `->throw()` (05-rules.md)

### Related Skills
Build Outbound HTTP Requests with the Laravel Http Facade (06-skills.md)

### Related Decision Trees
Error Handling Approach (07-decision-trees.md)

---

## Anti-Pattern 3: Sequential HTTP Calls in Loops Instead of Pools

### Category
Performance | Architecture

### Description
Using `foreach` with sequential `Http::get()` calls instead of `Http::pool()` for independent requests. Wall-clock time multiplies by the number of requests.

### Why It Happens
Sequential loops are the natural PHP pattern. Developers don't realize the Http facade supports concurrent pools.

### Warning Signs
- `foreach ($ids as $id) { Http::get(...); }` pattern
- Total API call time = N × average latency
- Page load times proportional to number of API calls

### Why It Is Harmful
10 API calls at 200ms each = 2 seconds sequential vs 200ms pooled. This is the HTTP equivalent of N+1 queries. User-facing operations are unnecessarily slow.

### Real-World Consequences
Dashboard loading 20 user profiles sequentially takes 4 seconds. User experience is poor. Competitor's site loads in 500ms. Churn increases.

### Preferred Alternative
Use `Http::pool()` for independent concurrent requests.

### Refactoring Strategy
1. Identify loops making independent API calls
2. Replace with `Http::pool()` using named keys
3. Handle individual responses from the pool result
4. Set appropriate concurrency limits

### Detection Checklist
- [ ] Sequential `Http::get()` in foreach loops
- [ ] Total wall-clock time = N × latency
- [ ] No concurrent request patterns

### Related Rules
Always Use Http::pool() for Concurrent Requests (05-rules.md)

### Related Skills
Build Outbound HTTP Requests with the Laravel Http Facade (06-skills.md)

### Related Decision Trees
HTTP Client Method Selection (07-decision-trees.md)

---

## Anti-Pattern 4: Missing `preventStrayRequests()` in Test Suites

### Category
Testing | Reliability

### Description
Using `Http::fake()` without enabling `Http::preventStrayRequests()`. Un-mocked URLs silently make real HTTP calls during tests.

### Why It Happens
Developers call `Http::fake()` and assume it intercepts all requests. They don't know about `preventStrayRequests()`.

### Warning Signs
- `Http::fake()` used without `Http::preventStrayRequests()`
- Tests occasionally fail with real API rate limit errors
- Test suite makes real network calls (visible in network monitoring)

### Why It Is Harmful
Real HTTP calls in tests cause flakiness (network-dependent, rate limit hits), slow test execution (waiting for network), and potential production data modification if test data leaks.

### Real-World Consequences
CI pipeline runs integration tests. A URL pattern change means one endpoint is no longer faked. Tests make real API calls. Stripe sees 1000 test charges from CI. Finance team investigates fraudulent charges.

### Preferred Alternative
Enable `Http::preventStrayRequests()` in every test that uses `Http::fake()`.

### Refactoring Strategy
1. Add `Http::preventStrayRequests()` to `setUp()` in test cases
2. Catch any unmocked URLs and add proper fakes
3. Consider adding to base test class for all integration tests
4. Verify no real HTTP calls in test suite

### Detection Checklist
- [ ] `Http::fake()` without `Http::preventStrayRequests()`
- [ ] Real HTTP calls in test output
- [ ] Test suite depends on network availability

### Related Rules
Enable Http::preventStrayRequests() in Tests (05-rules.md)

### Related Skills
Build Outbound HTTP Requests with the Laravel Http Facade (06-skills.md)

### Related Decision Trees
Testing Configuration Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Repeated Configuration Without Using `Http::macro()`

### Category
Code Organization | Maintainability

### Description
Repeating the same base URL, headers, auth, and timeout configuration for every HTTP call to the same service instead of defining a macro.

### Why It Happens
Example code from documentation shows inline configuration. Copy-paste is faster than learning macro registration.

### Warning Signs
- `->baseUrl('https://api.stripe.com/v1')->withToken(...)->timeout(30)` repeated across files
- A config change requires editing multiple call sites
- Some calls have slightly different (incorrect) configuration

### Why It Is Harmful
Configuration is scattered across the codebase. A base URL change requires finding and updating every call site. Some sites are inevitably missed, causing hard-to-debug errors.

### Real-World Consequences
Stripe API version changes. Developer must update base URL in 22 call sites. Two are missed. Those endpoints silently use the old version for 3 months until a feature breaks.

### Preferred Alternative
Define `Http::macro('stripe', fn () => ...)` with pre-configured defaults.

### Refactoring Strategy
1. Identify repeated configuration patterns per service
2. Register `Http::macro()` for each service in a service provider
3. Replace inline configuration with macro calls
4. Remove duplicated configuration

### Detection Checklist
- [ ] Same base URL/headers repeated across files
- [ ] No macro registered for the service
- [ ] Configuration changes require multiple file edits

### Related Rules
Use Http::macro() for Service-Specific Defaults (05-rules.md)

### Related Skills
Build Outbound HTTP Requests with the Laravel Http Facade (06-skills.md)

### Related Decision Trees
HTTP Client Method Selection (07-decision-trees.md)
