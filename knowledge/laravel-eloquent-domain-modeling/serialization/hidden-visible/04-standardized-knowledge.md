# Hidden / Visible — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Hidden / Visible
- **ECC Version:** 1.0

## Overview
`$hidden` and `$visible` on Eloquent models are a declarative attribute filter layer within the serialization pipeline. `$hidden` blacklists attributes from array/JSON output; `$visible` whitelists them. They apply at the attribute level only — relationships are unaffected. Dynamic methods (`makeHidden`, `makeVisible`, `setHidden`, `setVisible`) enable context-aware per-instance overrides. `$pivotHidden` extends the same concept to pivot table attributes on `BelongsToMany` relationships.

## Core Concepts
- `$hidden` — array of attribute names excluded from serialization; deny-list approach
- `$visible` — array of attribute names that form an exclusive allow-list; overrides `$hidden` when set
- `makeHidden()` / `makeVisible()` — per-instance dynamic overrides for context-aware output
- `setHidden()` / `setVisible()` — replace the entire arrays at runtime
- `$pivotHidden` — controls serialization of intermediate table attributes on `BelongsToMany`
- Attribute-level only — does not filter relationships; relationships are controlled by loaded state

## When To Use
- Protecting sensitive columns (passwords, tokens, PII) from appearing in all serialization output
- Creating context-aware responses (admin sees SSN, public does not) via `makeVisible`/`makeHidden`
- Defining a strict API contract with `$visible` — only listed attributes ever appear in output
- Filtering pivot data on many-to-many relationships via `$pivotHidden`

## When NOT To Use
- Do NOT use for relationship-level filtering — hidden/visible applies only to model attributes
- Do NOT use both `$hidden` and `$visible` on the same model — `$visible` takes precedence and `$hidden` is silently ignored
- Do NOT use `$visible` as a security measure without also checking it in tests — a new column added to the model is automatically excluded until added to `$visible`
- Do NOT rely solely on `$hidden` for security-sensitive data — use it as a safety net, not the primary control

## Best Practices (WHY)
- Put sensitive columns (`password`, `remember_token`, `api_token`) in `$hidden` on the base model
- Define `$pivotHidden` on every model with a `BelongsToMany` that has extra pivot columns
- Use `makeHidden`/`makeVisible` on a cloned or fresh instance to avoid mutating shared state
- Use `$visible` for strict API contracts where you want a curated allow-list of exposed attributes
- Feature-test that hidden fields are absent and visible-only fields are absent from API responses

## Architecture Guidelines
- Establish a hidden baseline on a base model class or trait shared across all models
- Use `$visible` sparingly — it's more common to blacklist a few fields than whitelist many
- For complex role-based visibility, use API Resources with conditional attributes instead of runtime `makeVisible` chains
- Filter pivot data via `$pivotHidden` on the model, not in the controller
- Document the hidden/visible strategy per model — especially which attributes are hidden and why

## Performance
- `array_diff_key` and `array_flip` on every serialization is O(n) — negligible for typical attribute counts
- `makeHidden` on collections in loops triggers array rebuild per iteration — serialize after the loop
- No database impact — filtering is purely in-memory array manipulation

## Security
- Hidden attributes are still accessible in PHP via `$model->attribute` — `$hidden` only affects serialization
- `$visible` as allow-list means a new column added to the database is automatically excluded until added — safer than `$hidden` for security but risks missing expected fields
- Audit `$hidden` arrays when new columns are added — a column added without being added to `$hidden` may leak data
- `$pivotHidden` prevents pivot data leakage — sensitive pivot columns like `discount_percentage` or `role_id`

## Common Mistakes
- Setting both `$hidden` and `$visible` — `$visible` wins, `$hidden` is entirely ignored
- Expecting `$hidden` to filter relationships — it only applies to model attributes
- Using `makeHidden` before serialization in a queue job — mutates the same instance for subsequent calls
- Forgetting `$pivotHidden` — pivot tables often contain `created_at` that leaks into API output
- Typo in `$hidden` attribute name — the attribute is not hidden and is silently exposed

## Anti-Patterns
- **`$visible` without testing**: using `$visible` for security but not testing that new columns are added to it, causing silent omission in API responses
- **Instance mutation via `makeHidden`**: calling `makeHidden` on a model passed through a pipeline, affecting downstream consumers
- **No `$pivotHidden` on many-to-many**: exposing every pivot column because `$pivotHidden` was never configured
- **Using `$hidden` as a substitute for `$guarded`**: `$hidden` controls serialization visibility, not mass-assignment protection

## Examples
```php
class User extends Model
{
    protected $hidden = ['password', 'remember_token', 'api_token'];
    protected $pivotHidden = ['created_at', 'updated_at'];
}

// Admin context: reveal hidden fields
$user = User::find($id);
if (auth()->user()->isAdmin()) {
    $user->makeVisible('api_token');
}
return $user->toArray();

// Strict API contract
class Profile extends Model
{
    protected $visible = ['id', 'name', 'avatar', 'bio'];
}

// Pivot filtering
class Role extends Model
{
    protected $pivotHidden = ['pivot_created_at', 'assigned_by'];
}
```

## Related Topics
- to-array-to-json — the serialization pipeline where hidden/visible are applied
- appends — appended accessors are also subject to hidden/visible filtering
- json-resource — Resources provide an alternative layer for attribute visibility control
- conditional-attributes — resource-level conditional inclusion complements model-level hidden/visible

## AI Agent Notes
- Always add `password`, `remember_token`, and `api_token` to `$hidden` on User models
- When adding a new column to a model with `$visible`, add it to `$visible` or the column silently disappears from API output
- `$hidden`/`$visible` do not apply to relationships — use `toArray()` overrides or Resources for that
- Recommend `$pivotHidden` whenever a `BelongsToMany` has extra pivot columns
- Runtime `makeHidden`/`makeVisible` mutate the instance — use with care in shared contexts

## Verification
- [ ] Sensitive columns are listed in `$hidden` on base model or trait
- [ ] `$pivotHidden` is defined for every `BelongsToMany` with extra pivot columns
- [ ] No model uses both `$hidden` and `$visible`
- [ ] Runtime `makeHidden`/`makeVisible` calls use cloned or fresh instances
- [ ] Feature tests assert hidden fields are absent from API responses
- [ ] Feature tests assert visible-only fields are absent when not included
- [ ] New columns added to models are reviewed for `$hidden` inclusion
