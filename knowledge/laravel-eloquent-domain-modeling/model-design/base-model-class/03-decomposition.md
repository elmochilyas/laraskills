# Decomposition: Base Model Class

## Boundary Analysis

### In Scope
- The `Illuminate\Database\Eloquent\Model` class as the parent of all application models
- Mass assignment protection mechanisms (`$fillable`, `$guarded`, `forceCreate`)
- Default attribute values via `$attributes` property
- Connection routing via `$connection`
- Timestamp column convention and customisation (`CREATED_AT`, `UPDATED_AT`)
- Dynamic property access and the `__get`/`__set` chain
- Common patterns: custom base model, force create

### Out of Scope
- Specific model configuration properties (`$table`, `$primaryKey`, `$keyType`, `$incrementing`) — covered in **Model Configuration Properties**
- PHP 8 attribute registration (`#[ObservedBy]`, etc.) — covered in **Attribute Registration**
- Strict mode settings — covered in **Strict Mode Configuration**
- Relationship definitions and resolution
- Query builder integration (`Builder` class)
- Serialisation (`toArray`, `toJson`, `jsonSerialize`)
- Event lifecycle (covered in Eloquent Events subdomain)
- Trait conventions for model decomposition — covered in **Trait Decomposition**

### Overlap Analysis
This KU intersects with **Model Configuration Properties** at `$connection`, `$table`, and key type configuration, but this KU focuses on the *base class mechanism* while the other focuses on the *individual property semantics*. The boundary is drawn at the level of abstraction: this KU explains *how* the base class works, while Model Configuration Properties explains *what each property does*.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
The base Model class is a single, cohesive concept — every application model directly or indirectly extends it. The mass-assignment, timestamp, and connection features are all internal mechanisms of the same class. Splitting would create artificial boundaries (e.g., separating "mass assignment" from "base model" would require cross-reference duplication). The related configuration properties are cleanly deferred to their own KU.

---

## Dependency Graph

```
PHP OOP (inheritance, traits, magic methods)
  └── Base Model Class
        ├── Model Configuration Properties (sibling KU)
        ├── Strict Mode Configuration (sibling KU — builds on fillable/guarded)
        ├── Attribute Registration (sibling KU — uses base Model foundation)
        ├── Trait Decomposition (depends on understanding Model class mechanics)
        └── Directory Structure (orthogonal — organisational concern)
```

---

## Follow-up Opportunities

1. **Custom Base Model Patterns** — A focused KU on multi-tenancy base models, organisation-wide base model conventions, and abstract model hierarchies (e.g., `PublishableBase`, `OwnedBase`).
2. **Mass Assignment Security Audit** — A cross-cutting concern KU covering how to audit and harden mass-assignment across a large codebase, including relationship creation through nested attributes.
3. **Eloquent Attribute Resolution** — A deeper dive into `getAttribute` / `setAttribute` internals, accessor/mutator registration, and the relationship resolver chain. Currently partially covered here and partially in the Accessors & Mutators subdomain.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization