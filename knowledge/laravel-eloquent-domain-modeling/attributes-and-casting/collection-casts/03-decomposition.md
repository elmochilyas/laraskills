# Decomposition: Collection Casts

## Boundary Analysis
Collection casts cover the six JSON-to-PHP wrapper casts: `AsArrayObject`, `AsEncryptedArrayObject`, `AsCollection`, `AsEncryptedCollection`, `AsEnumArrayObject`, and `AsEnumCollection`. It includes JSON serialization, encryption integration, enum mapping, and dirty detection for mutable collection attributes. It does not cover plain `array`/`object`/`collection` primitive casts, the general Collection API, or encryption infrastructure.

## Atomicity Assessment
**Status:** ⚡ Splittable into two sub-units

The six cast types naturally split into two groups: the mutable collection wrappers (`AsArrayObject`, `AsCollection`, and their encrypted variants) which handle general-purpose JSON data with mutation tracking, and the enum-typed variants (`AsEnumArrayObject`, `AsEnumCollection`) which add enum mapping on top. These could be separated, but the overlap in JSON handling and dirty detection makes the current grouping pragmatic.

## Dependency Graph
```
Collection Casts
  ├── depends on: json_encode / json_decode
  ├── depends on: Model $casts resolution system
  ├── extends: Primitive Casts (AsCollection extends collection primitive)
  ├── combines: Encrypted Casts (AsEncrypted variants)
  ├── combines: Enum Casts (AsEnum variants)
  ├── related to: Accessor Patterns (accessors on collection-cast attrs)
  └── related to: Model Dirty Detection (collection mutation tracking)
```

## Follow-up Opportunities
- **Immutable collection cast:** A `Collection::make($array)->toImmutable()` variant that prevents mutation and returns a new collection on each operation.
- **Paginated collection cast:** Casting a JSON array into a `LengthAwarePaginator` for lazy-loaded embedded collections.
- **Validated collection cast:** A collection cast that validates each element against a type or schema on set (e.g., only accepting specific shapes of objects).
- **Collection cast with custom default:** Configuring `AsCollection::class . ':default=[]'` to avoid null issues without overriding `$attributes`.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization