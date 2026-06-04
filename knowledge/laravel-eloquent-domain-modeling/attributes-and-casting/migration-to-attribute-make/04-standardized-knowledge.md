# Migration to Attribute::make — Standardized Knowledge

## Overview

Migrating from legacy accessor/mutator methods to `Attribute::make()` is a systematic refactoring process that modernizes model attribute transformations. The `Attribute::make()` syntax was introduced in Laravel 9 as the preferred way to define accessors and mutators, replacing the older `get{Name}Attribute` and `set{Name}Attribute` convention.

## Key Concepts

- **`Attribute::make()`** — fluent syntax for defining attribute transformations
- **`get` closure** — receives raw value and optional model attributes
- **`set` closure** — receives the assigned value and returns the value to store
- **`shouldCache`** — caches the computed value within a model instance
- **Bidirectional** — get and set can be combined in a single `Attribute::make()`
- **Protected method** — the new method is `protected`, not `public`

## Implementation Details

```php
// Legacy (before)
public function getFullNameAttribute($value): string
{
    return trim("{$this->first_name} {$this->last_name}");
}

public function setPasswordAttribute($value): void
{
    $this->attributes['password'] = bcrypt($value);
}

// Modern (after)
protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn ($value) => trim("{$this->first_name} {$this->last_name}"),
    );
}

protected function password(): Attribute
{
    return Attribute::make(
        set: fn ($value) => bcrypt($value),
    );
}
```

## Best Practices

- Migrate all accessors/mutators in one model per pass when tests exist
- Combine get and set closures in a single `Attribute::make()` when both exist
- Verify return values are identical before and after migration
- Add `shouldCache` selectively based on profiling data
- Remove all legacy methods to avoid duplication
