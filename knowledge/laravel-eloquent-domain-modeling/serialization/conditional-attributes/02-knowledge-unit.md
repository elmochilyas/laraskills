# conditional-attributes

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Conditional attributes in Laravel API Resources provide a declarative syntax for including or excluding keys from JSON output based on runtime conditions. The `when()` family of methods (`when`, `whenHas`, `whenNotNull`, `whenLoaded`, `whenCounted`, `whenAggregated`, `whenPivotLoaded`, `mergeWhen`) enables resource classes to produce context-aware responses without verbose `if` blocks. This keeps resource `toArray()` methods clean while supporting dynamic fields for eager-loaded relationships, present attributes, and boolean conditions.

## Core Concepts

- **`when($condition, $value)`** — Includes `$value` in the array only when `$condition` is truthy. Accepts a Closure for lazy evaluation.
- **`whenHas($attribute)`** — Includes the attribute value only if it exists in the underlying model's attributes.
- **`whenNotNull($value)`** — Includes the key-value pair only when the value is not `null`.
- **`whenLoaded($relation)`** — Includes the relation data only if the relationship has been eager-loaded on the model.
- **`whenCounted($relation)`** — Includes the relation count only if it has been loaded via `withCount`.
- **`whenAggregated($relation, $column, $function)`** — Includes an aggregate (min, max, avg, sum) for a relation only if it was loaded via `withAggregate`.
- **`whenPivotLoaded($pivotTable)`** — Includes pivot data only if the pivot relationship has been loaded.
- **`mergeWhen($condition, $array)`** — Merges an associative array into the output conditionally.
- **`unless($condition, $value)`** — Inverse of `when` — includes value when condition is falsy.

## Mental Models

1. **Declarative conditionals** — Replace `if (condition) { $data['key'] = value; }` with `'key' => $this->when(condition, value)`.
2. **Guarded inclusion** — Each conditional method is a guard: include this field only if the prerequisite is met.
3. **Lazy evaluation** — The value Closure is not invoked when the condition is false, avoiding unnecessary computation.

## Internal Mechanics

```php
// Illuminate\Http\Resources\ConditionallyLoadsAttributes
trait ConditionallyLoadsAttributes
{
    protected function when($condition, $value, $default = null): Conditional|Missing
    {
        return new Conditional(
            value($condition), // Resolve Closure condition
            value($condition) ? value($value) : null,
            $default
        );
    }
    
    // Filter out Missing instances during serialization resolution
    protected function filter(...): array
    {
        // Removes any Conditional or Missing objects from the merged array
    }
}
```

The trait `ConditionallyLoadsAttributes` is used by `JsonResource`. Each `when*()` method returns a `Conditional` or `Missing` wrapper object. These objects are resolved and filtered out during the `resolve()` phase. If the condition is true, the wrapper returns the value; if false, it returns nothing (the key is absent from the final array).

## Patterns

- **Relationship guarding** — Always use `'comments' => $this->whenLoaded('comments')` inside nested resource to prevent N+1.
- **Optional attribute exposure** — `'email_verified' => $this->when($this->email_verified_at !== null, true)`.
- **Role-based fields** — `'ssn' => $this->when(auth()->user()->isAdmin(), $this->ssn)`.
- **Pivot data inclusion** — `'discount' => $this->whenPivotLoaded('order_product', fn() => $this->pivot->discount)`.
- **Aggregate inclusion** — `'comments_count' => $this->whenCounted('comments')`.
- **Conditional array merge** — `$this->mergeWhen($isDetailed, ['bio' => $this->bio, 'website' => $this->website])`.
- **Default values** — `$this->when($condition, $value, $default)` includes default when condition is false.

## Architectural Decisions

- Conditional attributes are implemented as a trait rather than base class methods, allowing reuse outside `JsonResource`.
- The wrapper objects (`Conditional`, `Missing`) defer resolution to the final serialization pass, enabling the array structure to be declared uniformly while conditionals are resolved later.
- `when()` accepts Closures for both condition and value, enabling lazy evaluation — critical for expensive computations.
- The `unless()` method provides the inverse case without requiring negative logic in `when()`.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clean, declarative `toArray()` methods | Debugging conditional inclusion is indirect (wrapper objects) | Use `dd($resource->resolve())` to debug resolved output |
| Lazy evaluation avoids wasted computation | Closure overhead per conditional (negligible for most cases) | Acceptable cost given the readability benefit |
| `whenLoaded()` prevents N+1 effectively | Easy to forget `whenLoaded()` on nested resources | Establish code review rule: all relation fields must use `whenLoaded()` |
| Comprehensive method set covers common cases | Learning curve for the full API (whenHas, whenCounted, etc.) | Start with `when()` and `whenLoaded()`, learn others as needed |

## Performance Considerations

- Each conditional method creates a wrapper object — for resources with 20+ conditionals, this adds minor allocation overhead.
- Closures passed as `$value` are only invoked when the condition is true, saving computation on false branches.
- `whenLoaded()` checks `relationLoaded()` which is O(1) — negligible cost.
- `mergeWhen()` creates a temporary array that's merged — avoid merging very large arrays conditionally if the condition is rarely true.

## Production Considerations

- Always use `whenLoaded()` for any relationship field in a resource to prevent N+1.
- Use `whenNotNull()` instead of `when()` for nullable fields — more explicit and handles the empty string case correctly.
- Use `whenCounted()` rather than `whenLoaded()` for count attributes — ensures the count was loaded via `withCount`, not just the relation.
- Audit conditional attributes during code reviews to ensure no sensitive fields are exposed through incorrect conditions.
- Test both true and false branches of conditional attributes in feature tests.

## Common Mistakes

- Using `when()` with a non-boolean condition — 0, '', and null are falsy; attribute values may unexpectedly exclude fields.
- Using `whenLoaded()` without `with()` eager loading on the query — the field silently disappears from output.
- Using `whenCounted()` on a relation that was loaded via `load()` rather than `withCount()` — the field is absent.
- Nesting conditionals inside conditionals — makes `toArray()` hard to read. Extract into private methods.
- Passing a non-Closure expensive value to `when()` — the value is still evaluated before `when()` receives it.

## Failure Modes

- **Silent omission** — `whenLoaded('relation')` but relation was never loaded — field silently disappears with no error. This is by design but can confuse API consumers.
- **Wrong relation name** — Typo in relation name passed to `whenLoaded()` — always false, field never appears.
- **Truthy pitfalls** — `when('0', $value)` — string '0' is truthy but may be intended as falsy. Use strict comparisons.
- **Missing `mergeWhen` key** — `mergeWhen(true, ['a' => 1])` — the key `a` appears at the top level, but the array spread must happen before other keys.

## Ecosystem Usage

- **Laravel API Resources** — The primary consumer of conditional attributes.
- **Laravel Nova** — Uses similar conditional display logic for resource fields (e.g., `showOnDetail`, `onlyOnDetail`).
- **Laravel Telescope** — Resource serialization uses conditionals internally for request data display.
- **Laravel JSON:API (community)** — The `laravel-json-api` package uses similar conditional attribute concepts.

## Related Knowledge Units

### Prerequisites

- **json-resource** — The resource class where conditional attributes are used.

### Related Topics

- **resource-collection** — Collections also support conditional attributes at the item level.
- **hidden-visible** — Model-level filtering complements resource-level conditionals.

### Advanced Follow-up Topics

None specific — these topics cover the complete conditional attributes system.

## Research Notes

- The conditional attributes trait was introduced in Laravel 5.5 and has remained stable with minor additions.
- `whenCounted()` was added in Laravel 8.x, `whenAggregated()` in Laravel 9.x, `whenPivotLoaded()` in Laravel 7.x.
- The implementation uses a `HigherOrderWhenProxy` for chaining — `$this->when($condition)->...` is also supported.
- Community packages like `spatie/laravel-resource-optional` extend this pattern with additional conditional methods.
