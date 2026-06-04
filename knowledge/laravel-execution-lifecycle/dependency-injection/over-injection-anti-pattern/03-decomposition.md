# Decomposition: Over-Injection Anti-Pattern

## Boundary Analysis
Over-Injection Anti-Pattern is a design analysis topic, not a functional unit. Its boundaries are defined by code metrics (constructor parameter count, class responsibility count) and refactoring patterns (extract class, move method, introduce parameter object). It intersects with Constructor Injection (the mechanism being overused), Method Injection (the alternative for single-use deps), and Service Locator (the false solution). The "diagnosis" boundary includes static analysis rules and manual code review; the "treatment" boundary includes refactoring techniques.

## Atomicity Assessment
**Status:** 🔶 Fragments possible (2 fragments)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Detection & Metrics** | Parameter counting, responsibility analysis, code smell identification | Fully independent as a static analysis concern |
| 2 | **Refactoring Techniques** | Extract class, extract interface, introduce parameter object, move to method injection | Independent set of refactoring patterns applicable beyond this context |

Fragment 1 is a subset of code quality instrumentation. Fragment 2 is a general refactoring catalog. However, using the two together in a single KU provides a complete "diagnose then treat" narrative that is more valuable than two fragmented analyses. Keep as single KU.

## Dependency Graph
```
Detection Flow:
 └─ Static Analysis of Class
     ├─ Count constructor parameters
     │   ├─ 0-3 → likely fine
     │   ├─ 4-5 → review for cohesion
     │   └─ 6+ → almost always over-injection
     ├─ Count responsibilities (by dependency category)
     │   ├─ Persistence (DB, Repository, Query)
     │   ├─ Communication (Mailer, Notifier, Webhook)
     │   ├─ Infrastructure (Logger, Cache, Config)
     │   └─ Domain (Services, Repositories, Strategies)
     ├─ Dependency usage analysis
     │   ├─ Used in all methods → true dependency
     │   └─ Used in 1 method → candidate for method injection
     └─ Test setup complexity assessment

Refactoring Flow:
 └─ Given an over-injected class
     ├─ Group dependencies by concern
     │   ├─ Persistence group → extract PersistenceService
     │   ├─ Notification group → extract NotificationService
     │   └─ Domain logic group → remains as core
     ├─ Extract collaborator classes
     │   └─ Each extracted class has 1-3 dependencies
     ├─ Replace extracted deps with single collaborator
     └─ Refactor tests (fewer mocks per test)
```

## Follow-up Opportunities
- Create a PHPStan rule that flags classes with more than N constructor parameters (configurable), excluding configuration objects and DTOs via a whitelist. Measure the rule's precision/recall on a real Laravel codebase.
- Conduct a controlled experiment: refactor an over-injected class (8 deps) into 3 smaller classes (2-3 deps each) and measure before/after metrics: test execution time, code navigation time for new developers, defect rate over 3 months.
- Survey the Laravel community on actual constructor parameter counts in production codebases. Publish aggregate statistics with quartiles. Determine a practical threshold based on empirical data rather than theoretical heuristics.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization