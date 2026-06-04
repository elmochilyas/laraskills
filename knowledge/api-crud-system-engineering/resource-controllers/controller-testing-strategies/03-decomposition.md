# Decomposition — Controller Testing Strategies

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | HTTP test methods, status code assertions, JSON structure validation, database assertions, authorization testing, partial mocks, form request testing |
| **Boundaries** | Ends where unit testing of service/action classes begins (below the HTTP layer); distinct from browser tests (Dusk) or API integration tests across services; separate from deployment testing |
| **Interfaces** | `$this->getJson()`, `$response->assertOk()`, `$response->assertJsonStructure()`, `$this->assertDatabaseHas()` — test assertion API |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Controller testing is a single coherent practice area |
| Minimal overlap | ✅ Atomic | Unique assertion patterns specific to controller testing |
| Testable independently | ❌ Cannot self-test | The strategy itself is about testing; meta-tests would be circular |
| Splittable? | ⚠️ Borderline | Could split "HTTP test assertions" from "database assertions" but they are used together |

## Dependency Graph

```
Resource Controller Pattern ──► Controller Testing Strategies
API Resource Controllers     ──► Controller Testing Strategies
Controller Response Selection ──► Controller Testing Strategies
                                       │
                                       └──► Thin Controller Enforcement
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a test template file for resource controller CRUD testing | Reduces boilerplate for new resource controllers |
| Document performance optimization for controller test suites (parallel, in-memory DB) | Addresses the #1 pain point with HTTP testing |
| Add a CI check that fails if controller coverage drops below 90% | Enforces testing discipline |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization