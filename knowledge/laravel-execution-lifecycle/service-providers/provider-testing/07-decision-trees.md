# Decision Trees — Provider Testing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Testing |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Test Level Selection | Whether to write a unit test, integration test, or both for a given provider | Every provider test | Medium |
| D02 | Registration vs Resolution Testing | Whether to test that a binding IS registered or that it resolves correctly | Each test case | Medium |
| D03 | provides() Contract Test Necessity | Whether a deferred provider's `provides()` method needs a dedicated test | Every deferred provider | High |
| D04 | Boot Integration Test Requirements | Whether a provider's `boot()` method needs integration-level testing | Complex providers | Medium |

---

## D01: Test Level Selection

### Decision Context
You are writing tests for a service provider. Should you write unit tests (using a real or mock container, testing just `register()`), integration tests (with full or minimal application bootstrap), or both?

### Criteria
1. **Provider complexity**: Does the provider have complex `register()` logic, or just simple bindings?
2. **Boot-time side effects**: Does `boot()` perform I/O, database queries, or register routes/views?
3. **Deferral status**: Is the provider deferred (needs `provides()` verification)?
4. **Criticality**: Is this a security-critical provider (auth, encryption, payments)?

### Decision Tree
```
Provider test planning
├── Is the provider trivial (<5 bindings, no boot() logic)?
│   ├── Yes → Unit test register() only (fast, simple assertions)
│   └── No → Does boot() perform I/O, DB queries, or complex side effects?
│       ├── Yes → Add integration test for boot() (catches real-world issues)
│       │   └── Also unit test register() for fast failure feedback
│       └── No → Unit test register() is sufficient
├── Is the provider deferred?
│   ├── Yes → ALWAYS add provides() contract test (most common deferred bug)
│   └── No → provides() test not needed
├── Is this a security-critical provider?
│   ├── Yes → Add both unit and integration tests
│   └── No → Unit test + provides() test (if deferred) is sufficient
```

### Rationale
Unit tests for `register()` are fast and provide targeted feedback. Integration tests for `boot()` are slower but catch issues that unit tests miss (e.g., missing dependencies at runtime). For deferred providers, the `provides()` contract test is the highest-value test — mismatch between `provides()` and actual bindings is the most common deferred provider bug.

### Default
Unit test `register()` for all providers. Add `provides()` test for deferred providers. Add integration test for complex or security-critical providers.

### Risks
- No `provides()` test = silent resolution failures in production.
- Full integration tests slow down CI for no benefit on trivial providers.
- Over-mocking container = passes in test, fails in production.

### Related Rules/Skills
- Skill: Test Deferred Provider provides() Method

---

## D02: Registration vs Resolution Testing

### Decision Context
You are writing an assertion about a provider's binding. Should you test that the binding IS registered (registration test) or that the service resolves correctly (resolution test)?

### Criteria
1. **Specificity**: Do you need to verify this specific provider registered the binding?
2. **Type correctness**: Do you need to verify the resolved service has the correct type?
3. **Binding override**: Could another provider register the same abstract with a different concrete?

### Decision Tree
```
Writing a test assertion for a provider binding
├── Do you need to verify THIS provider registered the binding (not another provider)?
│   ├── Yes → Use registration test: $this->assertTrue($app->bound(Abstract::class))
│   │   └── Note: bound() only checks if something is registered, not by whom
│   └── No → Do you need to verify the resolved service has the correct concrete type?
│       ├── Yes → Use resolution test: $this->assertInstanceOf(Concrete::class, $app->make(Abstract::class))
│       └── No → Do you need to verify the binding is shared (singleton)?
│           ├── Yes → Use $this->assertTrue($app->isShared(Abstract::class))
│           └── No → Use registration test with bound()
├── Best practice for comprehensive testing:
│   ├── Test bound() to verify registration
│   ├── Test make() + assertInstanceOf() to verify resolution
│   └── Test isShared() to verify singleton vs instance-per-resolve
```

### Rationale
Registration tests (`bound()`) verify that a binding exists but not who registered it. Resolution tests (`make() + assertInstanceOf()`) verify the entire resolution chain — including dependencies of the bound class. Both are important: registration tests confirm the provider's intent, resolution tests confirm the runtime behavior. Use `bound()` when you want to verify the provider registered the binding (in a clean container). Use `make()` when you want to verify the full resolution chain works.

### Default
Test both: `bound()` for registration, `make() + assertInstanceOf()` for resolution. Use `isShared()` for singleton verification.

### Risks
- Testing only resolution: passes even if another provider registered the binding.
- Testing only registration: passes even if the binding's concrete class doesn't exist.
- Testing `make()` without asserting type: passes even if wrong concrete is resolved.

### Related Rules/Skills
- Skill: Test Deferred Provider provides() Method

---

## D03: provides() Contract Test Necessity

### Decision Context
You have a deferred provider. Should you write a dedicated test for its `provides()` method?

### Criteria
1. **Deferral status**: Is the provider deferred?
2. **Binding count**: How many service identifiers does `provides()` return?
3. **Change frequency**: How often does `register()` change?
4. **Failure impact**: What happens if `provides()` is out of sync?

### Decision Tree
```
Deferred provider — provides() test needed?
├── Does the provider implement DeferrableProvider?
│   ├── Yes → ALWAYS write a provides() contract test
│   │   ├── Test: every identifier in provides() is actually bound in register()
│   │   ├── Test: every identifier bound in register() is listed in provides()
│   │   └── Test: no stale entries in provides() that are no longer bound
│   └── No → provides() test not applicable (eager provider)
├── Best practice:
│   └── Write a parameterized test that iterates provides() and asserts bound()
│       └── Also reverse: assert that every bind()/singleton() target is in provides()
```

### Rationale
The most common deferred provider bug is a mismatch between `provides()` and actual bindings. If `provides()` omits a service identifier, the provider never loads for that service — silent resolution failure. If `provides()` includes identifiers no longer bound, it wastes manifest lookup time. A bidirectional contract test catches both cases: every item in `provides()` must be bound, and every binding must be in `provides()`.

### Default
Always write a `provides()` contract test for every deferred provider.

### Risks
- No `provides()` test = silent resolution failures in production.
- Single-direction assertion (e.g., only checking `provides()` items are bound) misses the case where a new binding was added but not listed in `provides()`.
- Test not updated when `register()` changes.

### Related Rules/Skills
- Rule 2: Always Implement `provides()` with Every Registered Service Identifier
- Skill: Test Deferred Provider provides() Method

---

## D04: Boot Integration Test Requirements

### Decision Context
You are deciding whether a provider's `boot()` method needs an integration-level test that registers dependent providers and boots the application.

### Criteria
1. **Boot complexity**: Does `boot()` do more than simple route/view/event registration?
2. **External dependencies**: Does `boot()` interact with database, cache, or external services?
3. **Dependency count**: Does `boot()` require many other providers to be registered first?
4. **Crash impact**: Would a failure in `boot()` take down the entire application?

### Decision Tree
```
Boot integration test needed?
├── Does boot() perform database queries, API calls, or complex I/O?
│   ├── Yes → Integration test required (unit test can't validate real behavior)
│   └── No → Does boot() interact with services from multiple other providers?
│       ├── Yes → Integration test recommended (catches dependency ordering issues)
│       └── No → Does boot() just call loadRoutesFrom / loadViewsFrom / loadMigrationsFrom?
│           ├── Yes → Unit test is sufficient (minimal risk)
│           └── No → Does a failure in boot() crash the entire application?
│               ├── Yes → Integration test required (high impact)
│               └── No → Integration test optional
```

### Rationale
`boot()` integration tests verify that the provider works correctly with its dependencies in a realistic container state. They catch issues that unit tests miss: missing dependent bindings, ordering issues, and side effects that only manifest at runtime. However, they are slower and more complex to set up (need to register all dependent providers). Reserve integration tests for complex `boot()` methods or providers where a boot failure would be catastrophic.

### Default
Integration test `boot()` for complex providers with I/O or multi-provider dependencies. Skip for simple route/view/event registration.

### Risks
- No integration test for complex `boot()` = undetected ordering bugs in production.
- Integration test for trivial `boot()` = slow CI for no benefit.
- Not registering all dependent providers in integration test = false failures or false passes.

### Related Rules/Skills
- Skill: Test Deferred Provider provides() Method
