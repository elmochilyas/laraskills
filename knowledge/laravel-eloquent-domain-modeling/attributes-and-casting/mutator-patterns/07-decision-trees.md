## Mutator vs Cast vs FormRequest Validation

Choosing between mutators, casting, and FormRequest validation for input handling.

---

## Decision Context

When input needs processing before storage, you must decide whether to use a mutator, a cast, or handle it in FormRequest validation.

---

## Decision Criteria

* whether the transformation is normalization (trim, lowercase) vs type coercion
* whether business rules are being enforced (validation)
* whether the input needs side effects
* whether the logic belongs at the model boundary or controller boundary

---

## Decision Tree

Input needs processing before storage?

↓

Is this type coercion (string→bool, string→array)?

YES → Use Cast (`$casts` property)

NO → Is this input normalization (trim, lowercase, format conversion)?

    YES → Use Mutator (`Attribute::make(set: fn($v) => ...)`)

NO → Is this a business rule validation (status transitions, unique checks)?

    YES → Use FormRequest validation rules

        Is the rule so fundamental it must be enforced at the model level?

        YES → Add model method that throws domain exception (in addition to FormRequest)

---

## Rationale

Mutators handle normalization at the model boundary (trimming, formatting). Casts handle type coercion. Business rule validation belongs in FormRequests with model-level methods as a safety net. Side effects (API calls, email) belong in actions or events, not mutators.

---

## Recommended Default

**Default:** Use mutators for input normalization; use casts for type coercion; use FormRequest for validation
**Reason:** Each has a distinct boundary responsibility; mixing them creates coupling and testing difficulty

---

## Risks Of Wrong Choice

Validation in mutators throws exceptions unexpectedly on assignment; type coercion in mutators duplicates cast functionality; business logic in mutators runs on every attribute assignment.

---

## Related Rules

- Mutator-side-effect prohibitions (from mutator-patterns standardized knowledge)

---

## Related Skills

- Mutator definition with Attribute::make (attributes-and-casting/06-skills.md)

---

## Single vs Multi-Attribute Mutator

Choosing between a single-attribute mutator and a multi-attribute mutator returning an array.

---

## Decision Context

When a single input value affects multiple database columns, you must decide whether to use a multi-attribute mutator or handle it in a separate method.

---

## Decision Criteria

* whether the transformation maps one input to multiple columns
* whether the transformation is a simple assignment vs complex logic
* whether the relationship between input and output columns is well-understood

---

## Decision Tree

Does one input value map to multiple database columns?

YES → Use multi-attribute mutator returning `['col1' => $val1, 'col2' => $val2]`

    Example: password → `['password' => bcrypt($value), 'password_changed_at' => now()]`

NO → Use single-attribute mutator returning the transformed value

---

## Rationale

Multi-attribute mutators atomically update related columns from a single logical assignment. They are the cleanest way to handle derived columns (like timestamps that should update alongside a primary field). The array return makes the mapping explicit.

---

## Recommended Default

**Default:** Use single-attribute mutator unless one value logically maps to multiple columns
**Reason:** Simpler; multi-attribute mutators add complexity only when needed

---

## Risks Of Wrong Choice

Missing updates to related columns when using single-attribute mutator; unexpected side effects from multi-attribute mutator updating unrelated columns.
