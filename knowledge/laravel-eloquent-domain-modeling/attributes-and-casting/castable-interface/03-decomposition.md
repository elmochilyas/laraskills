# castable-interface Decomposition

## Topic Overview

The `Castable` interface enables self-defining casts for value objects. Instead of registering a separate cast class on the model, the value object declares its own cast logic through a static `castUsing()` method. This inverts the casting architecture and promotes encapsulation.

---

## Decomposition Strategy

This topic is atomic. The `Castable` interface is a single-method contract with a clear architectural purpose: self-defining serialization. No further splitting is needed because:

- The interface has one method (`castUsing()`) with one concern (returning a cast class).
- The value object integration aspect overlaps with `value-object-casting` KU but the interface contract itself is independently teachable.
- The separation between `Castable` (the interface) and `value-object-casting` (the practice of casting value objects) is maintained: one describes the contract, the other describes the application.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── castable-interface/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| castable-interface | Define the `Castable` interface, `castUsing()` contract, architectural inversion principle, and integration with `$casts` | Advanced | casts-attributes-interface, value-object-fundamentals |

---

## Dependency Graph

```
casts-attributes-interface    value-object-fundamentals
         \                         /
          →  castable-interface  ←
                      │
                      ↓
              value-object-casting
```

---

## Boundary Analysis

**In scope:**
- `Castable` interface contract (`castUsing()` signature, return types)
- Architectural inversion (value object declares its own cast)
- `castUsing()` argument forwarding from `$casts` array
- Embedded cast class vs factory closure patterns
- Container resolution of castables

**Out of scope:**
- How the returned cast class implements `get`/`set` — covered in `casts-attributes-interface`
- Value object design principles — covered in `value-object-fundamentals`
- Practical application to specific value objects — covered in `value-object-casting` and `money-email-address`
- `SerializesCastableAttributes` — covered in its own KU

---

## Future Expansion Opportunities

- **Castable with dynamic arguments**: Parameterized self-defining casts could expand into a deeper topic, but current complexity does not warrant a separate KU.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization