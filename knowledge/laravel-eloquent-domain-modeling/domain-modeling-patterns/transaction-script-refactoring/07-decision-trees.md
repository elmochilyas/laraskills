# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Transaction Script Refactoring
**Generated:** 2026-06-03

---

# Decision Inventory

* Refactoring target (model vs service vs action)
* Side effect extraction strategy
* Controller role after refactoring

---

# Architecture-Level Decision Trees

---

## Refactoring Target Selection

---

## Decision Context

Choosing where to place business logic extracted from a fat controller — model method, domain service, or action class.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the extracted logic operate on a single model's own state?
↓
YES → Model domain method — keep behavior with data
NO → Does the logic span multiple unrelated models?
    YES → Domain service — cross-model logic
    NO → Does the logic need infrastructure dependencies (mailer, HTTP client)?
        YES → Action class or queued job
        NO → Model method or domain service

---

## Rationale

The extraction target should match the nature of the logic. Single-model behavior belongs on the model. Cross-model logic goes in a domain service. Infrastructure-dependent logic goes in the application layer (action class).

---

## Recommended Default

**Default:** Model domain method
**Reason:** Most business logic extracted from controllers operates on a single model's state.

---

## Risks Of Wrong Choice

Putting cross-model logic on a model creates inappropriate coupling. Putting infrastructure-dependent logic in a domain service makes it untestable.

---

## Related Rules

* Extract business logic from controllers to domain methods
* Controllers sequence, models execute

---

## Related Skills

* Refactor a Fat Controller into Domain Methods

---

## Side Effect Extraction Strategy

---

## Decision Context

Determining how to handle side effects (email, logging, API calls) during refactoring.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the side effect directly related to the business operation (must happen inline)?
↓
YES → Keep in the domain method or use a synchronous domain event listener
NO → Can the side effect happen after the response?
    YES → Extract to a queued domain event listener
    NO → Is the side effect infrastructure (cache clear, search index)?
        YES → Model event listener (infrastructure concern)
        NO → Domain event listener

---

## Rationale

Side effects should be decoupled from the primary business operation. Domain events provide the cleanest decoupling while keeping the business operation testable without mocking mailers or HTTP clients.

---

## Recommended Default

**Default:** Extract side effects to domain event listeners
**Reason:** Decouples, enables queuing, and makes the domain method testable.

---

## Risks Of Wrong Choice

Keeping side effects inline in the domain method makes testing require mocking infrastructure. Moving side effects to model events couples them to every save, not just the meaningful operation.

---

## Related Rules

* Move side effects to domain events

---

## Related Skills

* Refactor a Fat Controller into Domain Methods

---

## Controller Role After Refactoring

---

## Decision Context

Determining what the controller should do after business logic is extracted.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the controller only sequence calls to domain methods and return responses?
↓
YES → Correct — controller is thin, testable, focused on HTTP concerns
NO → Does the controller still contain business logic?
    YES → Continue extracting — business logic doesn't belong in controllers
    NO → Does the controller contain validation?
        YES → Validation is acceptable (form request or inline validation)
        NO → Controller is well-refactored

---

## Rationale

A thin controller reads input from the request, calls domain methods or services, and returns a response. It should not contain business rules, state change logic, or complex computations.

---

## Recommended Default

**Default:** Controller as thin coordinator
**Reason:** Testable, focused, and reusable across contexts (API, web, mobile).

---

## Risks Of Wrong Choice

Fat controllers are untestable without HTTP calls, cannot be reused in CLI/queue contexts, and make business logic invisible to domain experts.

---

## Related Rules

* Controller tests verify behavior, not implementation details

---

## Related Skills

* Refactor a Fat Controller into Domain Methods
