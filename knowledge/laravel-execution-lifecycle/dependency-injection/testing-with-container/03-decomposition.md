# Decomposition: Testing with the Container

## Boundary Analysis
Testing with the Container covers the suite of container mutation techniques used exclusively in test environments: `instance()`, `swap()`, `forgetInstance()`, facade faking (`fake()`, `shouldReceive()`), and the built-in contract fakes (`Http::fake()`, `Storage::fake()`, `Mail::fake()`, `Bus::fake()`, `Event::fake()`, `Notification::fake()`). Its boundary spans from the test's `setUp()` (where container modifications are made) through the execution of the system under test (where those modifications are consumed) to `tearDown()` (where state is cleaned up). It does **not** cover general PHPUnit mocking, integration test infrastructure (like `RefreshDatabase`), or test doubles for non-container-managed classes.

## Atomicity Assessment
**Status:** 🔶 Fragments possible (3 fragments)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Container Mutation Core** | `instance()`, `swap()`, `forgetInstance()`, `offsetUnset()` | Fully independent; operates on the container storage directly |
| 2 | **Facade Faking** | `Facade::fake()`, `shouldReceive()`, `spy()`, `swap()` | Depends on Facade base class but not on container internals |
| 3 | **Contract Fakes (Http, Storage, Mail, Bus, Event)** | Built-in fake implementations with assertion APIs | Semi-independent; these are higher-level patterns built atop container mutation |

Fragment 1 is the foundational mechanism that Fragments 2 and 3 build upon. Fragment 2 is tightly coupled to the Facade class. Fragment 3 introduces significant independent logic (the fake implementations themselves). However, keeping these together provides a unified view of Laravel's testing capabilities — separating them would obscure how the patterns compose. Recommend keeping as single KU.

## Dependency Graph
```
Test Case Execution Flow:
 ├─ setUp()
 │   ├─ $this->createApplication() → fresh container
 │   └─ Container mutations (instance, swap, fake)
 │       ├─ $this->app->instance(Abstract::class, $mock)
 │       │   ├─ stores in Container::$instances[]
 │       │   └─ marks as resolved
 │       ├─ Cache::fake()
 │       │   ├─ creates Mockery mock of Cache repository
 │       │   └─ Facade::swap($mock)
 │       │       └─ Facade::$resolvedInstance['cache'] = $mock
 │       └─ Http::fake(['github.com' => response])
 │           ├─ calls Container::instance('http.client', $fake)
 │           └─ fake stores URL pattern → response mapping
 ├─ act (run system under test)
 │   └─ Class resolves dependencies via make()
 │       ├─ Container::$instances[$abstract]? → return mock
 │       ├─ Facade::$resolvedInstance[$accessor]? → return mock
 │       └─ else → normal resolution (binding or auto-resolve)
 └─ tearDown()
     ├─ Mockery::close() → verify expectations
     ├─ Container::forgetInstance($abstract) [if needed]
     └─ Facade::clearResolvedInstance($accessor) [if needed]
```

## Follow-up Opportunities
- Measure the performance impact of `refreshApplication()` vs. selective `forgetInstance()` cleanup in a test suite with 1000+ tests. Determine the threshold at which selective cleanup is worth the maintenance cost.
- Create a PHPUnit extension that automatically records and clears container mutations between tests, preventing state leakage without requiring manual `forgetInstance()` calls.
- Investigate whether Laravel's `LazilyRefreshDatabase` trait could be extended to also manage container instance state, creating a unified "complete isolation" trait.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization