# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module dependency management and versioning
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Module dependency management tracks which modules depend on which other modules and enforces that dependencies are acyclic and well-documented. In a monorepo, module versioning is typically synchronized (one version for the entire application). The key practices are: maintain a dependency graph, prevent circular dependencies, and declare dependencies explicitly in each module's metadata (like `module.json`). Dependency management is what prevents the modular monolith from degrading into a "big ball of mud."

---

# Core Concepts

**Dependency direction:** If Module A depends on Module B (uses its contracts or events), the arrow goes A → B. Dependencies should follow the direction of business significance: volatile modules depend on stable modules.

**Circular dependency:** Module A depends on Module B, which depends on Module A. This is forbidden in a modular monolith. Resolve by extracting shared contracts or introducing events.

**Explicit dependency declaration:** Each module declares what it depends on. This creates a visible, analyzable dependency graph.

---

# Mental Models

**The "Acyclic Graph" model:** Module dependencies form a directed acyclic graph (DAG). If you can trace a cycle, the architecture is broken.

**The "Dependency as Cost" model:** Every dependency a module has is a cost. It makes the module harder to extract, harder to test in isolation, and more coupled to changes in the depended-on module.

**The "Stable Dependencies Principle" model:** Modules should depend on things that are more stable than themselves. Dependent-upon modules (like Shared) should be the most stable; leaf modules (like Billing) can be less stable.

---

# Internal Mechanics

Dependency declaration in `module.json`:
```json
{
    "name": "Catalog",
    "version": "1.0.0",
    "depends": ["Shared"],
    "priority": 10
}
```

Automated enforcement tools:
```bash
modulate:check-dependencies  # Scans imports and validates dependency declarations
```

Visualization:
```bash
modulate:graph  # Generates a dependency graph (Mermaid, DOT)
```

---

# Patterns

**Layer-based module dependencies:** Modules can depend on modules below them in a dependency hierarchy. `Billing` depends on `Shared`. `Orders` depends on `Billing`. The hierarchy prevents cycles.

**Dependency direction enforcement:** PHPStan rules or architecture tests ensure Module A doesn't import from Module B unless declared as a dependency.

**Dependency health metrics:** Track the number of dependencies per module. A module with 5+ dependencies is a candidate for splitting or redesign.

---

# Architectural Decisions

**Allow dependency when:** The depended-on module provides a stable contract that the dependent needs. The dependency direction follows business logic.

**Forbid dependency when:** It creates a cycle, the dependency is on internal (non-contract) classes, or the same result can be achieved via events.

**Extract module when:** A module has many dependencies. High dependency count suggests the module has too many responsibilities.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear understanding of module coupling | Dependency tracking is manual work | module.json must be maintained |
| Cycle prevention keeps architecture clean | Dependency analysis requires tooling | Without tools, dependencies degrade silently |
| Extraction readiness (know what depends on what) | Documentation effort for dependency declarations | Team must update deps when adding imports |

---

# Performance Considerations

No direct performance impact. Dependency analysis runs offline during CI.

---

# Production Considerations

Run dependency checks in CI. Block PRs that introduce circular dependencies or undeclared dependencies.

---

# Common Mistakes

**Undeclared dependencies:** Module A imports Module B without declaring the dependency in `module.json`. The dependency exists but is undocumented.

**Circular dependencies via events:** Module A dispatches an event that Module B listens to, and Module B dispatches an event that Module A listens to. This creates behavioral dependency even if not a code import dependency.

**Too many dependencies tolerated:** A module with 8+ dependencies becomes a god module. Reduce by splitting or using events.

---

# Failure Modes

**Circular dependency discovered late:** A seemingly harmless import creates a cycle that only manifests during specific features. Automated checks catch this in CI.

**Dependency graph too complex:** 15+ modules with dense cross-dependencies. The architecture has degraded to a distributed monolith within one codebase.

---

# Ecosystem Usage

The `Modulate` package includes `modulate:check-dependencies` and `modulate:graph`. The `nwidart/modules` package supports dependency declarations in `module.json`.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-06 Sync inter-module comm | MMD-08 Shared kernel | MMD-11 Module extraction |
| MMD-07 Async inter-module comm | MMD-12 Isolation enforcement | MMD-17 Modular vs microservices |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
