# Conditional Attributes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Conditional Attributes
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Conditional attributes allow resource fields to be included or excluded based on runtime conditions: whether a value is present, whether a request parameter is set, whether the user has permission, or whether a relationship is loaded. The primary methods are `when()`, `whenHas()`, `whenNotNull()`, `whenCounted()`, `whenAggregated()`, and `mergeWhen()`.

The engineering value is keeping API responses clean — clients receive only relevant data without needing multiple endpoints. The danger is creating inconsistent API contracts where the same field exists in some responses but not others, making client handling unpredictable.

## Core Concepts
- **`when($condition, $value)`:** Include a field when the condition is truthy. Returns `MissingValue` when falsy, which is stripped during serialization.
- **`whenHas($attribute)`:** Include only if the model attribute exists (not null, not unset). Checks model attribute existence via `isset`.
- **`whenNotNull($value)`:** Include only when the resolved value is not null. Checks the actual value rather than the model attribute.
- **`mergeWhen($condition, array)`:** Inject multiple fields conditionally. When true, the array is merged into the parent; when false, all fields are omitted.
- **Callable values:** Use closures for lazy evaluation — the computation only runs when the condition is true.
- **`MissingValue`:** A special marker class that is stripped during `resolve()`, so the key never appears in the response.

## When To Use
- Permission-based field visibility (admin sees `secret_key`, regular user does not).
- Sparse field selection driven by request parameters.
- Optional fields that only some models have (`bio`, `middle_name`).
- Relationship-based conditional inclusion (see also Conditional Relationships).

## When NOT To Use
- When the shape difference is large (>3 fields). Use separate resources instead.
- When the field must always be present with a null value (e.g., TypeScript interfaces expect the key).
- For access control — conditional omission is not authorization; use policies and middleware.
- When most fields in a resource are conditional — split the resource.

## Best Practices (WHY)
- **Test every conditional path.** Each `when()` condition should have a test verifying inclusion and omission.
- **Document conditional fields in API docs.** Clients need to know which fields are optional and under what conditions they appear.
- **Prefer `whenHas` for optional model attributes and `whenNotNull` for computed values.** `whenHas` checks attribute existence; `whenNotNull` checks the resolved value — they differ when accessors transform nulls.
- **Use callables for expensive computations.** `when($condition, fn() => heavy())` ensures the computation only runs when the condition is true.
- **Keep conditional count low.** A resource with 10 fields and 8 conditionals is hard to understand. Split into separate resources if conditionals dominate.

## Architecture Guidelines
- Conditional attributes are evaluated at response time — they do not affect query logic.
- `mergeWhen()` merges the array when the condition is true. Individual items within the merge can also use `when()`, creating nested conditionals.
- For permission-based fields, combine conditional visibility with proper authorization (policies). The conditional hides the field from the response; the policy prevents unauthorized access to the endpoint.
- When a field could be either present or absent, clients should use optional types (`?` in TypeScript, optional in Dart).

## Performance
- Conditional evaluation is a single boolean check per field — negligible overhead.
- Callable values add closure invocation overhead only when the condition is true.
- `MissingValue` filtering occurs during `resolve()` with O(n) pass over the array — sub-microsecond for typical response sizes.

## Security
- **Conditional omission is NOT access control.** A user who can access the endpoint may infer hidden fields exist. Always pair conditional hiding with proper authorization gates (policies, middleware).
- `when()` does not prevent the data from being loaded in memory — it only prevents serialization. For truly sensitive data, do not load it at all.
- `whenHas('password')` would reveal that a password field exists on the model. Never reference sensitive model attributes in resources.

## Common Mistakes

### Mistaking whenHas for whenNotNull (desc)
Using `whenHas` when `whenNotNull` is needed (or vice versa).
- **Cause:** Confusion between model attribute existence and resolved value.
- **Consequence:** An accessor that transforms null to a default causes `whenHas` to include the field while `whenNotNull` would exclude it.
- **Better:** Use `whenHas` for raw model attributes; use `whenNotNull` for computed or accessor values.

### Eager Callable Evaluation (desc)
Passing a function call result instead of a closure.
- **Cause:** `when($condition, $this->heavy())` — the call executes regardless of the condition.
- **Consequence:** Expensive computation runs even when the field is omitted, defeating the purpose of conditional evaluation.
- **Better:** `when($condition, fn() => $this->heavy())` ensures lazy evaluation.

### Over-Conditionalization (desc)
Making most fields conditional in a single resource.
- **Cause:** Trying to serve multiple endpoint shapes with one resource class.
- **Consequence:** The resource is hard to read, test, and maintain. Clients face unpredictable schemas.
- **Better:** Split into per-endpoint resources (e.g., `UserSummaryResource`, `UserDetailResource`, `AdminUserResource`).

## Anti-Patterns
- **Security-through-omission:** Relying on conditional fields as the sole mechanism for hiding sensitive data. Always add endpoint-level authorization.
- **Nested mergeWhen chaos:** Multiple levels of `mergeWhen()` with overlapping conditions producing unpredictable field sets.
- **Conditional fields as versioning:** Using `when($request->version === 'v1', ...)` instead of proper versioned resources.

## Examples

### Permission-Based Visibility
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'secret_key' => $this->when(
            $request->user()?->isAdmin(),
            $this->secret_key
        ),
    ];
}
```

### Lazy Evaluation
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'report_url' => $this->when(
            $request->user()?->isAdmin(),
            fn() => route('admin.reports', $this->id)
        ),
    ];
}
```

### MergeWhen for Grouped Fields
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        $this->mergeWhen($request->user()?->isAdmin(), [
            'internal_note' => $this->internal_note,
            'access_level' => $this->access_level,
        ]),
    ];
}
```

### Attribute Existence Check
```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'bio' => $this->whenHas('bio'),
        'middle_name' => $this->whenNotNull($this->middle_name),
    ];
}
```

## Related Topics
- Resource Fundamentals — baseline resource structure
- Conditional Relationships — `whenLoaded()`, `whenCounted()`, `whenAggregated()`
- Sparse Fieldsets — client-requested field selection via query parameters
- Top-Level Meta Data — conditional top-level metadata

## AI Agent Notes
- **Generate:** Conditional methods are available in any class extending `JsonResource`.
- **Key constraint:** Every `when()` condition should have a corresponding test.
- **Validation:** If most fields are conditional, the resource should be split.
- **Common fix:** When a field is unexpectedly omitted, check if the condition evaluates to false (not just null) and whether `MissingValue` is returned.
- **Testing pattern:** Use data providers to test field visibility across multiple model states.

## Verification
- [ ] Every conditional attribute has a test verifying both inclusion and omission.
- [ ] No expensive computations inside `when()` without lazy evaluation via closures.
- [ ] Conditional fields are documented as optional in API docs.
- [ ] Sensitive data omission is paired with proper authorization.
- [ ] The resource has not been over-conditionalized (split if >70% of fields are conditional).
- [ ] `mergeWhen()` is not nested beyond one level.
