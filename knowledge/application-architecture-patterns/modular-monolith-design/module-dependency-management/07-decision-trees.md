# Decision Trees: Module Dependency Management and Versioning

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module dependency management and versioning
- **Knowledge Unit ID:** MMD-09
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Explicit `module.json` declarations vs implicit dependencies | Architecture | Module creation |
| 2 | Break circular dependency via events vs extract shared contracts | Architecture | Cycle detection |
| 3 | Dependency count threshold: split vs tolerate | Architecture | Module health |

---

## Decision 1: Explicit `module.json` declarations vs implicit dependencies

### Context
Every module should declare its dependencies in a `module.json` file. Undeclared dependencies are invisible coupling — the import exists but is undocumented and unenforced. CI must validate that declared dependencies match actual imports and block undeclared ones.

### Decision Tree

```
Does the system have 3 or more modules?
├── YES
│   Does each module have a module.json with declared dependencies?
│   ├── YES
│   │   Do CI checks validate declarations against actual imports?
│   │   ├── YES → Strong enforcement — dependencies are visible and accurate
│   │   └── NO → Partial — module.json exists but may be outdated
│   └── NO → Undocumented coupling — create module.json and add CI validation
└── NO (<3 modules) → module.json overhead may not be justified
```

### Rationale
Without explicit declarations, dependencies exist but are invisible. A developer adding an import across modules creates coupling without anyone knowing. CI validation is the enforcement mechanism — it catches undeclared dependencies before they merge. The dependency graph is only as good as the declarations.

### Recommended Default
Every module has `module.json` with CI validation for systems with 3+ modules

### Risks
- No `module.json`: undocumented coupling grows silently
- Outdated `module.json`: declarations don't match actual imports — false sense of control
- No CI validation: developers forget to update `module.json` — declarations drift

### Related Rules
- Declare Dependencies in module.json (MMD-09/05-rules.md)
- Enforce Acyclic Graph (MMD-09/05-rules.md)
- Run Dependency Checks in CI (MMD-09/05-rules.md)
- Visualize Dependency Graph (MMD-09/05-rules.md)

### Related Skills
- Manage Module Dependencies and Versioning (MMD-09/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)

---

## Decision 2: Break circular dependency via events vs extract shared contracts

### Context
Circular dependencies are forbidden in a modular monolith. The dependency graph must be a DAG. Two strategies to resolve cycles: events (invert dependency direction) or extract shared contracts (move shared abstraction to a neutral module). The choice depends on the nature of the cycle.

### Decision Tree

```
Is the cycle between modules that both need a common concept?
├── YES (A needs B's concept, B needs A's concept — different concepts)
│   Can the concept needed by both be extracted to a shared module?
│   ├── YES → Extract shared contracts to a neutral third module or shared kernel
│   └── NO → Redesign boundaries — these modules may need merging
└── NO (one-way dependency but behavioral coupling creates a logical cycle)
    → Use events to invert the dependency direction
    Does the cycle result from A calling B and B calling A's listener?
    ├── YES → Events + idempotency break the behavioral cycle
    └── NO → Design issue — revisit module boundaries
```

### Rationale
Shared contract extraction is cleaner when both modules genuinely need a common abstraction. Events are better when the cycle is behavioral (A triggers B, B triggers A). Events invert the dependency — the publisher has no import dependency on the subscriber. If neither strategy works, the module boundaries are wrong and should be revisited.

### Recommended Default
Events to break cycles by inverting dependency direction

### Risks
- Events for shared concepts: hides the real coupling behind event subscription
- Shared contract extraction for behavioral cycles: doesn't solve the logical loop
- Neither works: modules are likely the wrong abstraction — merge or redefine

### Related Rules
- Enforce Acyclic Graph (MMD-09/05-rules.md)
- Use Events to Break Cycles (MMD-09/05-rules.md)
- Keep Dependencies Under 5 (MMD-09/05-rules.md)
- Depend on More Stable Modules (MMD-09/05-rules.md)

### Related Skills
- Manage Module Dependencies and Versioning (MMD-09/06-skills.md)
- Manage Async Inter-Module Communication (MMD-07/06-skills.md)
- Manage Sync Inter-Module Communication (MMD-06/06-skills.md)

---

## Decision 3: Dependency count threshold: split vs tolerate

### Context
A module with 5+ direct dependencies on other modules is a candidate for splitting or redesign. High dependency count correlates with low cohesion and high change impact. Tracking dependency count as a health metric prevents architectural degradation.

### Decision Tree

```
How many direct dependencies does this module have?
├── 0-2 → Healthy — module is focused and independent
├── 3-4 → Acceptable — monitor for growth
├── 5-7 → Warning — candidate for redesign
│   Does the module have high cohesion (single responsibility)?
│   ├── YES → May be acceptable if dependencies are on stable modules only
│   └── NO → Split module into smaller, more focused modules
└── 8+ → Red alert — god module
    → Must split or redesign immediately
```

### Rationale
A module with many dependencies becomes a coupling hub — changes to any of its dependencies may affect it, and extracting it requires extracting the entire dependency cluster. The 5-dependency threshold is a warning sign, not a hard limit. A module with 5 dependencies on stable core modules is healthier than one with 3 dependencies on volatile modules.

### Recommended Default
Alert at 5 dependencies; force action at 8+

### Risks
- Tolerating 5+ dependencies: module becomes increasingly coupled and un-extractable
- Splitting prematurely: excessive module fragmentation (10+ small modules is also a problem)
- Not monitoring trend: gradual dependency creep goes undetected

### Related Rules
- Keep Dependencies Under 5 (MMD-09/05-rules.md)
- Declare Dependencies in module.json (MMD-09/05-rules.md)
- Enforce Acyclic Graph (MMD-09/05-rules.md)
- Visualize Dependency Graph (MMD-09/05-rules.md)

### Related Skills
- Manage Module Dependencies and Versioning (MMD-09/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
