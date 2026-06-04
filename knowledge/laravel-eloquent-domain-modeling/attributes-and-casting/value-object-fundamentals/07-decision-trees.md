## Value Object vs Primitive Attribute

Choosing between encapsulating an attribute as a value object or keeping it as a primitive.

---

## Decision Context

When an attribute has validation rules, formatting, or multi-field representation, you must decide whether to create a value object or keep it as a primitive.

---

## Decision Criteria

* whether the attribute has validation rules beyond database type checking
* whether the attribute appears across multiple models
* whether the attribute has behavior (formatting, comparison)
* whether the attribute requires multiple fields (composite value)

---

## Decision Tree

Designing a model attribute?

↓

Does the attribute have validation rules that should be enforced at the PHP level?

YES → Consider Value Object (self-validating on construction)

NO → Does the attribute require multiple fields (Money = amount + currency)?

    YES → Value Object

    NO → Does the same attribute type appear across 2+ models?

        YES → Value Object for consistent behavior

        NO → Primitive attribute is sufficient

---

## Rationale

Value objects bring type safety and self-validation to model attributes. They're especially valuable for domain primitives (Money, Email, Address) that appear across multiple models. For simple scalars used in one model, a value object's class overhead is rarely justified.

---

## Recommended Default

**Default:** Primitive for simple, single-use scalars; value object for validated, multi-use, or composite attributes
**Reason:** Value objects add type safety; primitives are simpler for straightforward attributes

---

## Risks Of Wrong Choice

Value object for every attribute creates unnecessary classes; primitive for domain primitives allows invalid state to propagate.

---

## Related Rules

- Value object immutability and equality (from value-object-fundamentals standardized knowledge)

---

## Related Skills

- Value object creation and casting (attributes-and-casting/06-skills.md)
