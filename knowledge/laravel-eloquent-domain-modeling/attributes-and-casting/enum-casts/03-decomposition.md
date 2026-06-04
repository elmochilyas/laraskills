# Decomposition: Enum Casts

## Boundary Analysis
Enum casts cover the conversion between PHP 8.1 enums (backed and unit) and database scalar values via `$casts`. It includes the `from()`/`tryFrom()` resolution, null handling, and the `AsEnumArrayObject`/`AsEnumCollection` JSON variants. It does not cover enum class design (methods, interfaces), state machine logic, database-level enum types, or enum serialization in API responses.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

Enum casting is a single type-mapping concern: database scalar ↔ PHP enum instance. Backed and unit variants differ slightly in implementation but share the same cast resolution path.

## Dependency Graph
```
Enum Casts
  ├── depends on: PHP 8.1+ enum feature
  ├── depends on: Model $casts resolution system
  ├── depends on: Primitive Casts (same $casts mechanism)
  ├── related to: Collection Casts (AsEnumArrayObject, AsEnumCollection)
  ├── related to: State Machine Pattern (enum casts as state)
  └── overlaps: Enum Serialization (serializing enum values for APIs)
```

## Follow-up Opportunities
- **Enum default value on read failure:** Configuring a fallback enum case when the DB value does not match any case, instead of returning null.
- **Database CHECK constraint generation:** Automatically generating a migration CHECK constraint from the enum cases array.
- **Enum transition validation cast:** A custom cast that validates state transitions (e.g., `pending → approved` allowed, but `approved → pending` forbidden).
- **Composite enum cast:** Mapping multiple DB columns to a single enum (e.g., combined status flags).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization