# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Custom Exception Classes
**Generated:** 2026-06-03

---

# Decision Inventory

* Custom Exception vs Plain ValidationException for Business Rules
* Single Exception Class vs Exception Hierarchy per Domain
* Custom Exception with Report Method vs Separate Listener

---

# Architecture-Level Decision Trees

---

## Decision 1: Custom Exception vs Plain ValidationException for Business Rules

---

## Decision Context

Whether to create a dedicated custom exception class or reuse Laravel's `ValidationException` for business rule violations (e.g., "User already has an active subscription").

---

## Decision Criteria

* Whether the error represents a validation concern or a domain/business concern
* Whether the error needs different handling (HTTP status, logging, rendering) than validation errors
* Whether multiple callers need to catch and handle this error type differently

---

## Decision Tree

Is the error a user input validation failure (field-level, preventable)?
↓
YES → Use `ValidationException` — the framework handles it automatically
NO → Is the error a business rule violation (entity state, domain invariant)?
    ↓
    YES → Create a custom exception class — distinct type enables distinct handling
    NO → Is the error an infrastructure failure (network, filesystem, external API)?
        ↓
        YES → Create a custom exception for retry/logging differentiation
        NO → Does any caller need to catch-this-type and respond differently?
            ↓
            YES → Custom exception — type-based catching is the cleanest dispatch
            NO → Use generic `RuntimeException` or `\Exception`

---

## Rationale

`ValidationException` is designed for user-input validation — field-level rules that prevent bad data from entering the system. Business rules operate on already-validated data and represent domain constraints. Mixing domain errors into validation errors conflates two concerns and prevents callers from distinguishing between them.

---

## Recommended Default

**Default:** Create custom exception classes for all domain business rule violations.
**Reason:** Distinct exception types are the primary mechanism for differentiated handling (HTTP status, logging channel, rendering strategy). Reusing `ValidationException` for domain errors conflates input validation with business logic.

---

## Risks Of Wrong Choice

* Custom exception for simple field validation: Ceremony without benefit — the framework already handles `ValidationException` correctly
* `ValidationException` for business rules: Callers can't distinguish domain errors from input errors; wrong HTTP status (422 vs 400/409)
* Generic `Exception` for all errors: `catch (\Exception $e)` is too broad — swallows unrelated errors

---

## Related Rules

* Custom Exception for Business Rule Violations
* Exception Naming Convention

---

## Related Skills

* Create Custom Exception Class
* Business Rule Exception Handling

---

---

## Decision 2: Single Exception Class vs Exception Hierarchy per Domain

---

## Decision Context

Whether to create one exception per error condition or build a hierarchy with a base exception per domain (e.g., `PaymentException` base with `PaymentFailedException`, `PaymentDeclinedException`, `PaymentTimeoutException` subclasses).

---

## Decision Criteria

* Number of distinct error conditions in the domain (1-3 vs 4+)
* Whether callers need to catch all domain errors vs specific errors
* Whether the domain is expected to grow with new error conditions
* Whether different error conditions need different HTTP status codes

---

## Decision Tree

How many distinct error conditions exist in this domain?
↓
1-3 conditions?
YES → Does any caller need to catch only specific errors?
    YES → Create individual concrete exception classes — flat structure with no base
    NO → Single exception class with a `$reason` property — `throw new PaymentException('insufficient_funds')`
NO → 4+ conditions or expected growth?
    YES → Do different errors need different HTTP status codes or handling?
        YES → Create hierarchy with abstract base + concrete subclasses
        NO → Create hierarchy with abstract base + concrete subclasses — interchangeable handling with room to differentiate later
NO → Does the domain span multiple subdomains (e.g., Billing includes Payments + Invoices)?
    YES → Two-level hierarchy: subdomain base → concrete exception
    NO → Single-level hierarchy: domain base → concrete exception

---

## Rationale

A hierarchy lets callers catch broadly (`PaymentException`) or specifically (`PaymentDeclinedException`). A single class with a reason code is simpler but forces callers to inspect the reason string, which is fragile. Hierarchies add ceremony (1 file per exception) that pays off at 4+ conditions.

---

## Recommended Default

**Default:** Single exception class with reason property for domains with 1-3 error conditions. Full hierarchy (abstract base + concrete subclasses) for domains with 4+ conditions or expected growth.
**Reason:** The threshold of 3 is where catching broadly becomes insufficient — at 4+ error types, callers need to differentiate handling.

---

## Risks Of Wrong Choice

* Single class for 4+ conditions: Callers must string-match on reason codes, fragile and untyped
* Hierarchy for 2 conditions: File proliferation — 3 files for 2 error types is wasteful
* No base class: Callers can't catch all domain errors without enumerating individual exception types

---

## Related Rules

* Exception Hierarchy Design
* Exception Naming Convention

---

## Related Skills

* Create Custom Exception Class
* Business Rule Exception Handling

---

---

## Decision 3: Custom Exception with Report Method vs Separate Listener

---

## Decision Context

Whether to put custom error reporting logic (log channel selection, extra context, notification dispatch) directly in the exception class via `report()` or in a dedicated listener registered in the exception handler.

---

## Decision Criteria

* Whether the reporting logic is tightly coupled to this exception type
* Whether the same reporting logic applies to multiple exception types
* Whether the reporting logic has dependencies (services, repositories) that break the exception's lightweight nature
* Whether the exception is thrown from multiple entry points (HTTP, queue, CLI)

---

## Decision Tree

Does the reporting logic need dependencies (database queries, external API calls, mailer)?
↓
YES → Use a dedicated listener `$this->reportable(...)` or `report()` helper — exceptions should be throwable without resolving services
NO → Is the same reporting logic shared across 2+ exception types?
    YES → Use a shared `reportable()` callback or listener class
    NO → Is the reporting simple (log channel, log level, extra context array)?
        YES → Use exception's `report()` method — self-contained, testable
        NO → Is the reporting complex (multiple actions, conditionals, retries)?
            ↓
            YES → Use dedicated listener class — separates concern from the exception
            NO → Use exception's `report()` method

---

## Rationale

Exceptions must be lightweight — they're created and thrown at any layer. Embedding dependency resolution in an exception defeats that. `report()` on the exception is best for self-contained logic (log level, channel, context). Complex or dependency-heavy reporting belongs in listeners registered via `$this->reportable()`.

---

## Recommended Default

**Default:** Use exception `report()` method for self-contained logging configuration. Use separate `reportable()` listeners for anything requiring injected services.
**Reason:** Preserves exception portability (thrown from any context) while keeping the exception class responsible for its own reporting concerns.

---

## Risks Of Wrong Choice

* Report method with dependencies: Exception breaks when thrown from queue job or CLI command where the dependency isn't resolved
* Separate listener for simple log level change: Indirection without value — `report()` method is clearer and simpler
* No report customization: All exceptions go to the default log channel at ERROR level — loss of signal

---

## Related Rules

* Exception Report Method for Logging
* Centralized Exception Reporting

---

## Related Skills

* Custom Exception with Report
* Exception Handler Configuration
