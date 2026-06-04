# conditional-field-inclusion

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: conditional-field-inclusion
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Conditional field inclusion controls which resource attributes appear in API responses based on runtime conditions. Laravel's `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`, and `whenExistsInRequest()` methods enable resources to include or exclude fields dynamically, reducing payload size, avoiding null leakage, and preventing errors from undefined array keys.

These methods return `Conditional` or `MergeValue` proxy objects that are lazily evaluated during `toResponse()` — they do not execute at `toArray()` time. This enables resources to pass conditions through nested compositions unchanged.

## Core Concepts
- **`when($condition, $value)`**: Returns `$value` only when truthy — key is omitted entirely when falsy.
- **`whenHas($attribute)`**: Includes attribute only if it exists on the model and is not null.
- **`whenNotNull($value)`**: Includes only when value is not null — for computed values that may be null.
- **`mergeWhen($condition, $array)`**: Merges associative array into output when condition is true.
- **`whenExistsInRequest($key)`**: Includes attribute only if key is present in the request.
- **`unless($condition, $value)`**: Inverse of `when()` — includes when condition is falsy.
- **Key Omission vs. Null**: False conditions omit the key entirely — different from returning `null`.
- **`ConditionallyLoadsAttributes` Trait**: Provides all conditional methods to `JsonResource`.

## When To Use
- Role-based field visibility (admin gets sensitive fields, regular users don't).
- Load-aware field inclusion (only include profile data when the relation is loaded).
- Request-driven field selection (client requests specific fields via query parameters).
- Environment-aware inclusion (debug fields in non-production only).
- Computed values that are expensive to compute and should only appear when needed.

## When NOT To Use
- For every field in every resource (creates unreadable code with dozens of `when()` wrappers).
- For fields that are always present (adds unnecessary conditional overhead).
- In place of separate resource classes for completely different response shapes.
- For security-sensitive fields that should never be exposed (use authorization, not conditional omission).
- In deeply nested arrays where condition resolution doesn't propagate correctly.

## Best Practices (WHY)
- **Wrap every optional field in `when()`**: Fields that aren't guaranteed to be present should be explicitly conditional — this documents their optionality.
- **Combine `when()` with `whenLoaded()`**: Use `when($this->relationLoaded('profile'))` to avoid N+1 queries while conditionally including nested data.
- **Use `whenNotNull()` for nullable computed values**: Prevents null leakage when a computed accessor returns null for some records.
- **Pre-compute complex conditions**: For expensive boolean checks, compute the condition once and reuse it across multiple `when()` calls.
- **Test every code path**: Each combination of conditions creates a unique response shape — test each variant.

## Architecture Guidelines
- Use `whenHas()` to check model attribute existence rather than raw `when()` to avoid silent omissions.
- For client-requested fields, use `whenExistsInRequest()` to map request parameters to resource fields.
- Role-based conditions belong in the Resource but authorization check results should be passed in, not recomputed.
- Keep conditional logic in Resources, not in controllers — resources own the response shape.
- Document which fields are conditional so API documentation can indicate optionality.

## Performance
- Each `when()` call is a closure or boolean check — hundreds add up. Pre-compute conditions.
- `$this->relationLoaded('x')` is a fast property check — does not trigger a database query.
- When conditions are false, the serialized output is smaller — omitting 50% of fields produces measurably smaller responses.
- Too many condition variants fragment the response cache — each combination is a distinct cache entry.

## Security
- Role-based `when()` conditions are not a substitute for authorization middleware — they only control field visibility.
- A condition that always evaluates to false silently omits a field — the client receives no error. Critical for security fields that must never leak.
- `when(auth()->user()->isAdmin(), ...)` exposes authorization logic to anyone who can read the resource code — ensure this is acceptable.
- Cache poisoning risk: if conditional field visibility varies by role but responses are cached, lower-privilege users may receive privileged data.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning `when()` outside the return array | `$this->when()` called as a statement, not as a value | Misunderstanding return syntax | Condition mechanism doesn't activate | Ensure `when()` is a value in the returned array |
| Using `when()` for non-existent attributes | `when($this->nonexistent)` silently returns false | Assuming attribute exists | Field silently omitted without error | Use `whenHas()` for model attribute existence checks |
| Nested conditional confusion | `when()` inside a nested array from `toArray()` | Not knowing conditionals only resolve at top level | Nested conditionals not evaluated | Handle nested conditions explicitly |
| Omitting `whenNotNull()` for nullable fields | `'field' => $nullableValue` always includes key | Assuming null-safe serialization | Null appears in response even when meaningless | Use `whenNotNull($nullableValue)` |
| Overusing `when()` on every field | Wrapping every field creates 50-line returns | Trying to make everything conditional | Resources become unreadable | Only use `when()` for fields that genuinely vary |

## Anti-Patterns
- **Unconditional Null Leakage**: Returning nullable fields without `whenNotNull()` — nulls appear in every response.
- **Role-Based Cache Poisoning**: Different user roles get different fields via `when()`, but cached responses serve wrong data to wrong roles.
- **Conditional Explosion**: 20+ conditionally included fields with overlapping conditions create an untestable matrix of response shapes.
- **Security via Omission Only**: Relying on `when()` to hide sensitive fields without middleware authorization.
- **Nested Conditional Ignorance**: Putting `when()` inside a sub-array and expecting it to resolve.

## Examples
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'is_admin' => $this->when($request->user()?->isAdmin(), $this->is_admin),
        'profile' => $this->when($this->relationLoaded('profile'), function () {
            return new ProfileResource($this->profile);
        }),
        'last_login_at' => $this->whenNotNull($this->last_login_at),
        'meta_data' => $this->mergeWhen($request->user()?->isAdmin(), [
            'internal_notes' => $this->internal_notes,
            'sensitive_score' => $this->risk_score,
        ]),
    ];
}
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: conditional-relationship-inclusion, conditional-aggregate-inclusion, sparse-fieldset-design
- **Advanced**: json-api-resource-structure

## AI Agent Notes
- Always wrap nullable relationship data in `when($this->relationLoaded(...))`.
- Use `whenNotNull()` for model accessors that may return null.
- For role-gated fields, pass authorization checks as the condition, not as the value.
- Never nest `when()` inside sub-arrays without explicit handling.
- When generating conditional resources, prefer `whenHas()` over bare `when()` for model attribute checks.

## Verification
- Every optional relationship field is wrapped in `whenLoaded()` or `when()`.
- No field returns `null` when the condition is false — keys are omitted, not null.
- Integration tests verify field presence/absence for each condition state.
- Nested `when()` calls inside `toArray()` sub-arrays are explicitly handled.
- Cache keys vary by all conditional factors (user role, request parameters, load state).
