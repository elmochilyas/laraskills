## Model Method Sufficiency Decision

Determining whether an operation can stay on the model or needs extraction.

---

## Decision Context

When adding a method to an Eloquent model, you must assess whether the operation stays within the model's aggregate boundary or requires extraction.

---

## Decision Criteria

* whether the method references `$this` attributes only
* whether the method calls external services (Mail, Queue, APIs)
* whether the method modifies other models' state directly
* whether the model is approaching 300 lines

---

## Decision Tree

Adding a method to a model?

↓

Does the method only reference `$this->attribute` and owned relations?

YES → Keep on model

NO → Does it call external services (Mail, Queue, HTTP)?

    YES → Extract to action; dispatch events from model instead

NO → Does it modify another model's state directly?

    YES → Extract to action (cross-aggregate operation)

Is the model approaching 300 lines?

YES → Extract related methods to traits

---

## Rationale

Model methods are the preferred home for within-aggregate logic. When methods cross boundaries (external services, other aggregates), they violate the model's responsibility. The 300-line guideline helps prevent god models.

---

## Recommended Default

**Default:** Keep within-aggregate logic on the model
**Reason:** Models with domain methods are expressive, self-documenting, and follow Active Record conventions

---

## Risks Of Wrong Choice

Model with external service calls becomes untestable without mocking; cross-aggregate logic in models creates coupling; god models exceed 500+ lines.

---

## Related Rules

- Model method purity (from when-models-are-enough standardized knowledge)

---

## Related Skills

- Model method design (domain-modeling-patterns/06-skills.md)
