# Decision Trees: Module vs. Microservice

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module vs. microservice: definition and key differences
- **Knowledge Unit ID:** MMD-01
- **Difficulty Level:** Foundation

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Start with modular monolith vs microservices | Architecture | Project inception |
| 2 | Design modules as extraction-ready vs coupled | Architecture | Module creation |
| 3 | Enforce boundaries with tests vs folder conventions | Enforcement | CI setup |

---

## Decision 1: Start with modular monolith vs microservices

### Context
Teams under 30 engineers should default to modular monolith. Microservices add operational overhead (multi-CI, multi-deploy, multi-monitor) that consumes development capacity. Industry data shows 40%+ of microservice implementations should have remained monoliths. Only extract when specific measurable constraints justify it.

### Decision Tree

```
Is the team smaller than 30 engineers?
├── YES
│   Is there a regulatory requirement for network-level data isolation (PCI/HIPAA)?
│   ├── YES → Start with microservices, but carefully scope service boundaries
│   └── NO → Start with modular monolith
└── NO (team ≥30)
    Does the team operate as independently deploying sub-teams?
    ├── YES → Consider microservices; document decision with ADR
    └── NO → Start with modular monolith
```

### Rationale
Team size is the primary predictor of microservice success. Teams under 30 cannot absorb the operational overhead of multiple services. Regulatory requirements are the only valid exception for small teams. Even for large teams, start modular and extract only when organizational independence is needed.

### Recommended Default
Start with modular monolith

### Risks
- Premature microservices: CI/deploy/monitor costs consume development capacity
- No extraction readiness: module cannot be extracted without rewrite
- Missing regulatory requirement: compliance failure

### Related Rules
- Start With Modular Monolith; Extract When Justified (MMD-01/05-rules.md)
- Respect Team-Size Threshold (MMD-01/05-rules.md)
- Separate Databases on Extraction (MMD-01/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-01/06-skills.md)

---

## Decision 2: Design modules as extraction-ready vs coupled to monolith internals

### Context
Modules designed without extraction readiness inevitably become tightly coupled to the monolith. Extraction then requires a costly rewrite. Extraction-ready design means explicit contracts, own database schema, no shared Eloquent models, and clear ownership boundaries.

### Decision Tree

```
Does the module have explicit inter-module contracts?
├── YES
│   Does the module own its database schema (own tables, own migrations)?
│   ├── YES → Extraction-ready — extraction is feasible without rewrite
│   └── NO → Partial readiness — database coupling blocks clean extraction
└── NO
    Can contracts be extracted from existing internal classes?
    ├── YES → Extract contracts first, then re-evaluate extraction readiness
    └── NO → Module is coupled — extraction requires rewrite
```

### Rationale
Explicit contracts and database schema ownership are the two non-negotiable prerequisites for extraction readiness. Contracts define the API boundary; schema ownership ensures the module can operate independently. Without both, extraction requires a full rewrite.

### Recommended Default
Design modules as extraction-ready from the start

### Risks
- No contracts: all consumer code directly references internal classes
- Shared tables: impossible to split database without shared-schema coupling
- Partial readiness creates false confidence that extraction is possible

### Related Rules
- Design Modules as Extraction-Ready (MMD-01/05-rules.md)
- Use Contracts, Not Direct Imports (MMD-01/05-rules.md)
- Extract Only When Resource Requirements Diverge (MMD-01/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-01/06-skills.md)

---

## Decision 3: Enforce boundaries with architecture tests vs folder conventions only

### Context
Module boundaries that exist only as folder names provide zero runtime isolation. Developers take shortcuts — importing models across modules, accessing foreign tables, creating circular dependencies. Architecture tests in CI are the only reliable enforcement mechanism.

### Decision Tree

```
Are architecture tests running in CI that prevent cross-module imports?
├── YES
│   Do tests also prevent cross-module database table access?
│   ├── YES → Strong enforcement — boundaries are real
│   └── NO → Partial enforcement — database coupling bypasses code-level isolation
└── NO
    Is static analysis (PHPStan) configured with module boundary rules?
    ├── YES → Medium enforcement — catches code-level violations at analysis time
    └── NO → Folder-only boundaries — no real isolation; degradation guaranteed
```

### Rationale
Folder conventions are aspirational; enforcement is mechanical. Architecture tests (Pest) combined with PHPStan rules catch boundary violations at two levels: runtime (tests) and analysis time (static analysis). Database-level enforcement prevents the most common coupling anti-pattern (cross-module table access).

### Recommended Default
Architecture tests + PHPStan rules + database enforcement

### Risks
- No enforcement: module boundaries degrade into a distributed monolith
- Code-only enforcement: database coupling bypasses code-level rules
- Tests not in CI: violations are discovered too late or never

### Related Rules
- Enforce Boundaries as Runtime Constraints (MMD-01/05-rules.md)
- Design Modules as Extraction-Ready (MMD-01/05-rules.md)
- Rule: Respect 100-1000x Latency Difference (MMD-01/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-01/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
