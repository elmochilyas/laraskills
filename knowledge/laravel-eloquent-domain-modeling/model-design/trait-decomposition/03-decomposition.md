# Decomposition: Trait Decomposition

## Boundary Analysis

### In Scope
- The Eloquent boot trait convention: `boot{TraitName}()`
- The Eloquent initialize trait convention: `initialize{TraitName}()`
- Execution order of boot/initialize methods (trait declaration order)
- Trait method conflict resolution (`insteadof`, `as`)
- Property naming and conflict avoidance in traits
- Spatie package trait conventions (`Has*`, `InteractsWith*` naming)
- Boot/initialize vs. attribute-based registration

### Out of Scope
- PHP trait syntax, `use` statement mechanics (assumed prerequisite knowledge)
- Specific trait implementations (SoftDeletes, HasMedia, HasRoles) — referenced as examples only
- The internal `class_uses_recursive()` implementation details
- Event listener lifecycle (what happens inside `created`, `updated` callbacks) — covered in Eloquent Events subdomain
- Global scope implementation (how scopes modify queries) — covered in Querying / Scopes subdomain
- Serialization concerns with trait properties — mentioned but not detailed; covered in Queue / Serialization subdomain
- Attribute-based registration (`#[ObservedBy]`, `#[ScopedBy]`) — covered in **Attribute Registration**; this KU covers the trait approach

### Overlap Analysis
This KU overlaps with **Attribute Registration** at the boundary of how observers and scopes are registered — this KU covers the *traditional* boot/initialize trait approach, while Attribute Registration covers the *newer* PHP 8 attribute approach. Both registration mechanisms coexist in modern Laravel; this KU presents the trait approach while the other covers attributes. The overlap is intentional and documented in both KUs as alternative approaches. This KU also overlaps with **Base Model Class** at the boot/initialize lifecycle explanation, but this KU goes deeper into trait-specific mechanics (execution order, conflict resolution).

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
The boot/initialize convention is a single, cohesive pattern that applies uniformly across all Eloquent traits. Splitting "boot method convention" from "initialize method convention" would create two KUs that share the same `class_uses_recursive()` resolution mechanism, same execution-order concerns, and same conflict-resolution patterns. The Spatie naming conventions are an extension of the same boot/initialize protocol and would be weakened if separated.

---

## Dependency Graph

```
PHP Traits (syntax, conflict resolution)
  └── Base Model Class (boot/initialize lifecycle)
        └── Trait Decomposition
              ├── Attribute Registration (alternative to trait boot methods)
              ├── Event Lifecycle (consumed by boot methods)
              ├── Global Scopes (registered via boot methods)
              └── Third-Party Package Traits (Spatie, Scout, etc.)
```

---

## Follow-up Opportunities

1. **Trait Contract Pattern** — A KU on defining trait contracts (interfaces that traits implicitly implement) and static analysis rules that verify a model using a trait also implements the required contract.
2. **Trait Performance Benchmarking** — A measurement-focused KU on the overhead of trait boot/initialize execution, `class_uses_recursive()` cost, and event listener registration from traits — including optimisation strategies for trait-heavy models.
3. **Migrating Traits to Attributes** — A practical KU covering how and when to migrate from trait-based registration (e.g., `HasCollection` trait) to attribute-based registration (`#[CollectedBy]`), including codebase-wide migration strategies and mixed-version support.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization