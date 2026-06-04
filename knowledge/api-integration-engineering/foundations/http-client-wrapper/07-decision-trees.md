# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** http-client-wrapper
**Generated:** 2026-06-03

---

# Decision Inventory

1. Wrapper Implementation Approach
2. Error Handling Strategy
3. Testing Strategy

---

# Architecture-Level Decision Trees

---

## Wrapper Implementation Approach

---

## Decision Context

Choosing between service class, Saloon connector, or direct Http facade for API integration.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Are there multiple endpoints for the same external service?
↓
YES → Create a wrapper (service class or Saloon connector)
  ↓
  Is the team already using SaloonPHP?
  ↓
  YES → Use Saloon connector with Request classes
  NO → Use service class wrapping Http facade
NO → Is this a single one-off HTTP call?
  ↓
  YES → Use Http facade directly in controller (acceptable for one call)
  NO → Is it a prototype/exploratory code?
    ↓
    YES → Http facade directly; refactor later
    NO → Create wrapper; future calls will benefit

---

## Rationale

Wrappers centralize configuration, error handling, and logging. Saloon provides more structure for complex integrations; service classes are lighter for simpler needs.

---

## Recommended Default

**Default:** Service class wrapping injected Http facade
**Reason:** Simple, testable, no additional package dependency

---

## Risks Of Wrong Choice

Direct Http calls in controllers create untestable, duplicated code. Over-engineering with Saloon for a single endpoint adds unnecessary abstraction.

---

## Related Rules

Inject Http facade via constructor, Configure timeouts at wrapper level

---

## Related Skills

Build HTTP Client Wrappers

---

## Error Handling Strategy

---

## Decision Context

Mapping HTTP errors to domain exceptions in the wrapper layer.

---

## Decision Criteria

* security
* maintainability
* architectural

---

## Decision Tree

Should HTTP errors be exposed to callers?
↓
YES → Map to specific domain exceptions (PaymentFailedException)
  ↓
  Distinguish between client (4xx) and server (5xx) errors?
  ↓
  YES → Different exception classes or types per category
  NO → Single IntegrationException for all errors
NO → Handle errors within wrapper; return fallback/default
  ↓
  Is the operation critical or non-critical?
  ↓
  CRITICAL → Throw domain exception; caller must handle
  NON-CRITICAL → Log error, return fallback value

---

## Rationale

Domain exceptions decouple callers from HTTP semantics. A controller should catch `PaymentFailedException`, not `GuzzleException`. This improves maintainability and testability.

---

## Recommended Default

**Default:** Map 4xx to typed domain exceptions; 5xx to retryable exceptions
**Reason:** Clear error semantics that callers can handle appropriately

---

## Risks Of Wrong Choice

Catching generic Exception hides root causes. Exposing Guzzle exceptions couples callers to HTTP transport.

---

## Related Rules

Map HTTP exceptions to domain exceptions

---

## Related Skills

Build HTTP Client Wrappers

---

## Testing Strategy

---

## Decision Context

Testing API integration code without real HTTP calls.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Is the wrapper using Http facade directly?
↓
YES → Use Http::fake() in tests with URL pattern matching
  ↓
  Test sequential retry behavior?
  ↓
  YES → Use Http::sequence() for progressive fake responses
  NO → Single Http::response() is sufficient
NO → Is the wrapper using Saloon?
  ↓
  YES → Use Saloon MockClient with fixture recording
  ↓
  Need to test error scenarios?
  ↓
  YES → Create fake responses for timeout, 500, 429, malformed
  NO → Happy-path fakes only
  ↓
  Enable Http::preventStrayRequests()?
  ↓
  YES → Catches un-mocked requests in tests
  NO → Real HTTP calls may leak into test suite

---

## Rationale

Http::fake() and MockClient intercept at the middleware/connector level, ensuring tests are fast, deterministic, and independent of network availability.

---

## Recommended Default

**Default:** Http::fake() with preventStrayRequests() in all integration tests
**Reason:** Catches un-mocked requests and ensures test isolation

---

## Risks Of Wrong Choice

No faking means slow, flaky tests dependent on network. No preventStrayRequests allows real HTTP calls to leak into tests.

---

## Related Rules

Tests use Http::fake() without real HTTP calls

---

## Related Skills

Build HTTP Client Wrappers
