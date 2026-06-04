# Conditional Attributes Skills

## Skill: Conditionally include/exclude JSON fields in API Resources using when/whenLoaded/whenCounted

### Purpose
Use the `when()` family of conditional methods in API Resources to include or exclude JSON fields based on runtime conditions (loaded state, authorization, null checks).

### When To Use
- Guarding relationship data behind eager-loading checks to prevent N+1
- Including admin-only or role-sensitive fields conditionally
- Adding computed aggregates (counts, sums) only when available via withCount
- Conditionally merging multiple optional fields with `mergeWhen`
- Including pivot data on many-to-many relationships only when loaded

### When NOT To Use
- For model-level attribute filtering — use `$hidden`/`$visible` instead
- For simple optional fields that are always present — just include them directly
- Without eager loading the relationship — `whenLoaded()` silently omits the field
- With deeply nested conditional chains that make `toArray()` unreadable — extract into private methods

### Prerequisites
- Defined API Resource class extending `JsonResource`
- Relationships used with `whenLoaded()` must be eager-loaded in the parent query
- Aggregates used with `whenCounted()` must be loaded via `withCount()`

### Inputs
- Resource class with `toArray($request)` method
- Model instance with optional eager-loaded relations and aggregates

### Workflow
1. Define the resource array in `toArray()` using direct field mappings for required fields
2. Wrap every nested relationship field in `$this->whenLoaded('relation')`
3. Use `$this->whenCounted('relation')` for withCount aggregate fields
4. Use `$this->whenNotNull($this->field)` for nullable optional fields
5. Use `$this->when($condition, $value)` with explicit boolean conditions for custom gates
6. Use `$this->whenPivotLoaded('table', fn() => ...)` for conditional pivot data
7. Use `$this->mergeWhen($condition, [...])` for grouped related fields
8. Extract complex conditional chains into private named methods
9. Pass Closures for expensive values so they only evaluate when the condition is true

### Validation Checklist
- [ ] All nested resource relationship fields use `whenLoaded()`
- [ ] All withCount fields use `whenCounted()` instead of `whenLoaded()`
- [ ] All nullable optional fields use `whenNotNull()` or explicit `when()` with boolean
- [ ] Expensive values use Closure arguments (not inline expressions)
- [ ] Complex conditional chains are extracted into private methods
- [ ] Tests verify both present and absent conditions for each conditional field
- [ ] `when()` conditions are explicit boolean expressions (not truthy ambiguities)

### Common Failures
- Using `whenLoaded()` without eager loading — field silently disappears from output
- Using `whenCounted()` on a relation not loaded via `withCount()` — field absent with no error
- Non-boolean condition pitfall — `0`, `''`, `null` are falsy and may unexpectedly exclude fields
- Passing expensive non-Closure values — they evaluate before `when()` receives them
- Nested conditionals making `toArray()` unreadable

### Decision Points
- **whenLoaded vs whenCounted?** — Use `whenLoaded()` for relationship data; use `whenCounted()` for scalar aggregate values
- **Generic `when()` vs specific method?** — Prefer `whenLoaded()`, `whenCounted()`, `whenNotNull()` etc. over generic `when()` — they are self-documenting
- **Closure or inline value?** — Use Closures whenever the value requires computation

### Performance Considerations
- Each conditional creates a wrapper object — negligible for typical resource sizes
- Closure values only evaluate when condition is true — saves computation on false branches
- `whenLoaded()` checks `relationLoaded()` which is O(1)
- Resolution phase filters `Missing` wrappers in a single pass

### Security Considerations
- Conditional attributes dependent on `auth()->user()` must not leak data to unauthorized consumers
- Test that conditionally-included sensitive fields are absent for non-admin users
- `when()` with an always-true condition can expose data unexpectedly
- `whenHas()` may reveal existence of attributes (like `deleted_at`) on the model

### Related Rules
- [Conditional-Always-Wrap-WhenLoaded](../conditional-attributes/05-rules.md)
- [Conditional-Use-WhenNotNull](../conditional-attributes/05-rules.md)
- [Conditional-Use-WhenCounted-For-Aggregates](../conditional-attributes/05-rules.md)
- [Conditional-Extract-Complex-Chains](../conditional-attributes/05-rules.md)
- [Conditional-Closures-For-Expensive-Values](../conditional-attributes/05-rules.md)
- [Conditional-Test-Both-Branches](../conditional-attributes/05-rules.md)
- [Conditional-Not-Workaround-For-Missing-Eager](../conditional-attributes/05-rules.md)
- [Conditional-Prefer-Specific-Methods](../conditional-attributes/05-rules.md)
- [Conditional-No-Non-Boolean-Conditions](../conditional-attributes/05-rules.md)
- [Conditional-Use-MergeWhen-For-Groups](../conditional-attributes/05-rules.md)

### Related Skills
- Transform model data into JSON using API Resources

### Success Criteria
- Nested relationships only appear in JSON when eager-loaded
- Aggregate fields only appear when loaded via withCount
- Nullable fields are excluded from output when null
- Admin-only fields are absent from unauthorized responses
- Expensive values are only computed when the condition is true
- Empty collections produce valid `{"data": []}` structure
