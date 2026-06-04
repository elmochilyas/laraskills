# Conditional Attributes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Conditional Attributes
- **ECC Version:** 1.0

## Overview
Conditional attributes in Laravel API Resources provide a declarative syntax for including or excluding keys from JSON output based on runtime conditions. The `when()` family of methods (`when`, `whenHas`, `whenNotNull`, `whenLoaded`, `whenCounted`, `whenAggregated`, `whenPivotLoaded`, `mergeWhen`) enables resource classes to produce context-aware responses without verbose `if` blocks. Each method returns a wrapper object that is resolved during the final serialization pass.

## Core Concepts
- `when($condition, $value, $default)` — includes `$value` when `$condition` is truthy; accepts Closures for lazy evaluation
- `whenHas($attribute)` — includes the attribute value only if it exists in the model's attributes
- `whenNotNull($value)` — includes the value only when it is not `null`
- `whenLoaded($relation)` — includes relation data only if the relationship has been eager-loaded
- `whenCounted($relation)` — includes relation count only if loaded via `withCount`
- `whenAggregated($relation, $column, $function)` — includes loaded aggregate (min, max, avg, sum)
- `whenPivotLoaded($table)` — includes pivot data only if the pivot has been loaded
- `mergeWhen($condition, $array)` — conditionally merges an associative array into output
- `unless($condition, $value)` — inverse of `when`; includes value when condition is falsy

## When To Use
- Guarding relationship data behind eager-loading checks to prevent N+1
- Including admin-only or role-sensitive fields conditionally
- Adding computed aggregates (counts, sums) only when they are available
- Conditionally merging multiple optional fields with `mergeWhen`
- Including pivot data on many-to-many relationships only when loaded

## When NOT To Use
- Do NOT use for model-level attribute filtering — use `$hidden`/`$visible` instead
- Do NOT use for simple optional fields that are always present — just include them directly
- Do NOT use `whenLoaded()` without eager loading in the parent query — the field silently disappears
- Do NOT use nested `when()` chains that make `toArray()` unreadable — extract into private methods

## Best Practices (WHY)
- Always use `whenLoaded()` for every relationship field in a resource to prevent N+1
- Use `whenNotNull()` for nullable fields instead of `when()` — more explicit and handles empty strings
- Use `whenCounted()` for `withCount` fields rather than `whenLoaded()` — ensures the count was actually loaded
- Pass Closures as the `$value` for expensive computations — they are only evaluated when the condition is true
- Test both true and false branches of conditional attributes in feature tests

## Architecture Guidelines
- Keep conditional logic in resources, not in models — resources are the presentation layer
- Extract complex conditional logic into private methods on the resource class
- Use `mergeWhen()` for grouping multiple optional fields that are always included together
- Use `unless()` when the inverted condition reads more naturally than `when(!condition, ...)`
- Document which fields in an API response are conditional so consumers know they may be absent

## Performance
- Each conditional method creates a wrapper object — for resources with 20+ conditionals, minor allocation overhead
- Closures passed as `$value` are only invoked when the condition is true — saves computation on false branches
- `whenLoaded()` checks `relationLoaded()` which is O(1) — negligible cost
- `mergeWhen()` creates a temporary array that's merged — avoid merging very large arrays conditionally
- The resolution phase filters out `Missing` wrappers in a single pass — efficient for typical resource sizes

## Security
- Conditional attributes that depend on `auth()->user()` must not leak data to unauthorized consumers
- Test that conditionally-included sensitive fields are absent for non-admin users
- `when()` with a condition that always evaluates to true by mistake can expose data unexpectedly
- `whenHas()` may reveal the existence of certain attributes (like `deleted_at`) on the underlying model

## Common Mistakes
- Using `when()` with a non-boolean condition — `0`, `''`, and `null` are falsy and may unexpectedly exclude fields
- Using `whenLoaded()` without `with()` eager loading — the field silently disappears from output
- Using `whenCounted()` on a relation loaded via `load()` rather than `withCount()` — field absent with no error
- Nesting conditionals inside conditionals — makes `toArray()` unreadable; extract to private methods
- Passing a non-Closure expensive value to `when()` — the value is evaluated before `when()` receives it

## Anti-Patterns
- **Guessing relation load state**: not using `whenLoaded()` for relationship fields and relying on null coalescing — still triggers N+1 on unloaded relations
- **Non-boolean condition pitfall**: using `when($model->relation, ...)` which returns a collection (always truthy) instead of checking existence
- **Over-conditionalizing**: wrapping every field in `when()` even when the field is always present — adds noise without benefit
- **Silent omission as debugging trap**: `whenLoaded()` with a typo in the relation name — field never appears, no error

## Examples
```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'author' => UserResource::make($this->whenLoaded('author')),
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'comments_count' => $this->whenCounted('comments'),
            'summary' => $this->whenNotNull($this->summary),
            'is_featured' => $this->when($this->featured_at !== null, true),
            'edited_at' => $this->when($this->created_at != $this->updated_at, $this->updated_at),
            'pivot_discount' => $this->whenPivotLoaded('post_tag', fn () => $this->pivot->discount),
            $this->mergeWhen($request->user()?->isAdmin(), [
                'editor_notes' => $this->internal_notes,
                'ip_address' => $this->ip,
            ]),
        ];
    }
}
```

## Related Topics
- json-resource — the resource class where conditional attributes are used
- resource-collection — collections also support conditional attributes at the item level
- hidden-visible — model-level filtering complements resource-level conditionals
- eager-loading — prerequisite for `whenLoaded()` to function correctly

## AI Agent Notes
- Always wrap relationship fields in `whenLoaded()` — this is the most common conditional and prevents N+1
- Use `whenNotNull()` for optional nullable fields — it's more explicit than `when($this->field)`
- Prefer specific methods (`whenLoaded`, `whenCounted`, `whenPivotLoaded`) over generic `when()` when applicable
- Closure values are lazy — use them for expensive computations to avoid unnecessary work
- Remember that `when('0', $value)` treats string '0' as truthy in PHP — use strict comparisons when needed

## Verification
- [ ] All nested resource relationships use `whenLoaded()` to guard against N+1
- [ ] All `withCount` fields use `whenCounted()` instead of `whenLoaded()`
- [ ] All nullable fields use `whenNotNull()` instead of manual null checks
- [ ] Closure values are used for expensive computations (not inline expressions)
- [ ] Tests verify both present and absent conditions for each conditional field
- [ ] No sensitive data exposed through incorrect conditional logic
- [ ] `mergeWhen()` is not used to merge user-controlled data
