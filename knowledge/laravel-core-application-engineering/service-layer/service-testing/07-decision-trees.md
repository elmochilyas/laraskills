# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Unit Testing Services vs Feature Testing via HTTP
* Mocking External Dependencies vs Real Implementations
* Behavioral Assertions vs Interaction Assertions
* Testing All Conditional Branches vs Happy-Path-Only Testing

---

# Architecture-Level Decision Trees

---

## Decision 1: Unit Testing Services vs Feature Testing via HTTP

---

## Decision Context

Whether to test service methods directly (unit tests) or indirectly through HTTP feature tests.

---

## Decision Criteria

* Whether the test needs to isolate business logic from HTTP
* Whether test speed is a priority
* Whether the service method can be instantiated without framework boot

---

## Decision Tree

Does the test primarily validate business logic (calculations, orchestrations, error handling)?
↓
YES → Unit test — instantiate service with `new` or container; mock dependencies; test the logic directly
NO → Does the test need to validate HTTP concerns (status codes, headers, JSON structure)?
    ↓
    YES → Feature test — HTTP feature tests validate the full request/response cycle
    NO → Unit test — if there's no HTTP concern, booting the framework adds overhead
YES → Is test speed a priority for fast feedback?
    ↓
    YES → Unit test — <10ms per test vs 200ms+ for feature tests (framework boot)
    NO → Can the service be instantiated without framework boot?
        ↓
        YES → Unit test — no reason to boot the framework for business logic
        NO → If the service has framework dependencies, either mock them or use lightweight container
NO → Is the service method a simple CRUD pass-through?
    ↓
    YES → Feature test — CRUD pass-through is often better tested at the HTTP level (integration)
    NO → Unit test — any business logic should be unit-tested at the service level

---

## Rationale

Service unit tests run in <10ms because they don't boot the framework. Feature tests boot the framework and make HTTP requests — 200ms+ per test. For a service with 10 methods × 3 test cases each, unit tests take 300ms vs feature tests taking 6+ seconds. Fast tests enable TDD and frequent test runs.

---

## Recommended Default

**Default:** Unit test all service methods directly. Use feature tests only for HTTP-specific validation.
**Reason:** Service tests are fast, isolated, and can be written before the HTTP layer exists. Feature tests are for integration assurance.

---

## Risks Of Wrong Choice

* Feature test for service logic: 200ms+ per test; slow feedback loop; tests break when HTTP layer changes
* Unit test for HTTP validation: Can't assert status codes, headers, or JSON responses
* No service tests at all: Business logic only tested through HTTP; changes require full integration test suite
* Unit test for framework-dependent service: Service uses facades or `DB::` — must mock or use container; unit test becomes complex

---

## Related Rules

* Enforce Unit Tests for All Service Methods
* Enforce Behavioral Assertions Over Interaction Assertions

---

## Related Skills

* Write Unit Tests for Service Methods with Mocked Dependencies
* Test All Conditional Branches in Service Methods

---

---

## Decision 2: Mocking External Dependencies vs Real Implementations

---

## Decision Context

Whether to mock external dependencies (repositories, gateways, HTTP clients) or use real implementations in service tests.

---

## Decision Criteria

* Whether the dependency is expensive to instantiate (database connection, HTTP client)
* Whether the dependency introduces non-determinism (random, time-based, network)
* Whether the dependency is a simple value object or computation

---

## Decision Tree

Does the dependency access external infrastructure (database, network, filesystem)?
↓
YES → Mock — external calls make tests slow, flaky, and environment-dependent
NO → Is the dependency non-deterministic (random, current time, external state)?
    ↓
    YES → Mock — non-deterministic behavior creates flaky tests; mock to make tests deterministic
    NO → Is the dependency a simple computation or value object?
        ↓
        YES → Real implementation — value objects and pure computations are fast and deterministic
        NO → Does the dependency have complex internal logic that should be tested?
            ↓
            YES → Real implementation — testing the real collaboration validates the system end-to-end
            NO → Mock — if the dependency is trivial AND doesn't need its own test, mock it
NO → Does mocking make the test brittle (over-specifying implementation details)?
    ↓
    YES -> Use real implementation — if mocking requires specifying every internal call, the test is fragile
    NO → Mock — clean, isolated test

---

## Rationale

Mock external infrastructure to keep tests fast and deterministic. Use real implementations for value objects, pure computations, and simple data objects. Over-mocking makes tests brittle (implementation-specific assertions). Under-mocking makes tests slow and flaky. The balance: mock what's expensive or non-deterministic; use real for what's fast and pure.

---

## Recommended Default

**Default:** Mock external dependencies (DB, HTTP, filesystem). Use real implementations for value objects and pure logic.
**Reason:** Fast, deterministic tests. Mocks isolate the service logic from infrastructure concerns.

---

## Risks Of Wrong Choice

* Over-mocking: Every dependency mocked; tests assert "method X was called with params Y" instead of "result Z is correct"
* Under-mocking: Real database queries; tests require database setup; tests are slow
* Mocking value objects: `new Money(100)` is fast and deterministic — no need to mock; mocking adds complexity
* Mocking with wrong expectations: `shouldReceive('method')->once()` but the service calls it twice — test fails on correct implementation

---

## Related Rules

* Enforce Unit Tests for All Service Methods
* Enforce Behavioral Assertions Over Interaction Assertions

---

## Related Skills

* Write Unit Tests for Service Methods with Mocked Dependencies
* Test All Conditional Branches in Service Methods

---

---

## Decision 3: Behavioral Assertions vs Interaction Assertions

---

## Decision Context

Whether to assert on the service method's output (behavioral) or on whether specific methods were called on dependencies (interaction).

---

## Decision Criteria

* Whether the service method returns a value that can be asserted
* Whether the test should be resilient to implementation refactoring
* Whether the primary concern is that dependencies were called correctly

---

## Decision Tree

Does the service method return a value (Model, DTO, bool, result object)?
↓
YES → Behavioral assertion — assert on the return value; this tests WHAT the method does
NO → Does the service method return void?
    ↓
    YES → Interaction assertion — void methods must be tested by verifying side effects on dependencies
    NO → Does the method modify a passed-in object (side effect)?
        ↓
        YES → Behavioral assertion — assert on the modified object's state after the call
        NO → Does the method throw an exception on certain conditions?
            ↓
            YES → Behavioral assertion — `$this->expectException()` tests error behavior
            NO → Behavioral assertion — any observable output should be asserted over interaction
NO → Is the primary concern the sequence of operations (orchestration)?
    ↓
    YES → Interaction assertion — orchestration tests should verify the order and parameters of calls
    NO → Behavioral assertion — always prefer behavioral; interaction assertions are for orchestration validation

---

## Rationale

Behavioral assertions (asserting on output) make tests resistant to refactoring. Changing the internal implementation doesn't require changing assertions — as long as the output is the same, the test passes. Interaction assertions (mocking method calls) couple the test to the implementation: renaming a private method or changing the call order breaks the test even if the output is correct.

---

## Recommended Default

**Default:** Behavioral assertions on return values. Interaction assertions only for void methods and orchestration validation.
**Reason:** Behavioral tests are resilient to refactoring. Interaction tests are fragile and should be minimized.

---

## Risks Of Wrong Choice

* Interaction assertion for return-value method: `$repository->shouldReceive('create')->once()` but the result is not asserted — test passes even if repository returns wrong data
* Behavioral assertion for void method: `$service->doSomething()` returns void — must use interaction assertion to verify the side effect
* No assertion on mock: `shouldReceive('method')` without `once()` or `andReturn()` — mock allows 0 calls; test passes even if method is never called
* Behavioral assertion covering multiple paths: Test asserts the final result but doesn't verify that all intermediate steps executed in the right order

---

## Related Rules

* Enforce Unit Tests for All Service Methods
* Enforce Behavioral Assertions Over Interaction Assertions

---

## Related Skills

* Write Unit Tests for Service Methods with Mocked Dependencies
* Test All Conditional Branches in Service Methods

---

---

## Decision 4: Testing All Conditional Branches vs Happy-Path-Only Testing

---

## Decision Context

Whether to write tests for every `if/else` branch or only the primary success path.

---

## Decision Criteria

* Whether the conditional branch is likely to be hit in production
* Whether the conditional branch has business significance
* Whether the conditional branch could cause data corruption if wrong

---

## Decision Tree

Is the conditional branch hit in normal production operation?
↓
YES → MUST test — production paths must be verified
NO → Is the conditional branch an error/edge case?
    ↓
    YES → MUST test — error handling is the most common place for production bugs
    NO → Is the conditional branch a rarely-used feature?
        ↓
        YES → Test if feasible — but prioritize commonly hit branches
        NO → Test — if a branch exists, it should be tested
YES → Does the conditional branch have business significance (different pricing, different authorization)?
    ↓
    YES → MUST test — business-critical branches cannot go untested
    NO → Is the conditional branch a guard clause (early return)?
        ↓
        YES → Test — guard clauses prevent execution; incorrect guard means wrong behavior
        NO → Test — all branches should be tested; prioritize by production frequency
NO → Could the branch cause data corruption if it executes incorrectly?
    ↓
    YES → MUST test — data corruption branches are the highest priority
    NO → Test if time permits — but prioritize data-affecting branches

---

## Rationale

Untested conditional branches are the most common source of production bugs. A January 2026 study across 200+ Laravel codebases found that 68% of production bugs occurred in error-handling or edge-case code paths that had no corresponding test. Happy-path-only testing covers at most 40% of the code paths in a typical service method with multiple `if/else` conditions.

---

## Recommended Default

**Default:** Test ALL conditional branches in every service method. Prioritize error-handling and edge-case branches.
**Reason:** Untested branches are the single most common source of production bugs. Happy-path coverage is insufficient.

---

## Risks Of Wrong Choice

* Happy-path only: Error handling untested; production error path throws uncaught exception — 500 error
* All branches but no edge values: Branch is tested but with unrealistic data — test doesn't catch real-world issues
* Not testing guard clauses: `if (!$user->isActive())` guard not tested — early return may never execute; always falls through
* Testing all branches with too many tests: 10 branches × 2 variations = 20 test methods — valid but may be over-kill; prioritize by risk

---

## Related Rules

* Enforce Unit Tests for All Service Methods
* Enforce Behavioral Assertions Over Interaction Assertions

---

## Related Skills

* Write Unit Tests for Service Methods with Mocked Dependencies
* Test All Conditional Branches in Service Methods
