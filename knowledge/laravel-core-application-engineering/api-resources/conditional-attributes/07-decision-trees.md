# Decision Trees — Conditional Attributes

---

## Decision: whenHas vs whenNotNull for Optional Field Inclusion

---

## Decision Context

Should you use `whenHas($attribute)` or `whenNotNull($value)` to conditionally include an optional field?

---

## Decision Criteria

* **Data source:** Is the field a raw model attribute or a computed/accessor value?
* **Accessor behavior:** Does the accessor transform null to a default value?
* **Null semantics:** Should the field appear when the resolved value is null?

---

## Decision Tree

Need to conditionally include a field based on its value?

↓

Is the field a raw model attribute with no accessor transformation?

YES → Use `whenHas($attribute)` — checks `isset` on the raw attribute

NO → Does the field have an accessor that transforms null to a default value?

    YES → Use `whenNotNull($value)` — checks the resolved accessor value

    NO → Use `whenNotNull($value)` — the computed value is the ground truth

---

## Rationale

`whenHas` checks model attribute existence via `isset` — if an accessor returns a default for null, `whenHas` includes the field even when the raw attribute is null. `whenNotNull` checks the resolved value, so it correctly omits the field when the accessor returns null. The choice depends on whether you want to check attribute existence or value existence.

---

## Recommended Default

**Default:** Use `whenNotNull($value)` for any field with an accessor or computed value; use `whenHas($attribute)` only for raw, unmodified model columns
**Reason:** `whenNotNull` checks the actual resolved value, which is what the client sees; `whenHas` can be misled by accessors returning defaults

---

## Risks Of Wrong Choice

Using `whenHas` on an accessor field causes the field to appear even when the underlying value is null (because the accessor returns a default). Using `whenNotNull` on a raw attribute that exists but is null includes the field with a null value, which may not be the intended behavior.

---

## Related Rules

* Rule: Prefer whenHas for Model Attributes and whenNotNull for Computed Values (conditional-attributes/05-rules.md)
* Rule: Test Every Conditional Path (conditional-attributes/05-rules.md)

---

## Related Skills

* Add Conditional Fields to an API Resource (conditional-attributes/06-skills.md)
* Resource Fundamentals (resource-fundamentals/06-skills.md)

---

---

## Decision: Conditional Field vs Separate Resource for Different Shapes

---

## Decision Context

Should you use conditional fields within a single resource, or split into separate per-endpoint resources?

---

## Decision Criteria

* **Conditional ratio:** What percentage of fields is conditional?
* **Shape difference:** How different are the response shapes across endpoints?
* **Testability:** Can you test all relevant combinations?
* **Client predictability:** Will clients receive consistent schemas?

---

## Decision Tree

Need to serve different field sets for different endpoints?

↓

Are more than 70% of fields wrapped in conditionals?

YES → Split into separate resources — the single resource has too many conditionals

NO → Are conditionals dominated by permission-based logic (admin vs user)?

    YES → Is the number of permission-gated fields > 3?

        YES → Split into separate resources (AdminUserResource, UserResource)

        NO → Use `when()` with permission checks — acceptable for 1-3 permission fields

    NO → Are conditionals dominated by attribute existence (optional bio, middle name)?

        YES → Use `whenHas()` / `whenNotNull()` — these are simple, self-contained checks

        NO → Split into separate resources — unclear conditionals indicate multiple contracts

---

## Rationale

The 70% threshold is a clear heuristic: when most fields are conditional, the resource is serving multiple contracts and should be split. Permission-based fields (1-3) are manageable with `when()`. Optional attribute existence checks are the ideal use case for `whenHas`/`whenNotNull`. When conditionals are unclear or overlapping, the resource has outgrown its single-class design.

---

## Recommended Default

**Default:** Use a single resource with `whenHas()`/`whenNotNull()` for optional attributes; split into per-endpoint resources when conditionals dominate
**Reason:** Single resources are simpler to maintain when conditionals are straightforward; splitting adds class count without benefit for simple cases

---

## Risks Of Wrong Choice

A resource with 8 conditional fields (out of 10) requires 2^8 = 256 test combinations — completely impractical. Clients face an unpredictable schema. Conversely, splitting resources for 1-2 optional fields creates unnecessary file proliferation and complicates the endpoint-to-resource mapping.

---

## Related Rules

* Rule: Split Resource When Most Fields Are Conditional (conditional-attributes/05-rules.md)
* Rule: Limit mergeWhen Nesting to One Level (conditional-attributes/05-rules.md)

---

## Related Skills

* Add Conditional Fields to an API Resource (conditional-attributes/06-skills.md)
* Resource Organization (resource-organization/06-skills.md)

---

---

## Decision: Eager vs Lazy Evaluation in when() Closures

---

## Decision Context

Should expensive computations inside `when()` be wrapped in closures for lazy evaluation, or passed directly?

---

## Decision Criteria

* **Computation cost:** Is the operation expensive (DB query, API call, complex calculation)?
* **Condition frequency:** How often is the condition true vs false?
* **Code readability:** Does closure wrapping add meaningful overhead for trivial operations?

---

## Decision Tree

Need to include a computed value inside `when()`?

↓

Is the computation a property read, simple cast, or string concatenation?

YES → Pass the value directly — `when($condition, $this->name)` — closure overhead exceeds computation cost

NO → Is the computation a DB query, external API call, or complex calculation?

    YES → Wrap in a closure — `when($condition, fn() => $this->heavy())` — only runs when condition is true

    NO → Is the computation a method call with non-trivial logic?

        YES → Wrap in a closure — defensive, prevents future performance regression

        NO → Pass directly — trivial operations need no closure

---

## Rationale

The closure's purpose is to defer evaluation until the condition is known to be true. For trivial operations (reading a property, concatenating strings), the closure invocation overhead (~0.001ms) can exceed the computation itself. For any non-trivial operation, the closure saves the computation when the condition is false, which happens on every request for every item where the field is omitted.

---

## Recommended Default

**Default:** Wrap any method call or computation inside `when()` in a closure; pass property reads directly
**Reason:** The closure is free when the condition is true (just a callable invocation) and saves the computation when false. Property reads are so cheap that the closure overhead is meaningful.

---

## Risks Of Wrong Choice

Passing `$this->generateReport()` directly inside `when()` causes the report to generate on every request, even when the condition is false. For a collection of 100 items where only admins see the report field, non-admin requests still pay the report generation cost 100 times. Conversely, wrapping `$this->id` in a closure adds unnecessary overhead for no benefit.

---

## Related Rules

* Rule: Use Lazy Evaluation for Expensive Computations (conditional-attributes/05-rules.md)
* Rule: Never Rely on Conditional Omission as Sole Security Mechanism (conditional-attributes/05-rules.md)

---

## Related Skills

* Add Conditional Fields to an API Resource (conditional-attributes/06-skills.md)
