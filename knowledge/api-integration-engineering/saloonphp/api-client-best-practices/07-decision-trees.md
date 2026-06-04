# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** api-client-best-practices
**Generated:** 2026-06-03

---

# Decision Inventory

1. Client Architecture Pattern
2. Authentication Strategy Selection
3. Testing Approach

---

# Architecture-Level Decision Trees

---

## Client Architecture Pattern

---

## Decision Context

Choosing the right architectural pattern for API client implementation.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is the integration simple (1-2 endpoints, no auth)?
↓
YES → Direct Http facade usage acceptable (keep it simple)
NO → Does the project use SaloonPHP?
  ↓
  YES → Use Saloon Connector + Request + DTO pattern
  NO → Use Service Class pattern with injected Http facade
  ↓
  Does the service need provider swapping (Mailgun → Postmark)?
  ↓
  YES → Add interface + strategy pattern for provider abstraction
  NO → Single implementation; interface enough for testability
  ↓
  Will the service exceed 15-20 methods?
  ↓
  YES → Split into multiple service classes by resource domain
  NO → Single service class is sufficient

---

## Rationale

Architecture should match complexity: direct Http for simple, service class for moderate, Saloon for complex. Provider swapping requires strategy pattern. Method count threshold prevents god classes.

---

## Recommended Default

**Default:** Service class with injected Http facade + interface
**Reason:** Good balance of structure and simplicity for most Laravel integrations

---

## Risks Of Wrong Choice

Over-engineering simple integrations adds unnecessary cost. Under-engineering complex ones creates unmaintainable code.

---

## Related Rules

Never call APIs directly in controllers, Split services at 15-20 methods

---

## Related Skills

Design API Client Architecture

---

## Authentication Strategy Selection

---

## Decision Context

Choosing the authentication method for the API client.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the API support OAuth2 Client Credentials?
↓
YES → Use OAuth2 with token caching + proactive refresh
  ↓
  Is this a machine-to-machine integration?
  ↓
  YES → Client Credentials grant is ideal
  NO → Evaluate Authorization Code grant
NO → Does the API use static API keys?
  ↓
  YES → API key in Authorization header + key management
  ↓
  Need key rotation?
  ↓
  YES → Implement multi-key support with key ID prefix
  NO → Single key stored in config/vault
NO → Does the API use custom HMAC signing?
  ↓
  YES → Implement signing middleware in handler stack
  NO → Evaluate basic auth or custom header schemes

---

## Rationale

OAuth2 Client Credentials is the standard for M2M auth. Static API keys are simpler but harder to rotate securely. HMAC is for APIs that require request-level signing.

---

## Recommended Default

**Default:** OAuth2 Client Credentials with cached tokens
**Reason:** Industry standard, secure, supports rotation

---

## Risks Of Wrong Choice

Hardcoding keys in source code is a security breach. No token caching causes repeated auth calls. No rotation plan leads to key exposure accumulation.

---

## Related Rules

Store credentials in config/vault, Use OAuth2 for M2M

---

## Related Skills

Design API Client Architecture

---

## Testing Approach

---

## Decision Context

Determining the testing strategy for API client code.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Are you testing the service class directly?
↓
YES → Use Http::fake() with URL pattern matching
  ↓
  Need to test multiple sequential calls?
  ↓
  YES → Use Http::sequence() for ordered response faking
  NO → Single Http::response() is sufficient
NO → Are you testing Saloon connectors?
  ↓
  YES → Use MockClient with fixture recording
  ↓
  Need to test error handling?
  ↓
  YES → Create fake responses for timeout, 500, 429, malformed JSON
  NO → Happy-path faking only
  ↓
  Enable preventStrayRequests()?
  ↓
  YES → Catches un-mocked real HTTP calls
  NO → Real calls may leak into test suite

---

## Rationale

Fake responses at the HTTP layer provide fast, deterministic tests. Error scenario testing ensures resilience patterns work. preventStrayRequests is a safety net against accidental real calls.

---

## Recommended Default

**Default:** Http::fake() with URL patterns + error scenario coverage + preventStrayRequests
**Reason:** Comprehensive, safe, and fast test suite

---

## Risks Of Wrong Choice

No faking makes tests slow and flaky. No error scenario coverage means production failures go undetected in tests.

---

## Related Rules

Tests use Http::fake() without real HTTP calls

---

## Related Skills

Design API Client Architecture
