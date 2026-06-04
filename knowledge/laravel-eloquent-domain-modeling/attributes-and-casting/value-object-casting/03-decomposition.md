# value-object-casting Decomposition

## Topic Overview

Value object casting bridges Eloquent models and immutable value objects through custom casts, enabling round-trip persistence of domain primitives. This KU covers the full pipeline: storage representation, reconstruction, self-definition, and serialization.

---

## Decomposition Strategy

This topic integrates concepts from multiple interfaces (CastsAttributes, Castable, SerializesCastableAttributes) into a focused practice. It is kept as a single KU because:

- The round-trip pipeline (store → read → serialize) is a unified workflow.
- All the interface concepts are applied together to solve one problem.
- Separating by interface would require learners to reassemble the integrated mental model.

The conceptual foundations are separated into their own KUs (casts-attributes-interface, castable-interface, value-object-fundamentals), keeping this KU focused on the integration.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── value-object-casting/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| value-object-casting | Full pipeline for persisting value objects via Eloquent casts: storage strategy, reconstruction, self-definition, null handling, serialization | Advanced | value-object-fundamentals, casts-attributes-interface, castable-interface |

---

## Dependency Graph

```
value-object-fundamentals    casts-attributes-interface    castable-interface
           \                         |                          /
            → → → → → → value-object-casting ← ← ← ← ← ← ←
                                |
                    serializes-castable-attributes
                                |
                        money-email-address
```

---

## Boundary Analysis

**In scope:**
- Round-trip value object persistence (get/set pipeline)
- Single-column (primitive) storage strategy
- JSON column storage strategy
- Multi-column storage strategy
- Null handling (null vs Null Object)
- Castable integration for self-defining value objects
- Serialization control via SerializesCastableAttributes
- Querying value object attributes

**Out of scope:**
- Value object design principles — covered in `value-object-fundamentals`
- Interface contracts — covered in `casts-attributes-interface`, `castable-interface`, `serializes-castable-attributes`
- Concrete value object implementations — covered in `money-email-address`
- Immutability patterns — covered in `immutability-patterns`

---

## Future Expansion Opportunities

- **Versioned storage formats**: Pattern for migrating value object storage format without downtime (reading both old and new formats).
- **Value object query builders**: Advanced query patterns for JSON and multi-column value objects.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization