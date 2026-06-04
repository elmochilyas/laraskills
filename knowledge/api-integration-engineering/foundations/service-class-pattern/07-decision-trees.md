# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** service-class-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Service Class vs Saloon Decision
2. Interface Contract Design
3. Error Boundary Strategy

---

# Architecture-Level Decision Trees

---

## Service Class vs Saloon Decision

---

## Decision Context

Choosing between a plain service class and SaloonPHP for API integration.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are there 3+ external API integrations in the project?
↓
YES → Consider SaloonPHP (consistent pattern across all)
  ↓
  Does the team have experience with Saloon?
  ↓
  YES → Use Saloon connectors and request classes
  NO → Start with service classes; migrate to Saloon if pattern proves valuable
NO → Is there a single complex integration with 10+ endpoints?
  ↓
  YES → Consider Saloon for structured request/response handling
  NO → Plain service class wrapping Http facade is sufficient
  ↓
  Is testability a primary concern?
  ↓
  YES → Service class with injected Http facade (easily mockable)
  NO → Direct facade calls acceptable for simple cases

---

## Rationale

Service classes are lighter and require no additional package. Saloon provides richer structure for complex integrations. The choice depends on integration complexity and team familiarity.

---

## Recommended Default

**Default:** Service class with injected Http facade for 1-2 integrations
**Reason:** Simple, testable, no extra dependency, easy to refactor later

---

## Risks Of Wrong Choice

Saloon for one simple endpoint adds unnecessary abstraction. No pattern for 10+ integrations creates inconsistent, untestable code.

---

## Related Rules

Define interface for each service, Inject HTTP client via constructor

---

## Related Skills

Build Service Classes for API Integration

---

## Interface Contract Design

---

## Decision Context

Designing the interface between service class and its consumers.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the service interface have 15+ methods?
↓
YES → Split into multiple service classes by domain
  ↓
  Do methods logically group by resource?
  ↓
  YES ->UsersService, PaymentsService (one per resource)
  NO ->Split by functional area
NO → Single service interface is appropriate
  ↓
  Return DTOs or collections?
  ↓
  YES → Typed return values for autocompletion and contract enforcement
  NO → Do not return raw Response objects
    ↓
    Return arrays only if DTO overhead is not justified
    ↓
  Register interface-to-implementation binding in ServiceProvider?
  ↓
  YES → Enables DI, testing, and future provider swapping
  NO → Direct instantiation; harder to mock in tests

---

## Rationale

Interfaces decouple consumers from implementations, enabling mocking in tests and future provider swapping. Split large interfaces to maintain Single Responsibility.

---

## Recommended Default

**Default:** Interface per service with DTO returns, registered in ServiceProvider
**Reason:** Loosely coupled, testable, contracts are explicit

---

## Risks Of Wrong Choice

No interface makes mocking difficult (tight coupling). God interfaces violate SRP and are hard to maintain.

---

## Related Rules

Define interface for each service, Register in ServiceProvider

---

## Related Skills

Build Service Classes for API Integration

---

## Error Boundary Strategy

---

## Decision Context

Determining where and how HTTP errors are handled in the service layer.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Should consumers know about HTTP-level errors?
↓
YES → Map HTTP errors to typed domain exceptions
  ↓
  Distinguish between transient and permanent errors?
  ↓
  YES → ThrottleException (retryable), PaymentException (not retryable)
  NO → Single IntegrationException for all errors
NO → Handle errors internally; return fallback or Optional type
  ↓
  Is the operation critical?
  ↓
  YES → Log error + throw typed exception; caller must handle
  NO → Log error + return null/default; non-critical operations degrade gracefully
  ↓
  Log all outbound calls with duration?
  ↓
  YES → Observability into all integration calls
  NO → Missing debugging data for incidents

---

## Rationale

Domain exceptions maintain clean separation between HTTP transport and business logic. Callers catch `PaymentFailedException` without knowing about Guzzle, HTTP status codes, or transport details.

---

## Recommended Default

**Default:** Map to typed domain exceptions + log all calls with duration
**Reason:** Clean error semantics with full observability

---

## Risks Of Wrong Choice

Catching generic Exception hides root causes. Exposing Guzzle exceptions couples callers to HTTP transport. No logging blinds debugging.

---

## Related Rules

Map HTTP errors to domain exceptions, Log every outbound call

---

## Related Skills

Build Service Classes for API Integration
