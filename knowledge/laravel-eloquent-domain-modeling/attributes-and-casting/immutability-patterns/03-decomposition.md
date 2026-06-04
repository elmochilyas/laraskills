# immutability-patterns Decomposition

## Topic Overview

Immutability patterns cover the PHP coding techniques that enforce value object immutability: `readonly` properties, `with*` methods, defensive copying, clone safety, and immutability-by-convention in pre-8.1 code.

---

## Decomposition Strategy

This topic is atomic. All immutability patterns serve the same goal (preventing state mutation after construction) and share a unified reasoning framework. No further splitting is warranted because:

- `readonly` properties, `with*` methods, and defensive copying are complementary techniques, not alternatives — they are used together.
- The topic is narrow enough to be taught and reasoned about as a single unit.
- Separating by PHP version (pre-8.1 vs 8.1+) would create artificial boundaries; the principles are the same, only the enforcement mechanism differs.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── immutability-patterns/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| immutability-patterns | PHP techniques for enforcing value object immutability: readonly properties, with* methods, defensive copying, clone safety | Intermediate | value-object-fundamentals |

---

## Dependency Graph

```
value-object-fundamentals
  ↓
immutability-patterns
  ↓
value-object-casting (applies immutable value objects in casts)
  ↓
money-email-address (concrete immutable implementations)
```

---

## Boundary Analysis

**In scope:**
- PHP 8.1 `readonly` properties and classes (8.2)
- `with*` method pattern (implementation, naming conventions)
- Defensive copying of arrays, DateTime, collections
- `__clone` for deep copy safety
- Immutability-by-convention (pre-8.1 patterns)
- Named constructors as alternative to `with*`
- Immutable collection libraries

**Out of scope:**
- Why value objects should be immutable — covered in `value-object-fundamentals`
- How immutability affects Eloquent casting — covered in `value-object-casting`
- PHP clone semantics in general (not value-object-specific)
- Functional programming immutability concepts (map, filter, reduce)
- Entity immutability (entities can be mutable; value objects must not)

---

## Future Expansion Opportunities

- **PHP 8.4 property hooks and immutability**: If PHP 8.4+ introduces property hooks, the `with*` pattern might be simplified, creating a new KU.
- **Immutability testing patterns**: Techniques for testing that value objects remain immutable (unit test helpers, mutation testing).
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization