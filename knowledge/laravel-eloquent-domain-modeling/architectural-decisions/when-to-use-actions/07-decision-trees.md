## Model Method vs Action Class

Choosing between placing logic on the model (within-aggregate) and extracting to an action class (cross-aggregate).

---

## Decision Context

When implementing a business operation, you must decide whether to place it as a method on the Eloquent model or extract it into a separate action class.

---

## Decision Criteria

* whether the operation coordinates a single model or multiple aggregates
* whether external side effects (email, queue, API) are involved
* whether the logic needs a named, testable use-case entry point
* whether the operation exceeds simple CRUD

---

## Decision Tree

Implementing a business operation?

↓

Does the operation only touch this model's own attributes and owned relationships?

YES → Use a model method (markAsPaid, isOverdue)

NO → Does the operation coordinate 2+ aggregates or involve external side effects?

    YES → Use an Action Class

    Does the operation need its own transaction boundary?

    YES → Wrap in `DB::transaction()` inside the action

    Does the controller need to dispatch multiple things?

    YES → Action keeps controller thin

---

## Rationale

Single-model operations naturally belong on the model (Active Record pattern). Cross-aggregate operations and those with external side effects need an action class to avoid coupling models to each other or to infrastructure concerns.

---

## Recommended Default

**Default:** Model method for within-aggregate logic; action class for cross-aggregate orchestration
**Reason:** Model methods keep domain visible; actions prevent model coupling and provide testable boundaries

---

## Risks Of Wrong Choice

Action class for trivial state change adds unnecessary indirection; model method calling external services creates hidden dependencies.

---

## Related Rules

- Action class conventions (from when-to-use-actions standardized knowledge)

---

## Related Skills

- Action class creation (architectural-decisions/06-skills.md)
