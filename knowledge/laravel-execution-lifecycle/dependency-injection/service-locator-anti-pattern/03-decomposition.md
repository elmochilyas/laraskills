# Decomposition: Service Locator Anti-Pattern

## Boundary Analysis
Service Locator Anti-Pattern is a behavioral analysis topic, not a functional unit of code. Its boundaries are defined by usage patterns: code that calls `app()`, `resolve()`, `App::make()`, `Container::getInstance()->make()`, or any facade method from within business logic (controllers, models, services, domain classes). Acceptable usages (facade base class, bootstrap code, deferred resolution in legacy adapters) are excluded from the "anti-pattern" label. The boundary is architectural, not mechanical — the underlying container resolution is identical to proper DI; the difference is where in the call chain it occurs.

## Atomicity Assessment
**Status:** 🔶 Fragments possible (2 fragments)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | **Detection & Static Analysis** | Identifying service locator usage in code, lint rules, code sniffs | Fully independent; can exist as a standalone analysis tool |
| 2 | **Remediation & Code Migration** | Replacing `app()` calls with constructor injection, refactoring patterns | Dependent on Fragment 1 (detection), but the migration techniques are independent KU topics |

Fragment 1 (detection) is a tooling concern best covered in a development workflow context. Fragment 2 (remediation) overlaps heavily with Constructor Injection and Injection Guidelines. Keeping this as a single KU preserves the "why it's harmful → how to detect → how to fix" narrative.

## Dependency Graph
```
Service Locator Detection
 └─ Code Audit (grep for app(), resolve(), App::make(), Facade calls)
     ├─ In business logic? → flag as anti-pattern
     ├─ In bootstrap/service provider? → acceptable
     ├─ In facade base class? → intentional by design
     └─ In legacy adapter? → acceptable with note to migrate

Service Locator Remediation
 └─ app(SomeClass::class) in method body
     ├─ Move to constructor: __construct(SomeClass $dep)
     ├─ Move to method parameter: function handle(SomeClass $dep)
     └─ Use optional resolution: method(nullable param with default)
```

## Follow-up Opportunities
- Develop a PHPStan or Psalm rule that flags `app()`, `resolve()`, and `App::make()` calls in all files under `app/` (excluding service providers). Open-source as a community package.
- Analyze a representative sample of 100 open-source Laravel applications for service locator density (calls per 1000 lines). Correlate with test coverage metrics to quantify the relationship between locator usage and test fragility.
- Create a migration playbook for converting a large (100+ class) codebase from service locator to constructor injection, measuring defect rate before and after migration.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization