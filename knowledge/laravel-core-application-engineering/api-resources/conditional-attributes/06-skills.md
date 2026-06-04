# Skill: Add Conditional Fields to an API Resource

## Purpose

Include or exclude resource fields based on runtime conditions using `when()`, `whenHas()`, `whenNotNull()`, and `mergeWhen()` while maintaining a predictable API contract.

## When To Use

- Permission-based field visibility (admin sees `secret_key`, regular user does not)
- Optional fields that only some models have (`bio`, `middle_name`)
- Grouping multiple conditional fields under one condition via `mergeWhen()`
- Sparse field selection driven by request parameters

## When NOT To Use

- When the shape difference is large (>3 fields) — use separate resources instead
- When the field must always be present with a null value (e.g., TypeScript interfaces expect the key)
- For access control — conditional omission is not authorization; use policies and middleware
- When most fields in a resource are conditional (>70%) — split the resource

## Prerequisites

- A resource class extending `JsonResource`
- Understanding of the conditional methods: `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`
- A model or data source with the attributes to check

## Inputs

- Resource class file
- The condition to evaluate (permission check, attribute existence, computed value null check)
- The value or closure to include when the condition is true
- For `mergeWhen`: an explicit inline array of fields to merge conditionally

## Workflow

1. Identify the field that should be conditionally included and the condition that controls it.
2. Choose the correct conditional method:
   - `when($condition, $value)` for any boolean condition
   - `whenHas($attribute)` for raw model attribute existence checks
   - `whenNotNull($value)` for computed or accessor-resolved non-null checks
   - `mergeWhen($condition, [...])` for grouping multiple fields under one condition
3. Wrap expensive computations in closures: `when($condition, fn() => heavy())` instead of `when($condition, heavy())`.
4. For `mergeWhen`, pass an explicit inline array — never a variable or method return.
5. Always include the `id` field unconditionally (identifiers must always be present).
6. Add authorization at the controller/endpoint level for any permission-gated fields — the resource conditional is formatting only, not security.
7. Write tests that verify both inclusion (condition true) and omission (condition false) for every conditional method used.

## Validation Checklist

- [ ] Every conditional attribute has a test verifying both inclusion and omission
- [ ] No expensive computations inside `when()` without lazy evaluation via closures
- [ ] Conditional fields are documented as optional in API docs (clients need to know)
- [ ] Sensitive data omission is paired with proper endpoint-level authorization
- [ ] The resource has not been over-conditionalized — split if >70% of fields are conditional
- [ ] `mergeWhen()` is not nested beyond one level
- [ ] `mergeWhen()` receives an explicit inline array, not a variable
- [ ] Version branching is NOT done via conditionals — use separate versioned resources
- [ ] Sensitive model attribute names are never passed to `whenHas()`

## Common Failures

- Using `whenHas` when `whenNotNull` is needed (or vice versa) — `whenHas` checks model attribute existence via `isset`; `whenNotNull` checks the resolved value. An accessor transforming null to a default causes `whenHas` to include the field while `whenNotNull` would exclude it.
- Passing a function call result instead of a closure — `when($condition, $this->heavy())` executes the call regardless of the condition
- Over-conditionalization — making most fields conditional creates unpredictable schemas and untestable resources
- Using conditionals for API version branching — `when($request->version === 'v1', ...)` creates a monolithic class; use versioned resource classes instead
- Security-through-omission — relying on `when()` as the sole mechanism for hiding sensitive data without endpoint-level authorization

## Decision Points

- **whenHas vs whenNotNull**: Use `whenHas` for raw model attributes without accessor transformations. Use `whenNotNull` for any field with an accessor, mutator, or computed value.
- **Closure vs direct value**: Use closures for expensive computations (DB queries, API calls, complex calculations). Direct values are fine for property reads, simple casts, and string concatenation.
- **mergeWhen vs separate when() calls**: Use `mergeWhen` when 2+ fields share the same condition. Use separate `when()` when individual fields have independent conditions.

## Performance Considerations

- Conditional evaluation is a single boolean check per field — negligible overhead
- Callable values add closure invocation overhead only when the condition is true
- `MissingValue` filtering occurs during `resolve()` with O(n) pass over the array — sub-microsecond for typical response sizes
- Avoid nested `mergeWhen()` — use at most one level

## Security Considerations

- **Conditional omission is NOT access control** — always pair with policies and middleware at the endpoint level
- `when()` does not prevent data from being loaded in memory — it only prevents serialization
- Never reference sensitive model attributes (`password`, `remember_token`) in conditional methods — this leaks schema information
- A user who can access the endpoint may infer hidden fields exist by observing response patterns

## Related Rules

- Use Lazy Evaluation for Expensive Computations (Performance)
- Prefer whenHas for Model Attributes and whenNotNull for Computed Values (Design)
- Never Rely on Conditional Omission as Sole Security Mechanism (Security)
- Split Resource When Most Fields Are Conditional (Maintainability)
- Test Every Conditional Path (Testing)
- Limit mergeWhen Nesting to One Level (Maintainability)
- Never Reference Sensitive Model Attributes in when() (Security)
- Do Not Use Conditionals for API Version Branching (Architecture)

## Related Skills

- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)

## Success Criteria

- Each conditional field appears in the response only when its condition is true
- All conditional paths have passing tests for both inclusion and omission
- No security-sensitive fields are exposed through conditional omission alone
- The resource remains readable with fewer than 70% conditional fields
- No version branching logic exists inside conditionals
