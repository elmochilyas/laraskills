# Decomposition: Model Configuration Properties

## Boundary Analysis

### In Scope
- All top-level model configuration properties: `$table`, `$connection`, `$primaryKey`, `$incrementing`, `$keyType`, `$timestamps`, `$dateFormat`, `CREATED_AT`, `UPDATED_AT`
- Primary key strategy comparison: auto-increment, UUID v4, ULID, UUID v7, custom string keys
- Property semantics: what each property controls and how it is consumed internally
- The `HasUuids` and `HasUlids` built-in traits
- Key type casting consistency

### Out of Scope
- The `$fillable` / `$guarded` mass-assignment properties — covered in **Base Model Class**
- The `$hidden` / `$visible` / `$casts` / `$appends` serialisation properties — covered in Serialisation subdomain
- The `$with` / `$withCount` relationship eager-loading properties — covered in Relationships subdomain
- The `$perPage` pagination property — covered in Querying / Pagination subdomain
- Strict mode properties (`preventLazyLoading`, etc.) — covered in **Strict Mode Configuration**
- Attribute registration properties (`$observers`, `$scopes`, etc.) — covered in **Attribute Registration**
- Trait-related configuration (`$booted` array, trait initialisation) — covered in **Trait Decomposition**

### Overlap Analysis
This KU intersects with **Base Model Class** at the `$connection` property and timestamp constants, but the split is clean: Base Model Class covers *how the base class uses these properties*, while this KU covers *the semantics of each property individually*. This KU also overlaps with **Attribute Registration** at the boundary of `$casts` — but `$casts` is deferred to the Serialisation subdomain (not in model-design), keeping the separation clean.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
All configuration properties serve the same purpose — they are the explicit configuration layer on top of conventions. Splitting "primary key properties" from "timestamp properties" from "connection properties" would create three KUs that each need to re-explain the convention-over-configuration concept. The primary key strategy comparison (auto-increment vs. UUID vs. ULID) is a single architectural decision that should be presented as a unit.

---

## Dependency Graph

```
Base Model Class
  └── Model Conventions (defaults that these properties override)
        └── Model Configuration Properties
              ├── Migration Schema Design (primary key column types must match)
              ├── UUID / ULID Strategies (performance follow-up)
              ├── Composite Primary Keys (advanced, speculative)
              └── Sharded Database Models (advanced, speculative)
```

---

## Follow-up Opportunities

1. **Primary Key Strategy Guide** — A decision flowchart and deep-dive KU covering when to choose auto-increment vs. UUID v4 vs. ULID vs. UUID v7, including benchmark data for index performance, storage size, and application-level complexity.
2. **Composite Primary Keys in Eloquent** — A workaround guide for tables with composite primary keys, covering `setKeysForSaveQuery`, `find` overrides, and pivot table support.
3. **Dynamic Connection Routing** — A KU on runtime connection resolution using `getConnectionName()`, shard routing strategies, and read-write split handling.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization