# Appends — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Appends
- **ECC Version:** 1.0

## Overview
`$appends` injects computed attribute values (accessors) into a model's array/JSON output during serialization. When `toArray()` or `toJson()` is called, any attribute listed in `$appends` with a matching accessor (`get{Name}Attribute` or fluent `Attribute::make()->get()`) is evaluated and included. The `append()` method provides runtime appending; `setAppends()` replaces the entire list. This bridges computed domain values into serialization output without custom `toArray()` overrides.

## Core Concepts
- `$appends` — class-level array of accessor names to include in serialization output
- `append()` — dynamically add an attribute to the appends list for a single instance
- `setAppends()` / `getAppends()` — replace or retrieve the current appends array
- Accessor requirement — each appended name requires a corresponding accessor method
- Serialization-only — appended values are injected during serialization; they are not stored in the DB
- Cast appends — appended attributes can also have `$casts` entries for type transformation
- Hidden/visible interaction — appended attributes are subject to `$hidden`/`$visible` filtering

## When To Use
- Computed display values that should appear in every serialization (full name, status label)
- Derived booleans or enums computed from model state (is_active, membership_tier)
- Formatting raw attributes for output (formatted_price, absolute_url)
- Computed values needed across multiple channels (API, queue, broadcast, notifications)

## When NOT To Use
- Do NOT use for heavy computation on frequently serialized models — use API Resources or cached values instead
- Do NOT use when the accessor queries a relationship — this triggers N+1 on collection serialization unless eagerly loaded
- Do NOT use `$appends` for endpoint-specific computed values — use `->append()` at the query site instead
- Do NOT use `$appends` as a substitute for real database columns — if the value is always needed, it should be stored

## Best Practices (WHY)
- Cache expensive accessor results inside the accessor: `$this->cached ??= $this->compute()`
- Use runtime `append()` for endpoint-specific computed values instead of global `$appends`
- Combine `$appends` with `$casts` to type appended values (e.g., `'score' => 'float'`)
- Eager-load relationships used in appended accessors to prevent N+1 during serialization
- Use `setAppends([])` before serialization to disable all appends temporarily when they are not needed

## Architecture Guidelines
- Use `$appends` for computed values that are always needed; prefer `append()` for conditional inclusion
- Extract shared appends into traits (e.g., `HasFullName`) for reuse across models
- Document appended attributes in API documentation to distinguish from DB columns
- Consider API Resources as an alternative for computed fields at the HTTP boundary
- Never put business logic that writes to the database inside an appended accessor

## Performance
- Every `toArray()` call on a model with appends invokes all accessor methods — each may run queries
- Cache expensive accessor results with instance caching (`$this->cached ??= compute()`)
- Collection serialization: N models × M appends = N×M accessor calls
- Append-heavy models returned in listing endpoints multiply serialization cost per page
- Accessor caching is per-instance — fresh models from the database don't share cached values

## Security
- Appended attributes can expose computed data that should not be revealed — apply `$hidden` to sensitive append keys
- An accessor that throws an exception causes the entire `toArray()` call to fail — handle errors gracefully
- Ensure appended accessors do not access unloaded relationships that could expose unauthorized data
- Audit appended accessors during code review — they are less visible than controller logic

## Common Mistakes
- Defining `$appends` but forgetting to create the accessor method — throws `BadMethodCallException`
- Appending an attribute that queries a relation without eager-loading it — N+1 on serialization
- Expecting `$appends` to work only on serialization — `$model->appended_value` also works via `__get`
- Using `$appends` for heavy computation on a dashboard endpoint that serializes many models
- Appending the same name as a real column — the real column takes precedence, accessor is not called

## Anti-Patterns
- **Heavy accessor in `$appends`**: running queries or expensive computation on every serialization instance
- **No caching for expensive accessors**: recomputing the same value multiple times on the same model instance
- **Using `$appends` when API Resources would be cleaner**: adding accessors to models only for a single API endpoint
- **Append dependency chain**: append A calls append B calls append C — fragile and hard to debug

## Examples
```php
class User extends Model
{
    protected $appends = ['full_name', 'is_admin'];

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    protected function isAdmin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->role === 'admin',
        );
    }

    // Expensive accessor with caching
    protected function score(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->cachedScore ??= $this->computeScore(),
        );
    }
}

// Runtime appending
$user = User::find(1);
$serialized = $user->append('expensive_metric')->toArray();

// Disable appends for bulk export
$users = User::all()->each(fn ($u) => $u->setAppends([]));
```

## Related Topics
- to-array-to-json — the serialization pipeline where appends are injected
- hidden-visible — appended attributes are subject to hidden/visible filtering
- json-resource — alternative approach for computed fields in serialization
- accessors-and-mutators — defining the accessors that `$appends` references

## AI Agent Notes
- When adding `$appends`, always verify the accessor method exists — a missing accessor throws at serialization time
- For expensive accessors, recommend instance caching: `$this->cached ??= compute()`
- Use runtime `append()` for endpoint-specific values; `$appends` for global always-needed values
- Check that relationships used in appended accessors are eager-loaded at the query site
- Appended attributes respect `$hidden` — if a sensitive append needs protection, add it to `$hidden`

## Verification
- [ ] All accessors referenced in `$appends` are defined on the model
- [ ] Expensive accessors use instance caching (`$this->cached ??= ...`)
- [ ] Accessors requiring relationships have those relationships eager-loaded at call sites
- [ ] Listing endpoints are not serializing heavy `$appends` on every model
- [ ] Appended attributes are documented in API specs
- [ ] Tests cover accessor behavior with null/empty/missing relationship data
- [ ] No circular append dependencies exist
