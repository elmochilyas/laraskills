# Decomposition: Date/Time Casts

## Boundary Analysis
Date/time casts cover `date`, `datetime`, `immutable_date`, `immutable_datetime`, and `timestamp` cast types, including `serializeDate()`, `$dateFormat`, and the `asDateTime`/`fromDateTime` conversion methods. It does not cover primitive casts, Carbon configuration (locale, timezone), or the `$timestamps` lifecycle (covered in Model Lifecycle).

## Atomicity Assessment
**Status:** ✅ Atomic (no split needed)

The date cast system is a single pipeline: storage format → Carbon → serialization format. Decomposing would separate tightly coupled concerns (parsing, mutability, serialization).

## Dependency Graph
```
Date/Time Casts
  ├── depends on: Carbon library (nesbot/carbon)
  ├── depends on: Model $casts resolution system
  ├── depends on: app.timezone configuration
  ├── related to: Primitive Casts (same $casts mechanism)
  ├── enabled by: Accessor Patterns (accessors on date columns)
  └── related to: Model Serialization (serializeDate() hook)
```

## Follow-up Opportunities
- **Per-attribute serialization format:** A `serializeDateFormat` property or cast parameter to specify format per date column instead of one format for all dates.
- **Automatic timezone conversion per user:** Storing user timezone preferences and converting all date casts to the user's timezone on read.
- **Millisecond/microsecond timestamp support:** Extending date casts to support sub-second precision (e.g., `timestamp:ms` for JavaScript-style millisecond timestamps).
- **Date-only value objects:** A dedicated date cast that returns `Carbon` without time component, enforcing date-only semantics in the type system.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization