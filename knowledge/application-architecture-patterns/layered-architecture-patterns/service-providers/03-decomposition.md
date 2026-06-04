# Service Providers for Interface Binding — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-09-service-providers
- **Last Updated:** 2026-06-04

---

## Topic Overview
Service Providers as the composition root for Port-Adapter bindings in layered Laravel architecture, covering binding mechanics, environment-specific configurations, and verification testing.

---

## Decomposition Strategy
The topic splits by (1) binding mechanics — register vs boot, singleton vs bind, contextual vs direct; (2) organizational patterns — dedicated InfrastructureServiceProvider vs per-layer providers; (3) verification testing — ensuring every port resolves to its expected adapter. This avoids overlapping with general Service Provider documentation by focusing on the architectural role in Port-Adapter wiring.

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-09-service-providers/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| Service Providers for Binding | Port-Adapter wiring via container bindings | Intermediate | Dependency Rule, Service Container |
| Binding Mechanics | register vs boot, singleton vs bind, contextual | Intermediate | Service Providers |
| Provider Organization | Single vs multiple providers, naming conventions | Intermediate | Binding Mechanics |
| Binding Verification | Testing that interfaces resolve to correct implementations | Intermediate | PHPUnit/Pest |

---

## Dependency Graph
```
Dependency Rule → Port-Adapter Pattern → Service Providers for Binding
                                          ├── Binding Mechanics → register/boot
                                          ├── Provider Organization → InfrastructureServiceProvider
                                          └── Verification Testing → PHPUnit
```

---

## Boundary Analysis
**In scope**: Port-Adapter binding registration, `register()` vs `boot()` mechanics, singleton vs bind decisions, contextual binding for class-specific implementations, conditional environment bindings, InfrastructureServiceProvider pattern, binding verification tests, common binding mistakes.

**Out of scope**: Generic Service Provider lifecycle (boot, registering, booted events), provider auto-discovery for packages, deferred providers, facade registration, event/listener registration, route/middleware registration in providers.

---

## Future Expansion Opportunities
- Per-bounded-context Service Providers for modular monoliths
- Automatic binding discovery via convention over configuration
- Octane-specific binding patterns for persistent runtimes
- Binding override protection for test environment security
