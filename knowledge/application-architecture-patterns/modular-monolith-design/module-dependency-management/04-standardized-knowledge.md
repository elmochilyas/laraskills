# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module dependency management and versioning
Knowledge Unit ID: MMD-09
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Module dependency management tracks which modules depend on which other modules and enforces acyclic dependencies. In a monorepo, module versioning is typically synchronized (one version for the application). Key practices: maintain a dependency graph, prevent circular dependencies, declare dependencies explicitly in each module's metadata (`module.json`). Dependency management prevents the modular monolith from degrading into a "big ball of mud."

---

# Core Concepts

- **Dependency direction**: If Module A depends on Module B (uses its contracts or events), arrow goes A → B. Dependencies follow business significance: volatile → stable.
- **Circular dependency**: Module A depends on B, which depends on A. Forbidden. Resolve by extracting shared contracts or introducing events.
- **Explicit dependency declaration**: Each module declares dependencies in `module.json`. Creates visible, analyzable dependency graph.
- **Stable Dependencies Principle**: Depend on things more stable than yourself. Shared kernel most stable; leaf modules less stable.

---

# When To Use

- Always — every modular monolith needs explicit dependency management from day one.

---

# When NOT To Use

- System with fewer than 3 modules (explicit tracking overhead not justified).

---

# Best Practices

- **Declare all dependencies explicitly in `module.json`.** WHY: Undeclared dependencies are invisible coupling — the dependency exists but isn't documented or enforced.
- **Run dependency checks in CI.** WHY: Without automated enforcement, dependencies silently degrade over time.
- **Block PRs that introduce circular dependencies.** WHY: Circular dependencies are the primary symptom of architectural degradation.
- **Keep dependencies per module under 5.** WHY: A module with 5+ dependencies is a candidate for splitting or redesign.
- **Use events to break dependency cycles.** WHY: Events invert dependency direction — publisher has no dependency on subscriber.

---

# Architecture Guidelines

- Dependency graph must be a directed acyclic graph (DAG).
- Module priority in `module.json` determines service provider boot order.
- Visualize the dependency graph regularly (generate Mermaid or DOT output).
- Treat dependency count as a health metric — trend it over time.

---

# Performance Considerations

- Dependency analysis runs during CI. No runtime performance impact.

---

# Security Considerations

- No direct security implications. Dependency tracking is purely architectural.

---

# Common Mistakes

1. **Undeclared dependencies:** Module A imports Module B without declaring in `module.json`. Cause: developer unaware of dependency tracking. Consequence: undocumented coupling. Better: enforce with CI checks.

2. **Circular dependencies via events:** Module A listens to B's events and B listens to A's events. Cause: behavioral coupling not caught by import checks. Consequence: logical cycle even without code cycle. Better: audit event subscription graph.

3. **Too many dependencies tolerated:** Module with 8+ dependencies becomes a god module. Cause: no dependency limit policy. Consequence: module can't be extracted or tested in isolation. Better: split or use events.

---

# Anti-Patterns

- **Distributed monolith within one codebase**: 15+ modules with dense cross-dependencies. The architecture has degraded.
- **Dependency graph not maintained**: `module.json` is outdated — actual imports don't match declarations.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-06 Sync inter-module comm | MMD-08 Shared kernel | MMD-11 Module extraction |
| MMD-07 Async inter-module comm | MMD-12 Isolation enforcement | MMD-17 Modular vs microservices |

---

# AI Agent Notes

- Always generate `module.json` with dependencies field when scaffolding modules.
- Default dependency limit of 5 per module. Flag modules exceeding it.
- Generate dependency visualization regularly.

---

# Verification

- [ ] All module dependencies declared in `module.json`
- [ ] Dependency graph is acyclic
- [ ] CI blocks circular/undeclared dependencies
- [ ] No module has 5+ dependencies
- [ ] Dependency visualization is current
