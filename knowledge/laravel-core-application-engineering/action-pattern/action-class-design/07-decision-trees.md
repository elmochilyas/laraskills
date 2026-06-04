# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Class Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Action vs Inline Logic (Controller/Service)
* DTO vs Array vs Individual Parameters
* Constructor vs Method Injection in Actions

---

# Architecture-Level Decision Trees

---

## Decision 1: Action vs Inline Logic (Controller/Service)

---

## Decision Context

Whether to extract a business operation into a dedicated action class or keep the logic inline in a controller or service method.

---

## Decision Criteria

* Whether the operation has multiple steps (validation + logic + side effects)
* Whether it is called from multiple entry points
* Whether the operation has business logic vs simple CRUD pass-through
* Whether the operation needs isolated testing

---

## Decision Tree

Is the operation simple CRUD pass-through (e.g., `User::create($data)` with no business logic)?
↓
YES → Use Model directly or keep in controller/service — no action needed
NO → Does the operation have multiple steps or business rules?
    YES → Is the operation called from multiple entry points (HTTP + CLI + queue)?
        YES → Extract to Action
        NO → Will it be called from multiple entry points in the future?
            YES → Extract to Action proactively
            NO → Does the operation have 3+ unique dependencies?
                YES → Action provides test isolation
                NO → Keep in service method (extract to Action when second caller emerges)
NO → Does the operation need isolated unit testing?
    YES → Action (testable without framework boot)
    NO → Keep inline

---

## Rationale

Actions provide test isolation and entry-point independence. An action that does nothing but `User::create()` adds ceremony without benefit. The threshold for extraction is business logic complexity, reuse potential, and test isolation needs.

---

## Recommended Default

**Default:** Keep in service/controller for simple operations; extract to Action when the operation has business logic, multiple steps, or multi-entry-point reuse
**Reason:** Premature action extraction creates file proliferation without benefit. Extraction should be justified by concrete value (test isolation, reuse, dependency encapsulation).

---

## Risks Of Wrong Choice

* Action for CRUD pass-through: File proliferation, ceremony without value
* Inline for complex logic: Hard to test, hidden dependencies, cannot reuse from queue/CLI

---

## Related Rules

* Do Not Create Actions for Simple Eloquent CRUD Pass-Through (05-rules.md)
* Declare Action Classes as `final readonly` (05-rules.md)
* Enforce Single Public Method Per Action (05-rules.md)

---

## Related Skills

* Skill: Extract Controller Logic to an Action

---

## Decision 2: DTO vs Array vs Individual Parameters

---

## Decision Context

What input format an action's public method should accept — a typed DTO, a loose array, or individual named parameters.

---

## Decision Criteria

* Number of input parameters
* Whether the action is called from multiple entry points
* Whether type safety and IDE autocompletion are needed
* Whether the input data shape is stable

---

## Decision Tree

How many input parameters does the operation need?
↓
1-2 → Individual parameters: `execute(string $name, string $email): User`
3-4 → Is the action called from multiple (2+) entry points?
    YES → DTO (typed input contract shared across callers)
    NO → Individual parameters are acceptable, DTO is preferred
5+ → DTO required — individual parameters create unwieldy signatures
NO → Is the input shape expected to change (fields added/removed)?
    YES → DTO (adding a field is a DTO property, not a signature change)
    NO → Array may be acceptable for internal/private actions
NO → Is the action an internal implementation detail?
    YES → Array or individual params acceptable
    NO → DTO (public contract needs type safety)

---

## Rationale

DTOs provide compile-time safety, IDE autocompletion, and self-documenting contracts. Arrays shift the contract burden to the caller. Individual parameters work for 1-2 stable fields but become unwieldy beyond that.

---

## Recommended Default

**Default:** DTO for all public actions with 3+ parameters; individual parameters for 1-2 stable fields; arrays only for internal/private actions
**Reason:** DTOs make the input contract explicit and discoverable. Arrays hide the contract and cause runtime errors on key typos.

---

## Risks Of Wrong Choice

* Array for public action: No type safety, callers must guess keys, runtime errors on typos
* DTO for single-field: Overkill for `execute(int $id)`

---

## Related Rules

* Prefer DTOs or Individual Parameters Over Loose Arrays (05-rules.md)
* Never Accept HTTP Request Objects in Actions (05-rules.md)

---

## Related Skills

* Skill: Migrate Action Parameters from Arrays to DTOs

---

## Decision 3: Constructor vs Method Injection in Actions

---

## Decision Context

Whether to inject a dependency via the action's constructor (resolved by container) or pass it as a method parameter (operational input).

---

## Decision Criteria

* Whether the dependency is an infrastructure service or operational input
* Whether the dependency varies per call or is fixed for the action
* Whether the dependency is needed by the action's entire lifecycle

---

## Decision Tree

Is the dependency an infrastructure service (repository, gateway, logger, hasher)?
↓
YES → Constructor injection — resolved by container, fixed for the action's lifetime
NO → Is the dependency operational input that varies per call (user data, request parameters)?
    YES → Method injection — passed as parameter in `execute()`/`handle()`
NO → Is the dependency request-scoped (auth user, session, request)?
    YES → Method injection — the action must NOT depend on HTTP context
NO → Does the dependency change between different callers of the same action?
    YES → Method injection (passed by each caller)
    NO → Constructor injection

---

## Rationale

Constructor parameters are for infrastructure dependencies that the container resolves once. Method parameters are for operational input that varies per call. This distinction is the most important design rule in action classes: constructor = dependencies (container), method = data (caller).

---

## Recommended Default

**Default:** Constructor injection for infrastructure dependencies (repositories, gateways, loggers); method injection for operational input (DTO, individual params)
**Reason:** This keeps actions stateless, testable, and entry-point-agnostic. Infrastructure is resolved by container; operational data comes from the caller.

---

## Risks Of Wrong Choice

* Request object in constructor: Couples action to HTTP, breaks CLI/queue usage
* Infrastructure service as method param: Caller must resolve the dependency, not the container
* Operational data in constructor: Action cannot be called with different data per invocation

---

## Related Rules

* Never Accept HTTP Request Objects in Actions (05-rules.md)
* Keep Actions Stateless — Never Set Mutable Properties During Execution (05-rules.md)

---

## Related Skills

* Skill: Extract Controller Logic to an Action
* Skill: Design an Octane-Safe Stateless Action
