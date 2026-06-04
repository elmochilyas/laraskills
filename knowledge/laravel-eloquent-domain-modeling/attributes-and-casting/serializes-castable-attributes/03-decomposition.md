# serializes-castable-attributes Decomposition

## Topic Overview

`SerializesCastableAttributes` provides explicit control over how casted values appear in JSON/array serialization. It decouples the in-memory PHP representation from the wire format, ensuring complex value objects serialize cleanly.

---

## Decomposition Strategy

This topic is atomic. It describes a single interface with one method (`serialize`) that addresses a single concern: JSON serialization of casted values. No further splitting is warranted because:

- The `serialize` method is a single contract with a single purpose (transform for output).
- The interface is optional and additive — it does not create sub-concepts.
- The distinction between in-memory and wire format is a unified decision, not a set of independent decisions.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── serializes-castable-attributes/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| serializes-castable-attributes | Define `SerializesCastableAttributes` contract, serialization lifecycle, `toArray()` integration, and patterns for producing API-friendly output | Advanced | casts-attributes-interface, Laravel Serialization |

---

## Dependency Graph

```
casts-attributes-interface
  ↓
serializes-castable-attributes (additive interface)
  ↓
value-object-casting (applied to value object casting)
```

---

## Boundary Analysis

**In scope:**
- `SerializesCastableAttributes::serialize()` signature and return contract
- `toArray()` and `toJson()` integration
- Difference between in-memory representation (`get`) and wire format (`serialize`)
- Interaction with `JsonSerializable`
- Null coercion and safe serialization patterns

**Out of scope:**
- `CastsAttributes::get()` lifecycle — covered in `casts-attributes-interface`
- `Castable` interface — covered in `castable-interface`
- Eloquent API Resources — separate topic in serialization subdomain
- Model `$appends` and `$hidden` — separate serialization topics
- PHP `JsonSerializable` interface — language-level concept, not Eloquent-specific

---

## Future Expansion Opportunities

- **Serialization caching**: The lack of caching for `serialize` output could become a performance KU if Eloquent introduces caching in future versions.
- **Versioned serialization**: Pattern for versioning serialization output (v1 API vs v2 API) could expand but is currently better covered in general API versioning KUs.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization