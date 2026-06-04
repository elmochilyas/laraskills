# Decomposition: Injection Guidelines by Class Type

## Boundary Analysis
Injection Guidelines by Class Type is a prescriptive taxonomy. Its boundary spans the complete set of Laravel class types that interact with the DI system, mapping each to an appropriate injection strategy (constructor, method, or none). It does **not** cover the underlying container mechanics (those are in other KUs) but rather provides decision rules for developers. The guidelines intersect with every other KU in this subdomain — they are a cross-cutting classification layer, not a standalone functional unit.

## Atomicity Assessment
**Status:** Fragments possible (8 fragments - one per class type)

| # | Fragment | Boundary | Independence |
|---|----------|----------|-------------|
| 1 | Controller Injection Rules | Constructor vs. method injection in controllers | Independent — controller lifecycle is well-defined |
| 2 | Job Injection Rules | Serialization-aware injection for queued jobs | Independent — job serialization is a distinct concern |
| 3 | Listener Injection Rules | Method injection preference for listeners | Independent from other class types |
| 4 | Domain Service Injection Rules | Abstraction-only injection in domain | Independent |
| 5 | Repository Injection Rules | Data-source injection focus | Independent |
| 6 | DTO Injection Rules | No-injection rule for data carriers | Independent |
| 7 | Model Injection Rules | Why models cannot use injection + alternatives | Independent |
| 8 | Command/Middleware/Provider Rules | Lifecycle-specific injection constraints | Independent |

Each fragment is logically independent — a developer can learn rules for Jobs without knowing rules for Models. However, splitting into 8 micro-KUs would create fragmentation without proportional value. The guidelines are most useful as a complete reference, with each class type as a section within a single KU. The common patterns (avoid `new inside services`, prefer abstractions over concretes in domain) run across all types and would require duplication across fragmented KUs.

## Dependency Graph
```
Injection Decision Tree (per class type):
 └─ Identify Class Type
     ├─ Controller?
     │   ├─ Shared deps (multiple actions) -> constructor injection
     │   ├─ Action-specific deps -> method injection
     │   └─ Never inject Request in constructor
     ├─ Job?
     │   ├─ Payload data (serializable) -> constructor injection
     │   ├─ Non-serializable services -> method injection (handle())
     │   └─ Ensure payload is serializable for queue
     ├─ Listener?
     │   ├─ Single-use services -> method injection (handle())
     │   ├─ Cross-listener shared services -> constructor injection
     │   └─ Prefer method injection
     ├─ Domain Service?
     │   ├─ Domain abstractions only -> constructor injection
     │   └─ No infrastructure services (Logger, Mailer, Cache)
     ├─ Repository?
     │   ├─ Data source -> constructor injection
     │   └─ No business-logic services
     ├─ DTO?
     │   └─ No injection -> plain data arguments only
     ├─ Model?
     │   ├─ No injection (ORM hydration bypasses container)
     │   └─ Use observers / service classes for behavior
     ├─ Command (Artisan)?
     │   ├─ Shared services -> constructor injection
     │   └── handle() supports method injection
     ├─ Middleware?
     │   ├─ Config/services -> constructor injection
     │   └─ handle() signature is fixed ($request, $next)
     └─ Service Provider?
         ├─ register() -> no injection supported
         └─ boot() -> method injection only
```

## Follow-up Opportunities
- Implement a PHPStan rule that validates injection patterns per class type: flag `app()` calls in models, constructor injection in DTOs, infrastructure injection in domain services, and Request injection in controller constructors. Publish as an open-source package.
- Create a decision matrix or interactive CLI tool that asks the developer "what class type are you writing?" and outputs the injection rules, anti-patterns to avoid, and code examples.
- Survey large Laravel codebases (100k+ lines) to measure compliance with these guidelines. Identify which class types most frequently violate the rules and whether violations correlate with defect density.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization