# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** laravel-http-facade
**Generated:** 2026-06-03

---

# Decision Inventory

1. HTTP Client Method Selection
2. Error Handling Approach
3. Testing Configuration Strategy

---

# Architecture-Level Decision Trees

---

## HTTP Client Method Selection

---

## Decision Context

Choosing between sequential requests, pool requests, and macros for HTTP calls.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Are there multiple independent requests to the same host?
↓
YES → Use Http::pool() with named keys for concurrent execution
  ↓
  Need to correlate responses with requests?
  ↓
  YES → Use named keys: `$responses['users']`, `$responses['posts']`
  NO → Sequential foreach loop is simpler
NO → Is this a single request?
  ↓
  YES → Use Http::get()/post() directly with method chaining
  NO → Does this service have repeatable configuration?
    ↓
    YES → Define an Http::macro() for pre-configured defaults
    NO → Request-specific configuration is fine

---

## Rationale

Pool requests maximize throughput for independent requests. Macros centralize repeated configuration (base URL, headers, auth). Direct facade calls are cleanest for one-off requests.

---

## Recommended Default

**Default:** Direct Http facade calls with method chaining for single requests
**Reason:** Readable, fluent, no unnecessary abstraction

---

## Risks Of Wrong Choice

Sequential loops for independent requests waste wall-clock time. Pool for single requests adds unnecessary complexity.

---

## Related Rules

Use Http::pool() for fan-out patterns, Define macros for service defaults

---

## Related Skills

Use Laravel Http Facade Effectively

---

## Error Handling Approach

---

## Decision Context

Deciding how to handle HTTP errors from the facade.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Should HTTP errors throw exceptions?
↓
YES → Use ->throw() to convert 4xx/5xx to exceptions
  ↓
  Need different handling per status code?
  ↓
  YES → Catch specific Guzzle exceptions (ClientException, ServerException)
  NO ->throw() with generic catch is sufficient
NO → Check status manually with ->successful() or ->failed()
  ↓
  Need response body on error?
  ↓
  YES ->body() after checking status
  NO ->ok() boolean check is enough

---

## Rationale

throw() converts HTTP errors to exceptions for clean error flow. Manual checking gives more control but requires explicit handling at each call site.

---

## Recommended Default

**Default:** Always use ->throw() in service classes
**Reason:** Consistent exception-based error handling; clean catch blocks

---

## Risks Of Wrong Choice

Missing ->throw() means silent failures (4xx/5xx pass through as successful responses). Catching too broadly hides real errors.

---

## Related Rules

Always use ->throw() or handle HTTP errors explicitly

---

## Related Skills

Use Laravel Http Facade Effectively

---

## Testing Configuration Strategy

---

## Decision Context

Configuring Http::fake() for integration test coverage.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Are you testing specific URL patterns?
↓
YES ->Http::fake(['stripe.com/*' => Http::response(...)])
  ↓
  Need ordered responses for retry testing?
  ↓
  YES ->Http::sequence() with multiple responses
  NO ->Http::response() with single response body
NO ->Http::fake() with wildcard catch-all
  ↓
  Enable preventStrayRequests()?
  ↓
  YES ->Real HTTP calls throw exception; safe CI
  NO ->Risk of real calls in test suite

---

## Rationale

URL-pattern faking allows precise control over which endpoints return which responses. Sequence faking enables retry and state-transition testing. preventStrayRequests ensures no real HTTP calls leak into tests.

---

## Recommended Default

**Default:** URL-pattern faking with preventStrayRequests()
**Reason:** Precise control with safety net against real calls

---

## Risks Of Wrong Choice

No preventStrayRequests allows real HTTP calls to leak, causing flaky tests. Overly broad faking patterns may mask broken integration code.

---

## Related Rules

Use Http::fake() in tests, Enable preventStrayRequests()

---

## Related Skills

Use Laravel Http Facade Effectively
