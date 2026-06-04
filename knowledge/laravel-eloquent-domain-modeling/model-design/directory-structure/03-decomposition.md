# Decomposition: Directory Structure

## Boundary Analysis

### In Scope
- Model file placement within `app/Models/` and subdirectories
- PSR-4 autoloading namespace alignment with directory paths
- Domain-grouped, flat, and directory-per-model organisational patterns
- Artisan `make:model` command behaviour with subdirectory paths
- Adjacent file placement (factories, policies, resources, form requests) in matching subdirectories
- Naming conventions for subdirectories (singular vs. plural, case conventions)
- Team workflow impact of directory structure choices

### Out of Scope
- Migration file organisation in `database/migrations/` — covered in Database / Migrations subdomain
- View organisation in `resources/views/` — not Eloquent-specific
- Controller organisation in `app/Http/Controllers/` — not Eloquent-specific
- Module/package organisation patterns for Laravel packages — covered in Package Development subdomain
- Hexagonal architecture or DDD folder structure beyond `app/Models/` — separate architectural concern
- The internal `ModelMakeCommand` implementation details in the Laravel framework

### Overlap Analysis
This KU has minimal overlap with other model-design KUs — directory structure is an orthogonal concern. It intersects marginally with **Model Conventions** (both deal with naming/organisation) but conventions are about *table naming* while directory structure is about *file organisation*. The two are independent. This KU also provides context for **Base Model Class** (the file where the base model lives) but does not duplicate any content.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
Directory structure is a single, self-contained concern — how model files are arranged on disk. Splitting into "flat structure" vs. "grouped structure" would create two KUs that each re-explain PSR-4 autoloading, artisan command usage, and namespace alignment. The comparison between patterns is the core value of this KU, and splitting would lose that comparative dimension.

---

## Dependency Graph

```
Laravel Directory Structure (general app/ layout)
  └── PSR-4 Autoloading (Composer)
        └── Directory Structure
              ├── Model Conventions (orthogonal — both naming concerns)
              ├── Base Model Class (determines where base model file lives)
              └── Module-Based Application Structure (advanced follow-up)
```

---

## Follow-up Opportunities

1. **Module-Based Model Organisation** — A KU covering model organisation within Laravel modules (nwidart/laravel-modules, custom module systems), including cross-module relationships and namespacing strategies.
2. **Hexagonal Architecture with Eloquent** — A KU on keeping Eloquent models inside the infrastructure/adapter layer while maintaining domain entities in a separate directory, covering mapping strategies and repository patterns.
3. **Monorepo Model Management** — A KU on managing model files across multiple applications within a single monorepo, including shared models, namespace isolation, and autoloading configuration.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization