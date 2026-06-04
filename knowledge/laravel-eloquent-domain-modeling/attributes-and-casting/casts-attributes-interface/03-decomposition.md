# casts-attributes-interface Decomposition

## Topic Overview

The `CastsAttributes` interface defines the bidirectional transformation contract for custom Eloquent casting. It is the foundational primitive upon which all other casting patterns (inbound-only, castable, serialization-aware) are built. This KU focuses exclusively on the interface contract, lifecycle, and bidirectional nature.

---

## Decomposition Strategy

This topic is atomic — it describes a single interface with a clear contract. No further splitting is warranted because:

- The `get`/`set` method signatures and their return contracts are tightly coupled and cannot be taught independently.
- The mental model of bidirectional transformation requires both directions.
- The lifecycle timing (when `get` vs `set` fires) is a unified concern.

However, two related concepts were split into their own KUs:
- **casts-inbound-interface**: A narrower subset (set-only) extracted because it has independent tradeoffs (data integrity without read-time transformation).
- **castable-interface**: Moves cast definition to the value object itself — an architectural inversion that deserves its own decision framework.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── casts-attributes-interface/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

No sub-folders required.

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| casts-attributes-interface | Define the `CastsAttributes` interface contract, `get`/`set` lifecycle, signature rules, and return contracts | Intermediate | Native Attribute Casting, Accessors & Mutators |

---

## Dependency Graph

```
Native Attribute Casting
↓
casts-attributes-interface
├──→ casts-inbound-interface (set-only specialization)
├──→ castable-interface (self-defining cast on value objects)
├──→ serializes-castable-attributes (serialization extension)
└──→ cast-parameters (parameterized casts)
```

---

## Boundary Analysis

**In scope:**
- `CastsAttributes::get()` signature, parameters, return contract
- `CastsAttributes::set()` signature, parameters, return contract
- Bidirectional transformation mental model
- Cast lifecycle during hydration and assignment
- Null handling conventions
- Stateless constraint for cast classes
- Container resolution mechanics

**Out of scope:**
- `CastsInboundAttributes` (separate KU)
- `Castable` interface (separate KU)
- `SerializesCastableAttributes` (separate KU)
- Native `$casts` types (`int`, `bool`, `json`, `object`) — covered in Native Attribute Casting KU
- Accessor/mutator patterns — covered in Accessors & Mutators KU

---

## Future Expansion Opportunities

- **Composite multi-column cast patterns**: Could become a standalone KU if the pattern grows enough complexity (e.g., Money value objects spanning `amount` + `currency` columns).
- **Cast caching internals**: The model's internal cast resolution cache could be a niche performance KU.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization