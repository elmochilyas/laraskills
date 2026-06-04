# casts-inbound-interface Decomposition

## Topic Overview

`CastsInboundAttributes` is the write-only specialization of Eloquent's custom casting contract. It addresses the subset of casting where only the set direction (PHP → database) needs customization, while reads pass through the raw stored value unchanged.

---

## Decomposition Strategy

This topic is atomic. It describes a single interface with one method (`set`) and a clear boundary: inbound-only transformation. No further splitting is warranted because:

- There are no sub-concepts within the interface that have independent tradeoffs.
- The distinguishing factor (absence of `get`) is a single design decision.
- The inbound-only pattern is a simplification of `CastsAttributes`, not an expansion.

It is kept separate from `casts-attributes-interface` because the tradeoffs for choosing inbound-only vs bidirectional are independent decision points.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── casts-inbound-interface/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| casts-inbound-interface | Define `CastsInboundAttributes` contract, write-only transformation, normalization patterns, and when to choose inbound-only over bidirectional | Intermediate | casts-attributes-interface |

---

## Dependency Graph

```
casts-attributes-interface
↓
casts-inbound-interface
  (specialization — narrows the contract to set-only)
```

---

## Boundary Analysis

**In scope:**
- `CastsInboundAttributes::set()` signature and return contract
- Inbound-only mental model (half-duplex)
- Normalization, encryption, and validation patterns
- Comparison with bidirectional `CastsAttributes`
- Read passthrough behavior (raw values from `$attributes`)

**Out of scope:**
- `CastsAttributes` bidirectional contract (separate KU)
- `Castable` self-defining cast (separate KU)
- `SerializesCastableAttributes` JSON serialization (separate KU)
- Native `$casts` types (`int`, `bool`, etc.) — covered in Native Attribute Casting KU
- Accessor/mutator patterns for read transformation — covered in Accessors & Mutators KU

---

## Future Expansion Opportunities

- **Inbound-only hashing cast pattern**: Hashing passwords or tokens on write is a common pattern that could warrant a dedicated KU if the ecosystem produces enough nuance (salt rotation, hashing algorithm selection).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization