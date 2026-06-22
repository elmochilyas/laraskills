# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Cashier + BillingGateway Wrapper Pattern
**Generated:** 2026-06-22

---

# Decision Inventory

* Decision 1: Gateway scope — billing-only vs billing + entitlements
* Decision 2: Testing strategy — FakeBillingGateway vs Stripe API mock
* Decision 3: Exception handling — wrap all vs wrap selective Stripe errors
* Decision 4: DTO design — immutable readonly vs mutable with setters

---

# Architecture-Level Decision Trees

---

## Decision: Gateway Scope — Billing-Only vs Billing + Entitlements

---

### Decision Context

Determine whether the BillingGateway interface should handle only payment operations (subscriptions, invoices, checkout) or also include entitlement/feature access queries.

---

### Decision Criteria

* single responsibility: billing-only keeps the gateway focused on payment provider operations
* separation of concerns: entitlements belong to the application domain, not the payment provider
* testing considerations: mixing billing and entitlements makes the fake more complex and conflates concerns
* reuse considerations: billing operations are reusable across applications; entitlements are product-specific

---

### Decision Tree

Does the application need to query the payment provider for feature access decisions?
↓
YES → Can those decisions be computed from locally cached subscription state instead?
    YES → Keep gateway billing-only; compute entitlements from local cache
    NO → Is the payment provider the only source of truth for these decisions?
        YES → Consider a separate `EntitlementGateway` interface (not all payment providers support this)
        NO → Redesign: cache the provider's state locally and compute entitlements from cache

NO → Is there a need to group related billing operations (e.g., "subscribeAndSetDefaultPayment")?
    YES → Add composite methods to the gateway (still billing operations, just combined)
    NO → Keep gateway as single-purpose billing operations

Would adding entitlement queries to the gateway make the FakeBillingGateway significantly harder to implement?
YES → Keep them separate (the fake would need to model both billing state and entitlement rules)
NO → Consider if the simplicity of a single interface outweighs the separation of concerns

---

### Rationale

Billing and entitlements are different concerns. Billing is about the financial relationship with the payment provider. Entitlements are about what the user can do in the application. Merging them couples the application's authorization layer to a specific payment provider's API shape. Keeping them separate preserves the independence of the entitlement model and simplifies testing.

---

### Recommended Default

**Default:** Billing-only gateway. Entitlements computed from locally cached subscription state via a separate EntitlementService.

**Reason:** Single responsibility principle. The gateway talks to Stripe. The entitlement service computes access. These are different classes, different tests, different failure modes. Most importantly, Stripe outages don't block entitlement checks when they're separate.

---

### Risks Of Wrong Choice

Billing + entitlements combined: Stripe outages block feature access. Changing payment providers requires rewriting entitlement logic. FakeBillingGateway becomes a monster class modeling both billing state and feature access rules. Testing becomes harder because billing and access checks are entangled.

---

### Related Rules

- Rule 1: All Billing Operations Must Go Through the BillingGateway Interface
- Rule 1 (PFE): Separate Billing State From Entitlement Decisions

---

### Related Skills

- Implement Cashier + BillingGateway Wrapper Pattern
- Implement Plan, Feature & Entitlement Model

---

## Decision: Testing Strategy — FakeBillingGateway vs Stripe API Mock

---

### Decision Context

Choose whether billing feature tests should use a stateful fake implementation of BillingGateway or mock individual Stripe/Cashier method calls.

---

### Decision Criteria

* test reliability: fakes maintain consistent state across test steps; mocks assert individual invocations
* test flow: fakes support multi-step flows (create → get → cancel → verify); mocks require per-call expectation setup
* maintenance: fakes need updating when the interface changes; mocks need updating when internal call patterns change
* realism: fakes simulate behavior with fake data; mocks verify interaction patterns only

---

### Decision Tree

Do your billing tests involve multi-step flows (create subscription, then check status, then cancel, then verify canceled)?
↓
YES → Stateful FakeBillingGateway (maintains internal state across test steps)
    ↓
    Do you need to test error recovery paths (payment failure, retry, success)?
    YES → FakeBillingGateway with configurable failure modes (`$shouldFail`, `$failOnNext`)
    NO → FakeBillingGateway with deterministic success behavior
    ↓
    Is the FakeBillingGateway easy to maintain as the interface grows?
    YES → Continue with the fake pattern
    NO → Consider splitting the interface into smaller, more focused contracts

NO → Are the billing tests simple, single-step assertions?
    YES → Are there already existing Stripe mock helpers in the project?
        YES → Mocking may be acceptable for simple tests
        NO → Use FakeBillingGateway anyway (simpler to set up than mocking)
    NO → Don't optimize prematurely — start with the fake

Are you testing the gateway implementation itself (StripeCashierGateway)?
YES → Unit tests with Stripe SDK mocks (testing gateway internals)
NO → Use FakeBillingGateway for everything that consumes the gateway

---

### Rationale

A stateful FakeBillingGateway is almost always the better choice for feature tests. It supports realistic multi-step billing flows, requires no per-test expectation setup, and behaves like the real thing (minus the HTTP calls). Mocking individual method calls is fragile — changing the order of operations breaks tests even when behavior is correct.

---

### Recommended Default

**Default:** FakeBillingGateway for all feature tests. Stripe SDK mocks only for unit tests of StripeCashierGateway itself.

**Reason:** The fake provides the best developer experience for testing billing flows. Tests read like documentation. Multi-step flows work naturally. Error scenarios are easy to set up with a `$shouldFail` flag.

---

### Risks Of Wrong Choice

Mocking everything: tests break on refactoring because method call order changes. Multi-step billing flows are untestable because mocks don't maintain state. Error path testing requires complex mock setup. Fake for everything: the fake may diverge from real behavior over time if not maintained; use contract tests to verify the fake and real implementation produce equivalent results for the same inputs.

---

### Related Rules

- Rule 3: Implement a FakeBillingGateway for Testing
- Rule 1: All Billing Operations Must Go Through the BillingGateway Interface

---

### Related Skills

- Implement Cashier + BillingGateway Wrapper Pattern

---

## Decision: Exception Handling — Wrap All vs Wrap Selective Stripe Errors

---

### Decision Context

Determine whether the gateway catches every Stripe exception and wraps it in an application exception, or only wraps specific Stripe error types that callers need to handle differently.

---

### Decision Criteria

* coupling: catching all exceptions completely isolates callers from the Stripe SDK
* granularity: selective wrapping allows callers to handle different error types differently (e.g., card declined vs API error)
* maintenance: all-exception wrapping requires maintaining a mapping of Stripe exceptions to application exceptions
* user experience: application exceptions can include user-friendly messages; raw Stripe exceptions are technical

---

### Decision Tree

Do callers need to handle different billing errors differently (card declined with retry, API error with "try later", fraud flag with account review)?
↓
YES → Selective wrapping with typed application exceptions
    ↓
    Which Stripe exceptions need distinct handling?
    CardException → CardDeclinedException (user-facing message, decline code)
    RateLimitException → ProviderBusyException (retry later suggestion)
    AuthenticationException → BillingConfigurationException (ops alert)
    ApiErrorException (other) → BillingProviderException (generic, "try again")
    InvalidRequestException → BillingConfigurationException (code bug, log and alert)

NO → Is there a compliance requirement for user-facing error messages to not reference Stripe?
    YES → Wrap all exceptions in generic `BillingException` with a user-friendly message
    NO → Selective wrapping for the most common error paths; generic wrapping for the rest

Is the team planning to potentially switch payment providers in the next 12 months?
YES → Wrap all exceptions (complete vendor isolation)
NO → Selective wrapping is acceptable

---

### Rationale

Selective wrapping provides the best balance. Card declines need distinct handling (ask for a different payment method). API errors need a different message (try again later). Rate limits need backoff. Not all Stripe exceptions require distinct handling — `ApiErrorException` for a temporary network issue and `ApiErrorException` for a misconfigured API key should both result in "we're having trouble, try again" but the latter needs an ops alert.

---

### Recommended Default

**Default:** Selective wrapping with typed application exceptions: `CardDeclinedException`, `BillingProviderException`, `PaymentActionRequiredException`. Generic `BillingException` as catch-all for unexpected Stripe errors.

**Reason:** Provides appropriate error handling granularity for callers while maintaining vendor isolation. Card-specific errors get user-friendly messages. All Stripe types are hidden behind application exceptions.

---

### Risks Of Wrong Choice

Wrapping everything into a single `BillingException`: callers can't distinguish "card declined — ask for new card" from "billing provider down — tell user to try later." User experience suffers. Not wrapping at all: controllers import Stripe exception classes; changing payment providers requires updating exception handling everywhere.

---

### Related Rules

- Rule 4: Wrap Stripe Exceptions in Application Exceptions Inside the Gateway
- Rule 2: Return Application-Owned DTOs, Never Stripe/Cashier Objects

---

### Related Skills

- Implement Cashier + BillingGateway Wrapper Pattern

---

## Decision: DTO Design — Immutable Readonly vs Mutable with Setters

---

### Decision Context

Determine whether billing data transfer objects (SubscriptionResult, SubscriptionData, InvoiceData) should be immutable readonly classes or mutable with property setters.

---

### Decision Criteria

* data integrity: immutable DTOs prevent accidental mutation of billing data flowing through the application
* testability: readonly classes are trivially predictable — no state changes after construction
* serialization: immutable DTOs work naturally with Laravel's JSON serialization and API resources
* flexibility: mutable DTOs allow gradual population in multi-step processes

---

### Decision Tree

Can each DTO be fully constructed in a single step (all data available at construction time)?
↓
YES → Readonly class (PHP 8.2+ readonly class or readonly public properties)
    ↓
    Will the DTO be passed through multiple layers (controller → action → service → response)?
    YES → Readonly (prevents any layer from mutating billing data)
    NO → Readonly still preferred (simpler, more predictable)

NO → Does the DTO need gradual population (e.g., fetching related data in steps)?
    YES → Consider a Builder pattern for the DTO (build then freeze) or split into multiple DTOs
    NO → Default to readonly (most DTOs can be fully constructed with all data available)

Are there existing coding standards in the project (e.g., all DTOs are readonly classes)?
YES → Follow the standard
NO → Establish readonly as the default

---

### Rationale

Immutable DTOs are the correct default for billing data. Billing information (subscription status, invoice amounts, payment dates) represents financial facts that must not be modified in transit. A readonly class makes mutation impossible at the language level. The `readonly` keyword or readonly properties communicate intent clearly to other developers.

---

### Recommended Default

**Default:** Readonly classes with fully-populated constructors. All properties typed and readonly.

**Reason:** Prevents bugs from accidental mutation of billing data. Communicates that billing DTOs are value objects representing facts, not work-in-progress data containers. PHP 8.2+ readonly keyword provides language-level enforcement.

---

### Risks Of Wrong Choice

Mutable DTOs: a service accidentally modifies an invoice amount, or a controller changes a subscription status before forwarding to the view. These bugs are hard to detect because they occur silently. Mutable DTOs passed through multiple layers create "spooky action at a distance" — changes in one layer affect another layer unexpectedly.
