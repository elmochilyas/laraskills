# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Dependency Injection
**Knowledge Unit:** Testing with Container
**Generated:** 2026-06-03

---

# Decision Inventory

1. Test Double Strategy: `instance()` vs `shouldReceive()` vs Laravel fakes
2. State Isolation: Full `refreshApplication` vs targeted cleanup
3. Scope Reset: When and how to reset scoped bindings between tests

---

# Architecture-Level Decision Trees

---

## Decision Name: Test Double Selection

---

## Decision Context

Choosing between `$this->app->instance()`, `Facade::shouldReceive()`, and Laravel built-in fakes for replacing services in tests.

---

## Decision Criteria

* performance — `instance()` is O(1); `shouldReceive()` adds Mockery setup overhead
* architectural — `instance()` works for any binding; `shouldReceive()` only for facades; fakes implement real interfaces
* security — over-mocking hides integration issues
* maintainability — Laravel fakes are resilient to signature changes; mocks break on refactors

---

## Decision Tree

Is there a Laravel built-in fake for the service (Event, Bus, Queue, Http, Mail, Storage, Notification)?
↓
YES → Use the built-in fake — most resilient, rich assertion API
NO → Is the service consumed via a facade in the code under test?
↓
YES → Use `Facade::shouldReceive()` — clean Mockery integration with expectation assertions
NO → Is the service an interface-bound contract resolved from the container?
↓
YES → Use `$this->app->instance(Interface::class, $mock)` — clean, predictable replacement
NO → Is the service a concrete class resolved via auto-resolution?
↓
YES → Use `$this->app->instance(Concrete::class, $mock)` — bypasses auto-resolution
NO → Use `$this->app->instance()` for any container-resolved service

---

## Rationale

Laravel built-in fakes (`Event::fake()`, `Bus::fake()`, `Http::fake()`) implement the real interfaces and are resilient to method signature changes. `Facade::shouldReceive()` provides rich Mockery expectations for facade-based services. `$this->app->instance()` is the universal approach for any container-bound service — it stores a pre-built object in `$instances`, bypassing all binding resolution.

---

## Recommended Default

**Default:** Laravel built-in fakes first; `$this->app->instance()` for custom services; `shouldReceive()` for facades.
**Reason:** Fakes are most resilient; `instance()` is most universal; `shouldReceive()` is for facade-specific testing.

---

## Risks Of Wrong Choice

- Using `shouldReceive()` when code uses constructor injection: mock is installed on facade root, not on injected instance — no effect.
- Using `instance()` for facade-based service: must bypass facade and use container directly — inconsistent with production code.
- Over-mocking with all three: too many test doubles hide real integration issues.

---

## Related Rules

- Use `instance()` to mock interface bindings in tests (05-rules.md, Rule 1)
- Use `shouldReceive()` for facade faking (05-rules.md, Rule 2)
- Prefer Laravel built-in fakes over manual mocks (05-rules.md, Rule 3)

---

## Related Skills

- Test Container-Dependent Code with Instance Binding (06-skills.md)

---

## Decision Name: Test State Isolation Strategy

---

## Decision Context

Choosing between full application refresh and targeted container state cleanup for maintaining test isolation.

---

## Decision Criteria

* performance — `refreshApplication` adds 30-100ms per test; targeted cleanup is <1ms
* architectural — full refresh guarantees isolation; targeted cleanup requires maintenance
* security — stale container state causes inter-test contamination
* maintainability — `refreshApplication` is simple; targeted cleanup must be kept in sync

---

## Decision Tree

Do multiple tests share container state (singletons, resolved instances, facades)?
↓
YES → Is the shared state causing test contamination (order-dependent test failures)?
YES → Use `refreshApplication` trait — rebuilds container per test (slower but safe)
NO → Are only facades being faked?
↓
YES → Use `Facade::clearResolvedInstances()` in setUp() — targeted cleanup, no full rebuild
NO → Are only scoped bindings being used?
↓
YES → Use `$this->app->forgetScopedInstances()` in setUp() — targeted cleanup
NO → Are `instance()` overrides being used?
↓
YES → Use `refreshApplication` — instance overrides persist unless explicitly cleared
NO → No cleanup needed — tests are independent

---

## Rationale

`refreshApplication` recreates the entire application per test — adding 30-100ms overhead but guaranteeing clean container state. Targeted cleanup (`clearResolvedInstances()`, `forgetScopedInstances()`, `forgetInstance()`) is faster but requires knowing exactly which state needs clearing. The safest approach for most test suites is `refreshApplication`; use targeted cleanup only when performance profiling shows it matters.

---

## Recommended Default

**Default:** Use `RefreshApplication` trait (or `RefreshesApplication` in Laravel) for most test suites.
**Reason:** Guarantees clean container state; avoids order-dependent test failures.

---

## Risks Of Wrong Choice

- No cleanup between tests: stale `instance()` overrides, scoped binding state, or facade fakes leak — causes inter-test contamination.
- `refreshApplication` in every test: test suite runs slower — but correctness > speed.
- Targeted cleanup missing one item: subtle contamination that only manifests in certain test orders.

---

## Related Rules

- Reset container state with `refreshApplication` or `tearDown()` cleanup (05-rules.md, Rule 4)
- Reset scoped instances between tests (05-rules.md, Rule 5)

---

## Related Skills

- Test Container-Dependent Code with Instance Binding (06-skills.md)
