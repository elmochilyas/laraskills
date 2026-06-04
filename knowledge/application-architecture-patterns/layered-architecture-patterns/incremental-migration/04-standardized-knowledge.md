# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Incremental migration from MVC to layered architecture
Knowledge Unit ID: LAP-12
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Migrating from Laravel's default MVC to layered architecture (Clean/Hexagonal) is best done incrementally, not as a big-bang rewrite. The path follows: extract services (thin controllers) → add actions (isolate operations) → introduce interfaces (decouple from framework) → restructure into layers (domain, application, infrastructure). Each step provides standalone benefit and can be stopped when cost/benefit is met.

---

# Core Concepts

Four migration phases:
1. **Controller thinning**: Extract business logic into Service classes. Lowest-cost, highest-value first step.
2. **Action isolation**: Break Services into single-purpose Action classes. Prevents god services.
3. **Interface introduction**: Add interfaces where variation exists. Enables dependency inversion.
4. **Full restructuring**: Move code into Domain/Application/Infrastructure with strict dependency rules.

---

# When To Use

- Existing Laravel application growing beyond simple MVC
- Controllers are fat and untestable
- Services are becoming god objects
- Testing requires mocking but no abstraction layer exists
- Business logic is complex enough to warrant framework separation

---

# When NOT To Use

- Application is stable and not growing
- Team has no time or motivation for migration
- Simple CRUD with minimal business logic
- No concrete pain from current architecture

---

# Best Practices

- **Use the Strangler Fig pattern** — new code in new structure, old code stays. Gradual strangulation. WHY: At any point, you can stop and both structures coexist. No big-bang risk.
- **Stop at any phase** when cost exceeds benefit. WHY: Phase 1 (services) alone solves fat controllers. Phase 2 (actions) prevents god objects. Don't proceed to Phase 4 unless justified.
- **Migrate feature-by-feature**, not file-by-file. WHY: A feature touched for development gets migrated. Untouched features stay in old structure until needed. This is the Boy Scout Rule applied to architecture.
- **Use adapters as glue** between old and new code. WHY: Adapter classes bridge old Laravel-idiomatic code to new layer-architected code without breaking existing functionality.
- **Enforce new structure strictly from the start.** WHY: Allowing old-pattern violations in new directories because "it's just this one time" leads to contaminated architecture.

---

# Architecture Guidelines

- Parallel structure: Keep old `app/` and add `src/Domain/`, `src/Application/`, `src/Infrastructure/`. Both PSR-4 roots work simultaneously.
- Architecture tests should only enforce on migrated directories — old `app/` has relaxed rules.
- Document current migration phase prominently — new developers need to know which architecture to follow.
- The 80/20 rule applies: the last 20% of migration is the hardest. Recognize when to stop.

---

# Performance Considerations

- During migration, two structures coexist with different performance profiles.
- Old pattern (Eloquent direct) is faster to write; new pattern (mapping layer) has overhead.
- No significant runtime performance difference for end users.

---

# Security Considerations

- Migration does not change security boundaries — ensure access controls are preserved during restructuring.
- Verify authorization logic is correctly ported when moving code between layers.

---

# Common Mistakes

1. **Big-bang rewrite:** Migrating everything at once. Cause: desire for clean break. Consequence: application broken for weeks, features blocked, enormous regression risk. Better: incremental strangler fig.

2. **Deciding Phase 4 on day one:** Committing to full Clean Architecture before experiencing justifying pain. Cause: architectural ambition. Consequence: over-engineering for the actual problem. Better: stop at each phase and evaluate.

3. **Inconsistent enforcement:** Allowing old-pattern violations in new directories. Cause: "just this once." Consequence: new layers contaminated. Better: strict enforcement from the start.

4. **Permanent half-migration:** Application stays at Phase 2 because Phase 3/4 never justified. Cause: no conscious stopping decision. Consequence: uncertainty about future direction. Better: document intentional stopping point.

---

# Anti-Patterns

- **Architecture lip service**: Directories renamed to `Domain/` but code imports Eloquent everywhere. Structure says Clean Architecture, code says MVC.
- **Boy Scout rule violation**: Touching a feature for a bug fix but not migrating it — the feature degrades relative to migrated ones.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-14 Clean Architecture tradeoffs | AEG-09 Refactoring remediation |
| LAP-02 Clean Architecture | SLP-03 Controller thinning | DBC-08 Evolutionary boundaries |

---

# AI Agent Notes

- When migrating existing code, generate new code in the target architecture while respecting existing patterns for untouched code.
- Recognize the migration phase and generate code consistent with it.
- Never suggest big-bang rewrites — always incremental migration.

---

# Verification

- [ ] Current migration phase is documented
- [ ] Old and new structures coexist with clear boundaries
- [ ] Architecture tests enforce new structure rules
- [ ] Each feature migration includes equivalent test coverage
- [ ] Stopping point for each phase is evaluated against cost/benefit
