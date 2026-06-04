# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Pure Unit Test vs Hybrid Database Test vs Feature Test
* Mocking Strategy — What to Mock vs Use Real Implementations
* Test Granularity — One Test Class Per Action vs Shared Test Classes

---

# Architecture-Level Decision Trees

---

## Decision 1: Pure Unit Test vs Hybrid Database Test vs Feature Test

---

## Decision Context

What kind of test to write for an action — pure unit (mocked dependencies, no framework), hybrid (real database via `DatabaseTransactions`), or feature test (HTTP request through controller).

---

## Decision Criteria

* Whether the action's primary collaborator is the database or injected services
* Whether the action uses Eloquent directly or through a repository
* Whether the action needs HTTP context (middleware, routing)

---

## Decision Tree

Does the action need HTTP context (middleware, routing, authentication)?
↓
YES → Feature test (via HTTP) — but only for the adapter layer, not the action's business logic
NO → Does the action use Eloquent directly (no repository abstraction)?
    YES → Can the Eloquent queries be replaced with an in-memory implementation?
        YES → Pure unit test with in-memory repository
        NO → Hybrid test with `DatabaseTransactions` — real database, no framework boot
    NO → Are all dependencies injectable interfaces or services?
        YES → Pure unit test — instantiate action directly with mocked/real dependencies
        NO → Refactor action to use dependency injection first
NO → Does the test need to verify queued dispatch?
    YES → Pure unit test with `QueueableActionFake`
    NO → Pure unit test

---

## Rationale

Pure unit tests execute in <1ms and provide the fastest feedback. Hybrid tests with `DatabaseTransactions` run in 1-3ms for actions that need real database interaction. Feature tests (20-30ms) should be reserved for the HTTP adapter layer, not action business logic.

---

## Recommended Default

**Default:** Pure unit test with mocked dependencies for 60%+ of action tests; hybrid tests for database-coupled actions (~30%); feature tests only for adapter layer (~10%)
**Reason:** Actions are plain PHP classes — they are uniquely suited for pure unit testing. Don't couple them to framework boot.

---

## Risks Of Wrong Choice

* Feature test for action logic: 20-30ms per test, coupled to routing/middleware, fails on unrelated changes
* Pure unit test for Eloquent-coupled action: Impossible without refactoring to repository pattern
* Hybrid test for interface-dependent action: Unnecessary database cost

---

## Related Rules

* Use Pure Unit Tests as the Primary Testing Strategy (05-rules.md)
* Do Not Test Actions Through HTTP Feature Tests as Primary Strategy (05-rules.md)

---

## Related Skills

* Skill: Write a Pure Unit Test for an Action

---

## Decision 2: Mocking Strategy — What to Mock vs Use Real Implementations

---

## Decision Context

Which dependencies to mock (API clients, mailers) and which to use as real implementations (repositories, value objects, loggers).

---

## Decision Criteria

* Whether the dependency is expensive (API call, mail transport, file I/O)
* Whether the dependency is non-deterministic (random, clock, network)
* Whether the dependency is simple and deterministic (in-memory repository, null logger)

---

## Decision Tree

Is the dependency expensive or non-deterministic (API client, mailer, payment gateway, file system)?
↓
YES → Mock — these should never execute in unit tests
NO → Is the dependency a simple value object, logger, or in-memory data structure?
    YES → Use real implementation (NullLogger, InMemoryRepository, plain DTO)
    NO → Is the dependency a repository backed by Eloquent?
        YES → Can you create an in-memory implementation?
            YES → Use in-memory implementation (faster, no database)
            NO → Mock the repository interface
NO → Is the dependency a third-party SDK or external service?
    YES → Mock
    NO → Use real implementation

---

## Rationale

Over-mocking creates tests that pass with incorrect implementations. A mocked repository's `create()` returns whatever the test specifies — the test never verifies that the real repository actually stores data correctly. Real implementations for simple dependencies increase test coverage without significant speed cost.

---

## Recommended Default

**Default:** Mock expensive/unreliable collaborators (API, mailer, gateway); use real implementations for cheap/deterministic ones (repositories, loggers, value objects)
**Reason:** Real implementations increase test coverage. Mocks isolate the action from non-deterministic or costly dependencies.

---

## Risks Of Wrong Choice

* Over-mocking: Tests pass with wrong implementation, brittle
* Under-mocking: Slow tests, network calls in unit tests, non-deterministic failures
* Mocking value objects: Adds brittleness for no benefit

---

## Related Rules

* Limit Mocking to Expensive or Unreliable Dependencies (05-rules.md)

---

## Related Skills

* Skill: Write a Pure Unit Test for an Action

---

## Decision 3: Test Granularity — One Test Class Per Action vs Shared Test Classes

---

## Decision Context

Whether to create one dedicated test class per action or share test classes across multiple actions.

---

## Decision Criteria

* Number of actions in the codebase
* Whether each action has distinct business rules to test
* Whether shared test classes cause confusion about which action is failing

---

## Decision Tree

Is there exactly one action class to test?
↓
YES → One test class: `{ActionName}Test.php` in `tests/Unit/Actions/{Domain}/`
NO → Are multiple actions related (same domain, similar logic)?
    YES → Does each action have distinct business rules?
        YES → Separate test class per action (1:1 mapping)
        NO → Are the actions trivially simple (1-2 method calls)?
            YES → May share a test class temporarily, but split when complexity grows
            NO → Separate test class per action
    NO → Separate test class per action

---

## Rationale

A 1:1 mapping ensures that developers can always find the test for any action without searching. When an action is modified, the developer knows exactly which test file to update. Shared test classes hide failures — a test failure in a shared class does not immediately indicate which action is broken.

---

## Recommended Default

**Default:** One test class per action class, located at `tests/Unit/Actions/{Domain}/{ActionName}Test.php`
**Reason:** 1:1 mapping provides discoverability, clear ownership, and precise failure signals. Any developer can find the test for any action without searching.

---

## Risks Of Wrong Choice

* Shared test class: Failing test doesn't indicate which action is broken
* No tests for an action: Action modified without test coverage

---

## Related Rules

* Maintain 1:1 Mapping Between Action Files and Test Files (05-rules.md)

---

## Related Skills

* Skill: Write a Pure Unit Test for an Action
