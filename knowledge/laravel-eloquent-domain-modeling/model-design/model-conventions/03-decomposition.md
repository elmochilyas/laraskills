# Decomposition: Model Conventions

## Boundary Analysis

### In Scope
- Default table name resolution (`getTable()`, `Str::pluralStudly`)
- Foreign key naming convention (`getForeignKey()`)
- Pivot table naming convention (alphabetical join)
- Model directory and file naming conventions
- Convention-over-configuration philosophy in Eloquent
- Explicit override strategies for all conventions

### Out of Scope
- Specific `$table`, `$primaryKey`, `$keyType` configuration property mechanics — covered in **Model Configuration Properties**
- Migration column naming conventions or schema builder defaults
- Relationship definition API (the `hasMany`, `belongsTo` methods themselves — covered in Relationships subdomain)
- Pluralisation rules and edge cases of the Symfony Inflector
- Internationalisation or locale-specific pluralisation

### Overlap Analysis
This KU shares ground with **Model Configuration Properties** at `$table` — conventions explains *the default* while configuration properties explains *the override*. The split is clean: conventions define defaults, configuration properties define explicit overrides. This KU also overlaps marginally with **Directory Structure**, but this KU focuses on *how conventions map class names to table names* while Directory Structure focuses on *file system organisation patterns*.

---

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

**Rationale:**
Model conventions are a single coherent concept: the set of naming defaults that Eloquent applies when explicit configuration is absent. Separating "table naming" from "foreign key naming" from "pivot naming" would create three half-sized KUs that all reference the same `Str::snake` / `Str::pluralStudly` mechanics. Keeping them together lets the reader see the full convention system at once.

---

## Dependency Graph

```
Base Model Class
  └── Model Conventions
        ├── Model Configuration Properties (overrides the conventions)
        ├── Directory Structure (sibling — organisational conventions)
        ├── Relationships subdomain (consumes foreign key and pivot conventions)
        └── Migrations subdomain (convention alignment between schema and models)
```

---

## Follow-up Opportunities

1. **Legacy Database Integration** — A dedicated KU on mapping Eloquent conventions to non-standard, pre-existing schemas. Covers explicit `$table`, `$primaryKey`, composite key workarounds, and view-backed models.
2. **Pluralisation and Internationalisation** — Deep dive into Symfony Inflector edge cases, irregular plurals, non-English language pluralisation, and how to override the pluraliser globally.
3. **Convention Auditing Tools** — A tooling KU covering `php artisan model:show`, custom artisan commands, and static analysis rules (PHPStan, Larastan) for enforcing explicit `$table` declarations.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization