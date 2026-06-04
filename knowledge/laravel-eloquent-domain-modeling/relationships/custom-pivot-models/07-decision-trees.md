## Pivot Model Complexity (Default Pivot vs Custom Pivot)

Choosing between using the default Pivot class and creating a custom pivot model with behavior.

---

## Decision Context

When a many-to-many pivot table has extra columns, you must decide whether the default Pivot class is sufficient or a custom pivot model is needed.

---

## Decision Criteria

* whether the pivot has extra columns beyond FKs
* whether extra columns need type casting (dates, enums, booleans)
* whether the pivot needs computed attributes or domain methods
* whether the pivot needs events or observers

---

## Decision Tree

Many-to-many relationship with extra pivot columns?

↓

Does the pivot need behavior (casts, accessors, methods, events)?

YES → Create a custom pivot model

    Is this a polymorphic many-to-many?

    YES → Extend `MorphPivot` (not `Pivot`)

    NO → Extend `Pivot`

    Register `->using(CustomPivot::class)` on BOTH sides

NO → Default pivot is sufficient

    Use `->withPivot('col1', 'col2')` to whitelist extra columns

    Use `->as('customName')` for clearer pivot accessor naming

---

## Rationale

Custom pivot models are needed when pivot data requires transformation (casts), computation (accessors), or behavior (methods). For simple extra columns like timestamps or booleans, the default pivot with `->withPivot()` is sufficient. Using custom pivots unnecessarily adds class overhead.

---

## Recommended Default

**Default:** Use default pivot with `->withPivot()` for simple extra columns
**Reason:** Less code, no additional classes, framework-native handling

---

## Risks Of Wrong Choice

Unnecessary class creation for simple column access; missing behavior when pivot really needs methods; extending `Pivot` instead of `MorphPivot` for polymorphic pivots.

---

## Related Rules

- MorphToMany-CustomPivot-Extend-MorphPivot (polymorphic-morph-to-many/05-rules.md)

---

## Related Skills

- Configure a BelongsToMany relationship with pivot table migration (belongs-to-many/06-skills.md)

---

## Custom Pivot Registration (Both Sides vs Single Side)

Ensuring `->using()` is registered consistently on both sides of a many-to-many relationship.

---

## Decision Context

When using a custom pivot model, `->using()` must be registered on both sides of the relationship for consistent behavior.

---

## Decision Criteria

* whether both directions of the relationship use the relationship builder
* pivot consistency when accessing from either side
* potential for different behavior depending on access direction

---

## Decision Tree

Using a custom pivot model?

↓

Is `->using(CustomPivot::class)` registered on BOTH sides of the relation?

YES → Consistent pivot hydration from both directions

NO → which side has it?

    Only one side → Inconsistent: pivot from the other side uses default Pivot

    Fix: Add `->using()` to the other side with the same class

---

## Rationale

Without `->using()` on both sides, accessing the relationship from the unregistered side hydrates pivot rows using the default `Pivot` class, losing all custom methods, casts, and behavior. This creates inconsistent behavior depending on which direction you access the relationship.

---

## Recommended Default

**Default:** Always register `->using()` on both sides with the same custom pivot class
**Reason:** Consistent behavior regardless of access direction; no silent loss of pivot behavior

---

## Risks Of Wrong Choice

Inconsistent pivot behavior, silent loss of custom casts and methods when accessing from the unregistered side, hard-to-debug inconsistencies.
