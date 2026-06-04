# value-object-fundamentals Decomposition

## Topic Overview

Value objects are immutable, self-validating domain primitives that model concepts as typed classes rather than bare scalars. This KU covers the core concepts, design principles, and architectural tradeoffs of value objects in PHP and Laravel.

---

## Decomposition Strategy

This topic is broad. It is split into three KUs to maintain atomicity:

- **value-object-fundamentals** (this KU): Core concepts — identity by value, immutability, self-validation, primitive obsession.
- **immutability-patterns**: Deep dive into immutable design patterns — readonly properties, `with*` methods, immutable setters.
- **money-email-address**: Concrete implementations of common Laravel value objects.

This KU focuses on the "why" and "what" of value objects. The other two focus on the "how" — `immutability-patterns` for design techniques, `money-email-address` for concrete examples.

---

## Proposed Folder Structure

```
attributes-and-casting/
├── value-object-fundamentals/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
├── immutability-patterns/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
├── money-email-address/
│   ├── 02-knowledge-unit.md
│   └── 03-decomposition.md
```

---

## Knowledge Unit Inventory

| Name | Purpose | Difficulty | Dependencies |
|------|---------|-----------|--------------|
| value-object-fundamentals | Core value object concepts: identity by value, immutability, self-validation, primitive obsession | Intermediate | OOP Fundamentals |

---

## Dependency Graph

```
OOP Fundamentals
↓
value-object-fundamentals
├──→ immutability-patterns (advanced immutable design)
├──→ money-email-address (concrete implementations)
└──→ value-object-casting (persisting value objects via Eloquent)
```

---

## Boundary Analysis

**In scope:**
- Identity by value (structural equality)
- Immutability principle and immutability guarantees
- Self-validation at construction
- Primitive obsession anti-pattern
- PHP `readonly` properties and typed properties
- Equality methods (`equals()`, `==` semantics)
- Value objects vs entities

**Out of scope:**
- Immutable setter patterns (`with*` methods) — covered in `immutability-patterns`
- Concrete implementations — covered in `money-email-address`
- Eloquent cast integration — covered in `value-object-casting`
- PHP 8.1 native enums — separate KU in PHP language features
- Data Transfer Objects (DTOs) — separate topic

---

## Future Expansion Opportunities

- **Value object collection patterns**: Value objects containing collections of other value objects (e.g., `InvoiceLines`) could form a separate KU.
- **Null Object pattern for value objects**: The `NullMoney`, `NullEmail` pattern for nullable value object attributes.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization