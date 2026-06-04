# Decomposition: Attribute Registration

## Boundary Analysis

### In Scope
- All five model-specific PHP 8 attributes: `#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseFactory]`, `#[UseEloquentBuilder]`
- How attributes are resolved: the `resolveAttributes()`, `resolveCallback()`, `resolveFactory()` internal methods
- Attribute registration vs. traditional boot-method registration
- PHP attribute inheritance behaviour on model classes
- The relationship between attributes and the `HasCollection` / `HasBuilder` traits

### Out of Scope
- General PHP 8 attribute syntax and Reflection API (assumed prerequisite knowledge)
- Custom attributes that models do not natively resolve (e.g., `#[Route]`, `#[Validate]`)
- The observer lifecycle (creating, created, updating, updated) — covered in Eloquent Events subdomain
- Global scope implementation (how scopes modify queries) — covered in Querying / Scopes subdomain
- Custom collection and builder class design patterns (extending `EloquentCollection`, `EloquentBuilder`)
- Factory configuration (`HasFactory` trait, factory states) — covered in Testing / Factories subdomain
- `#[Replicate]`, `#[FindBy]`, or any non-standard attributes from third-party packages

### Overlap Analysis
This KU overlaps with **Trait Decomposition** at the boundary: historically, custom collections were registered via a `HasCollection` trait, and custom builders via `HasBuilder`. This KU covers the *attribute approach*, while Trait Decomposition covers the *trait approach*. The overlap is intentional — both KUs reference the same capabilities from different implementation perspectives. This KU also touches marginally on observer registration, which is covered in depth in the Eloquent Events subdomain, but only from the *registration mechanism* perspective.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
The five attributes share a single resolution mechanism (`resolveAttributes()` in `HasAttributes`). Splitting them would require each KU to re-explain the same reflection-based resolution pattern. The attributes are also typically used together or interchangeably with trait-based approaches, so presenting them as a unified system is more coherent for readers.

---

## Dependency Graph

```
PHP 8 Attributes (general syntax, ReflectionClass)
  └── Base Model Class (initialisation flow)
        └── Attribute Registration
              ├── Observer Pattern in Eloquent (what #[ObservedBy] triggers)
              ├── Global Scopes (what #[ScopedBy] triggers)
              ├── Custom Collections (what #[CollectedBy] triggers)
              ├── Custom Builders (what #[UseEloquentBuilder] triggers)
              ├── Factory Configuration (what #[UseFactory] triggers)
              └── Trait Decomposition (alternative approach for same problem)
```

---

## Follow-up Opportunities

1. **Custom Model Attributes** — A KU on creating custom PHP 8 attributes that the `Model` class resolves during initialisation. Covers how to hook into `resolveAttributes()`, the `RegistersAttributes` trait pattern, and community conventions for custom attributes.
2. **Trait vs. Attribute Migration Guide** — A practical KU covering how to migrate from trait-based registration (`HasCollection`, `HasBuilder`) to attribute-based registration, including mixed-version codebases that must support both approaches.
3. **Attribute Inheritance in Model Hierarchies** — A focused KU on how PHP 8 attribute inheritance (`#[Attribute(\Attribute::TARGET_CLASS | \Attribute::IS_REPEATABLE)]`) interacts with Eloquent model hierarchies, single-table inheritance, and polymorphic relationships.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization