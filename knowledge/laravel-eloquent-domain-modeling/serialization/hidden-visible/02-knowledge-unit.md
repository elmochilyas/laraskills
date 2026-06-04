# hidden-visible

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

The `$hidden` and `$visible` properties on Eloquent models act as an attribute filter layer within the serialization pipeline. `$hidden` blacklists attributes from array/JSON output; `$visible` whitelists them. These arrays apply at the attribute level and do not affect relationship serialization or in-memory model state. Dynamic methods (`makeHidden`, `makeVisible`, `setHidden`, `setVisible`) allow runtime modifications, enabling context-aware serialization (e.g., hide sensitive data in public APIs, include it for admin responses).

## Core Concepts

- **`$hidden`** — Array of attribute names excluded from serialization. Applied after `toArray()` resolves attributes.
- **`$visible`** — Array of attribute names — only those listed are included. If set, acts as an exclusive whitelist ignored by `$hidden`.
- **`makeHidden()`** — Dynamically adds attributes to the hidden list for a single model instance.
- **`makeVisible()`** — Dynamically removes attributes from the hidden list (or adds to visible) for a single instance.
- **`setHidden()` / `setVisible()`** — Replace the entire hidden/visible arrays at runtime.
- **`getHidden()` / `getVisible()`** — Retrieve the current hidden/visible arrays.
- **Attribute-level only** — These properties filter model attributes, not relationships. Relationships are filtered independently by whether they are loaded.
- **`$hidden` for pivot data** — `$pivotHidden` controls serialization of intermediate table attributes on `BelongsToMany` relationships.

## Mental Models

1. **Gatekeeper at the exit** — `$hidden`/`$visible` are the last filter before serialized data leaves the model. Attributes must pass through the gate to appear in output.
2. **Static default, dynamic override** — The property arrays define the default policy; `makeHidden`/`makeVisible` provide per-instance overrides.
3. **Blacklist vs whitelist** — `$hidden` is a deny-list (block specific keys, allow everything else). `$visible` is an allow-list (block everything, allow specific keys). They are mutually exclusive — setting `$visible` disables `$hidden`.

## Internal Mechanics

```php
// Illuminate\Database\Eloquent\Model
protected function attributesToArray(): array
{
    // ... attribute resolution ...
    return array_diff_key($attributes, array_flip($this->getHidden()));
}

public function getHidden(): array
{
    // If $visible is set, return everything NOT in visible
    if (count($this->getVisible()) > 0) {
        return array_diff(array_keys($this->getAttributes()), $this->getVisible());
    }
    return $this->hidden;
}
```

The `attributesToArray()` method computes the final attribute array, then removes keys present in `$hidden` (or if `$visible` is set, removes keys not in `$visible`). This happens after casts, mutators, and date formatting — meaning hidden/visible filters the already-transformed values.

## Patterns

- **Role-based visibility** — In middleware or controller, call `$model->makeVisible('ssn')` for admin requests or `$model->makeHidden('email')` for public responses.
- **Pivot data filtering** — Use `$pivotHidden` on the model to exclude pivot columns like `created_at` from serialized pivot data.
- **Instance-level transient hides** — Use `->makeHidden(...)` on the fly rather than defining properties for rare exclusions.
- **Resource-level filtering** — In API Resources, call `$this->makeHidden()` inside `toArray()` for context-dependent output.
- **Consistent hidden baseline** — Define sensitive columns (`password`, `remember_token`, `api_token`) in `$hidden` on the base `User` model or a shared trait.

## Architectural Decisions

- Laravel made `$hidden` and `$visible` mutually exclusive by design, simplifying the merge logic: if `$visible` has entries, it's the truth; otherwise use `$hidden`.
- These arrays filter attributes only, not relationships. Relationship visibility is handled separately via `toArray()` overrides or resource classes.
- Dynamic methods (`makeHidden`, `makeVisible`) operate on the instance, not the class, preventing unintended pollution across requests.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple, declarative attribute filtering | `$visible`/`$hidden` only filter top-level attributes, not nested relations | Must use resource classes for fine-grained relation filtering |
| Runtime overrides enable context-aware output | Mutation of instance state can leak across jobs/queues sharing the instance | Always serialize defensively; use `->toArray()` on a fresh instance |
| Pivot filtering via `$pivotHidden` is clear | No built-in depth-conditional hiding (e.g., hide attribute only on 2nd relation level) | Custom `toArray()` overrides needed for complex visibility rules |

## Performance Considerations

- `array_diff_key` and `array_flip` on every serialization call is O(n) — negligible for typical attribute counts (<100).
- `makeHidden` on collections in loops triggers array rebuild per iteration; serialize after the loop.
- No database impact — filtering is purely in-memory.

## Production Considerations

- Never store sensitive attributes (passwords, tokens) in `$visible` as whitelist strategy — a missing attribute in a new migration could accidentally expose data.
- Audit `$hidden` arrays during code reviews whenever new columns are added to models.
- If using `$visible`, ensure `id` and `created_at` are included unless intentionally excluded.
- Test that `makeVisible` is scoped correctly in admin middleware — ensure non-admin requests cannot trigger it through parameter injection.

## Common Mistakes

- Setting both `$hidden` and `$visible` — `$visible` takes precedence, `$hidden` is ignored entirely.
- Expecting `$hidden` to filter relationships — hidden only works on model attributes.
- Using `makeHidden` on a model before serialization in a queue job — mutates the same instance for subsequent serialization calls.
- Forgetting `$pivotHidden` — pivot tables often contain `created_at` that leaks into API output.
- Hiding an attribute used as a computed accessor key — the accessor value is still hidden.

## Failure Modes

- **Whitelist gaps** — Using `$visible` and forgetting to include a new column causes silent omission in all API responses.
- **Instance mutation leak** — A model passed through a pipeline where middleware calls `makeHidden` mutates the original instance, affecting downstream serialization.
- **Pivot data leakage** — Sensitive pivot columns (e.g., `discount_percentage`, `role_id`) exposed because `$pivotHidden` was not defined.
- **Hidden attribute still in DB** — `$hidden` only affects serialization; the attribute is still readable via `$model->attribute` in code.

## Ecosystem Usage

- **Laravel API Resources** — Resources inherit the model's `$hidden`/`$visible` unless `toArray()` is overridden to bypass.
- **Laravel Nova** — Hides `$hidden` fields from resource detail views by default.
- **Laravel Telescope** — Respects `$hidden` when recording model entries.
- **Laravel Sanctum / Breeze** — Default `User` model includes `$hidden` for `password` and `remember_token`.
- **Laravel Passport** — Adds `$hidden` to token-related models.

## Related Knowledge Units

### Prerequisites

- **to-array-to-json** — The serialization pipeline where `$hidden`/`$visible` are applied.

### Related Topics

- **appends** — Appended accessors can also be hidden/visible-controlled.
- **json-resource** — Resources provide an alternative layer for attribute visibility control.

### Advanced Follow-up Topics

None specific — these topics cover the complete visibility system.

## Research Notes

- The mutual exclusivity of `$hidden` and `$visible` has been stable since Laravel 4.2.
- `$pivotHidden` was introduced in Laravel 5.8.
- Community discussions persist about adding relationship-level visibility properties, but Laravel has opted for resource classes as the solution for complex visibility needs.
