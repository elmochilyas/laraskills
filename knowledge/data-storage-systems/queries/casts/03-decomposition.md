# Decomposition: 2.17 Casts (native types, Enum, custom casts, JSON, encrypted)

## Topic Overview
Casts define how attribute values are converted between their database representation and PHP types. They handle type coercion, JSON serialization/deserialization, enum hydration, encryption, and custom transformations. Casts are the primary mechanism for type safety in Eloquent models.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-17-casts/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.17 Casts (native types, Enum, custom casts, JSON, encrypted)
- **Purpose:** Casts define how attribute values are converted between their database representation and PHP types. They handle type coercion, JSON serialization/deserialization, enum hydration, encryption, and custom transformations.
- **Difficulty:** Intermediate
- **Dependencies:** 2.16 Accessors and mutators, 2.18 Model serialization

## Dependency Graph
**Depends on:** "2.16 Accessors and mutators", "2.18 Model serialization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Native casts**: `array`, `boolean`, `datetime`, `decimal:n`, `double`, `float`, `integer`, `object`, `string`, `timestamp`.; - **Enum casts**: Map database values to PHP enums. `protected $casts = ['status' => OrderStatus::class]`.; - **JSON casts**: Auto-serialize/deserialize arrays/objects to JSON columns.; - **Encrypted casts**: `encrypted` — auto-encrypt/decrypt attribute values using Laravel's encryption.; - **Custom casts**: Implement `CastsAttributes` interface for complex transformations..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization