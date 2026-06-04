# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Direct Unit Tests vs Feature Tests for Middleware
* Testing Pass-Through Path vs Short-Circuit Path vs Modification Path
* Terminable Middleware Testing via Direct Invocation vs Feature Tests
* Architecture Tests vs Manual Convention Enforcement

---

# Architecture-Level Decision Trees

---

## Decision 1: Direct Unit Tests vs Feature Tests for Middleware

---

## Decision Context

Whether to test middleware by directly invoking `handle()` with a stub `$next` closure or by making HTTP requests through the full framework pipeline.

---

## Decision Criteria

* Whether the test needs to verify middleware logic in isolation
* Whether the test needs to verify pipeline integration (registration, priority, alias resolution)
* Whether test speed is a priority
* Whether the middleware has dependencies that need mocking

---

## Decision Tree

Does the test need to verify pure middleware logic (condition evaluation, request modification, response transformation)?
↓
YES → Direct unit test — instantiate middleware, call `handle()` with stub `$next`, assert on response
NO → Does the test need to verify pipeline integration (registration, priority sorting, alias resolution)?
    ↓
    YES → Feature test — full HTTP request through the pipeline
    NO → Is test speed important (suite of 50+ middleware tests)?
        ↓
        YES → Direct unit test — 0.5ms vs 30ms per test; 50 tests = 25ms vs 1.5s
        NO → Either works — but prefer direct for logic, feature for integration
NO → Does the middleware have dependencies that must be mocked?
    ↓
    YES → Direct unit test — mock dependencies easily; feature tests require framework-level mocking
    NO → Either — but direct unit tests are faster and more isolated

---

## Rationale

Direct unit tests run in ~0.5ms vs ~30ms for feature tests. A middleware with 10 condition branches requires 10 direct calls (~5ms) vs 10 HTTP requests (~300ms). However, feature tests verify pipeline integration (registration tier, priority position, alias resolution) that direct tests cannot cover.

---

## Recommended Default

**Default:** 60%+ of middleware tests as direct unit tests (logic coverage). Feature tests for integration verification (pipeline, registration, session interaction).
**Reason:** Direct tests are faster and more isolated. Feature tests cover integration that direct tests miss.

---

## Risks Of Wrong Choice

* All feature tests: 50 middleware tests take 5+ seconds instead of <100ms; slow CI feedback
* All direct tests: Miss registration, priority, and alias resolution bugs; middleware registered but never loaded
* No short-circuit testing: Only testing the pass-through path; missing the blocking behavior that defines guard middleware
* No terminable middleware testing: `terminate()` never tested because feature tests don't exercise it

---

## Related Rules

* Always Return the Result of $next($request)
* Place Pre-Processing Code Before $next and Post-Processing Code After

---

## Related Skills

* Write Direct Unit Tests for Custom Middleware
* Write Feature Tests for Middleware Pipeline Integration

---

---

## Decision 2: Testing Pass-Through Path vs Short-Circuit Path vs Modification Path

---

## Decision Context

Which of the three middleware execution paths to focus testing on for a given middleware.

---

## Decision Criteria

* Whether the middleware guards (short-circuits) or enriches (passes through)
* Whether the middleware modifies the request or response
* Which path is most critical for security

---

## Decision Tree

Does the middleware guard against unauthorized access or invalid state?
↓
YES → Test short-circuit path FIRST — the blocking behavior is the middleware's primary purpose
    → Test pass-through path SECOND — when conditions are met
    → Test modification path — if the middleware modifies request/response
NO → Does the middleware modify the request or response?
    ↓
    YES → Test modification path FIRST — verify the modification is correct and visible downstream
    → Test pass-through path — verify unmodified responses pass through unchanged
    → Test short-circuit path — if the middleware can block requests
NO → Does the middleware observe/log without modification?
    ↓
    YES → Test pass-through path — verify logging or metrics are recorded
    → No short-circuit path — logging middleware doesn't block
    → No modification path — logging middleware doesn't modify
NO → All three paths should be tested — every middleware has at least pass-through behavior

---

## Rationale

For guard middleware, the short-circuit path is the most important to test because it defines the security behavior. For enrichment middleware, the modification path is most important. For logging middleware, the pass-through path (verifying the log was written) is most important. Every middleware has at least the pass-through path.

---

## Recommended Default

**Default:** Test all three paths (pass-through, short-circuit, modification) for guard middleware. Test modification + pass-through for enrichment middleware. Test pass-through for logging middleware.
**Reason:** The short-circuit path is often untested — guard middleware tested only with valid credentials never verifies the blocking behavior that defines it.

---

## Risks Of Wrong Choice

* Only testing pass-through: Guard middleware tested with valid user only; invalid user path may be broken
* Only testing short-circuit: Middleware may not correctly handle the pass-through modification path
* Not testing modification: Request enrichment middleware adds data that is never verified downstream
* Testing only through controller: Middleware-specific bugs masked by controller behavior

---

## Related Rules

* Place Pre-Processing Code Before $next and Post-Processing Code After
* Always Return the Result of $next($request)

---

## Related Skills

* Write Direct Unit Tests for Custom Middleware
* Write Feature Tests for Middleware Pipeline Integration

---

---

## Decision 3: Terminable Middleware Testing via Direct Invocation vs Feature Tests

---

## Decision Context

How to test terminable middleware's `terminate()` method, which does not fire during feature tests.

---

## Decision Criteria

* Whether the test needs to verify `terminate()` logic
* Whether `terminate()` has dependencies that need mocking
* Whether the test needs to verify `terminate()` timing relative to `handle()`

---

## Decision Tree

Does the middleware implement `terminate()`?
↓
NO → No terminable testing needed — standard middleware testing applies
YES → Does `terminate()` need to be tested in isolation from `handle()`?
    ↓
    YES → Direct `terminate()` invocation — call `$middleware->terminate($request, $response)` and assert on side effects
    NO → Does `terminate()` need data shared from `handle()`?
        ↓
        YES → Integration test with singleton — register as singleton, call `handle()` then `terminate()` on same instance
        NO → Direct `terminate()` invocation — standalone call with mock dependencies
NO → Is the test verifying that `terminate()` does not fire (for non-terminable middleware)?
    ↓
    YES → Feature test — verify that non-terminable middleware does not interfere with response
    NO → Direct `terminate()` invocation — fastest and most isolated

---

## Rationale

Feature tests do NOT exercise `terminate()`. The response cycle in tests does not call `Kernel::terminate()`. Direct invocation of `$middleware->terminate($request, $response)` is the only way to verify termination logic. For singleton-registered middleware that shares state between `handle()` and `terminate()`, call both methods on the same resolved instance.

---

## Recommended Default

**Default:** Direct `terminate()` invocation for all terminable middleware tests. Singleton integration test when state sharing between `handle()` and `terminate()` is critical.
**Reason:** Feature tests never call `terminate()`. Developers who only write feature tests never test their termination logic.

---

## Risks Of Wrong Choice

* Feature tests only: `terminate()` never runs; termination bugs go undetected
* No singleton integration test: State shared between `handle()` and `terminate()` never verified to work
* Testing `terminate()` without mocking dependencies: Real database/API calls in termination tests
* Assuming `terminate()` fires: Deployed to RoadRunner where `terminate()` may not fire — silent failure

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Always Return the Result of $next($request)

---

## Related Skills

* Write Direct Unit Tests for Custom Middleware
* Implement Terminable Middleware with Singleton Registration

---

---

## Decision 4: Architecture Tests vs Manual Convention Enforcement

---

## Decision Context

Whether to use automated architecture tests (Pest) to enforce middleware conventions or rely on manual code review.

---

## Decision Criteria

* Whether conventions are clearly defined (naming, structure, method signatures)
* Whether the team size justifies automated enforcement
* Whether the conventions are stable

---

## Decision Tree

Are middleware conventions clearly defined and accepted by the team?
↓
NO → Manual enforcement first — document conventions, establish through code review
YES → Can the conventions be expressed as automated tests?
    ↓
    YES → Are the conventions stable (not changing weekly)?
        ↓
        YES → Architecture tests — `expect('App\Http\Middleware')->toHaveMethod('handle')`
        NO → Manual enforcement — conventions still evolving
    NO → Manual enforcement — convention is too complex or contextual for automated testing
NO → Is the team large enough (5+) that manual enforcement is inconsistent?
    ↓
    YES → Architecture tests — consistent enforcement regardless of reviewer
    NO → Manual enforcement — smaller teams maintain consistency through review

---

## Rationale

Architecture tests (Pest's `expect()` API) enforce conventions at the file/class level without running application logic. Examples: verify middleware classes have `handle()` method, verify terminable middleware implements `terminate()`, verify singleton registration for terminable middleware, verify middleware naming follows conventions.

---

## Recommended Default

**Default:** Architecture tests for structural conventions (method existence, naming, registration). Manual review for behavioral conventions (single responsibility, business logic boundary).
**Reason:** Structural conventions are easy to enforce automatically and prevent basic errors. Behavioral conventions require human judgment.

---

## Risks Of Wrong Choice

* No architecture tests: Middleware without `handle()` method silently fails with unhelpful error
* No registration verification: Custom middleware written but never registered — never runs
* Over-automation: Architecture tests that enforce subjective conventions cause false positives and frustration
* Architecture tests without documentation: Developers don't know what conventions are enforced until tests fail

---

## Related Rules

* Always Return the Result of $next($request)
* Never Place Business Logic in Middleware

---

## Related Skills

* Write Direct Unit Tests for Custom Middleware
* Write Architecture Tests for Middleware Conventions
