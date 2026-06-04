# Legacy Accessor/Mutators — Standardized Knowledge

## Overview

Legacy accessor/mutator methods (using `get{Name}Attribute` and `set{Name}Attribute` conventions) were the standard way to transform model attributes before Laravel 9 introduced the `Attribute::make()` syntax. Understanding the legacy pattern is essential for maintaining and migrating older codebases.

## Key Concepts

- **Legacy accessor** — `public function getFullNameAttribute($value): string { ... }`
- **Legacy mutator** — `public function setPasswordAttribute($value): void { ... }`
- **`$value` parameter** — the raw database value passed to the accessor/mutator
- **Public visibility** — legacy methods are public, exposing internal transformation logic
- **No caching** — legacy accessors recompute on every call with no built-in caching
- **Migration target** — `Attribute::make(get: fn, set: fn)` with `shouldCache` support

## Implementation Details

Legacy pattern:

```php
public function getFullNameAttribute($value): string
{
    return trim("{$this->first_name} {$this->last_name}");
}

public function setPasswordAttribute($value): void
{
    $this->attributes['password'] = bcrypt($value);
}
```

## Best Practices

- Migrate legacy accessors to `Attribute::make()` for consistency and caching
- Change visibility from `public` to `protected` when migrating
- Combine paired get/set methods into a single `Attribute::make()`
- Remove legacy methods after migration to avoid duplication
- Add `shouldCache` only where profiling indicates benefit
