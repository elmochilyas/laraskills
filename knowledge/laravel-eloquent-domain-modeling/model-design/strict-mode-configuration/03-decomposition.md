# Decomposition: Strict Mode Configuration

## Boundary Analysis

### In Scope
- The three Eloquent strict mode protections: `preventLazyLoading`, `preventSilentlyDiscardingAttributes`, `preventAccessingMissingAttributes`
- The `shouldBeStrict()` convenience method
- Registration pattern (typically in `AppServiceProvider::boot()`)
- Per-environment strict mode configuration
- Exception types: `LazyLoadingViolationException`, `MassAssignmentException`, `AccessingMissingAttributeException`

### Out of Scope
- N+1 query detection via Telescope, Debugbar, or query logging tools — covered in Observability subdomain
- Eager-loading strategies and relationship loading best practices — covered in Relationships subdomain
- Mass-assignment fillable/guarded configuration (the *why*, not the *prevention*) — covered in **Base Model Class**
- Static analysis rules (Larastan, PHPStan) that detect lazy loading — covered in Tooling / Static Analysis subdomain
- Application-level validation (request validation, form requests) — covered in Validation subdomain
- The `Model::preventAccessingMissingAttributes()` interaction with `$model->offsetExists()` and ArrayAccess

### Overlap Analysis
This KU overlaps with **Base Model Class** at the fillable/guarded mechanism — strict mode's `preventSilentlyDiscardingAttributes` is an *add-on* to the fillable system, while the fillable system itself is covered in **Base Model Class**. The overlap is one-directional: Base Model Class explains the fillable mechanism; this KU explains how strict mode makes it fail-fast. The relationship to **Attribute Registration** is minimal — strict mode is a runtime behaviour setting, not a configurable model property.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
The three protections are always discussed together, are enabled together, and share a single convenience method. They represent a unified "strict mode" concept with three facets. Splitting them would force each KU to explain the same registration pattern, environment configuration strategy, and tradeoff analysis three times.

---

## Dependency Graph

```
Base Model Class (fillable/guarded mechanism, attribute resolution)
  └── Strict Mode Configuration
        ├── Relationships (eager-loading strategies mitigate preventLazyLoading)
        ├── Observability / Debugging (Telescope, Debugbar for N+1 detection)
        ├── Testing / Test Coverage (tests must trigger violations to catch them)
        └── Static Analysis (Larastan rules complement runtime strict mode)
```

---

## Follow-up Opportunities

1. **Application-Level Strict Mode Rules** — A KU on extending Eloquent's strict mode with application-specific protections (e.g., "prevent creating models without required relationship IDs", "prevent soft-deleted model access without `withTrashed()`").
2. **Strict Mode Migration Playbook** — A practical guide for migrating a legacy Laravel codebase to strict mode, including violation discovery, fix prioritisation, relationship audit techniques, and phased rollout strategies.
3. **Strict Mode in Queue Jobs** — A focused KU on strict mode behaviour in queue workers, including serialisation/deserialisation of models, lazy loading in job handlers, and testing strategies for queued strict-mode violations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization