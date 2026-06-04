# Decomposition: Primitive Casts

## Boundary Analysis
Primitive casts cover the built-in type coercion casts: `int`, `bool`, `float`, `string`, `array`, `object`, `collection`, and `decimal:N`. It includes the cast resolution, JSON serialization/deserialization, and storage format conversion. It does not cover date/time casts, enum casts, encrypted casts, hashed casts, custom casts, or accessor/mutator patterns.

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The primitive cast system is a unified mechanism — cast by type string, resolve inline or via class, apply on read/write. Further decomposition would separate tightly coupled behavior.

## Dependency Graph
```
Primitive Casts
  ├── depends on: Model $casts property definition
  ├── depends on: JSON encoding/decoding (for array/object/collection)
  ├── related to: Accessor Patterns (accessors run after cast get)
  ├── related to: Mutator Patterns (mutators run before cast set)
  ├── enabled by: Date/Time Casts (specialized, not primitive)
  ├── enabled by: Enum Casts (specialized, not primitive)
  └── overlaps: Collection Casts (AsCollection is a specialized variant)
```

## Follow-up Opportunities
- **Union type casts:** Casting a JSON column to a PHP union type (e.g., `int|string`) for stricter runtime type enforcement.
- **Read-only casts:** A cast that applies only on read (get) and not on write (set) — useful for computed database columns.
- **Strict cast mode:** An option to throw exceptions on cast failure instead of silently returning null/default values.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization