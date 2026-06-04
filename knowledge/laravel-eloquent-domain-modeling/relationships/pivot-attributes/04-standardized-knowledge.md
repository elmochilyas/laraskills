# Pivot Attributes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Attributes
- **ECC Version:** 1.0

## Overview
Pivot attributes are the extra columns on a many-to-many pivot table beyond the two foreign keys. Eloquent provides `withPivot()` to whitelist which columns are hydrated onto the pivot model, and `withTimestamps()` for timestamp columns. Reading uses `$model->pivot->attribute`; writing uses `attach()`, `sync()`, and `updateExistingPivot()`.

## Core Concepts
- By default, only the two FK columns are hydrated — extra columns require `->withPivot(...)` 
- `->withTimestamps()` adds `created_at` and `updated_at` to the hydrated columns
- Reading: `$role->pivot->expires_at` — access via the dynamically created `pivot` property
- Writing via `attach($id, ['column' => 'value'])` — Extra attributes in the second argument
- Writing via `sync([1 => ['column' => 'value'], 2 => ['column' => 'value']])` — attribute arrays per ID
- `updateExistingPivot($id, ['column' => 'value'])` — update a single pivot row
- Custom pivot models provide type casting and accessors for pivot attributes

## When To Use
- Any many-to-many pivot table with extra columns beyond the two foreign keys
- Storing metadata on the relationship: quantity, expiry date, role within the relationship
- Timestamped pivots to track when relationships were created/updated
- Computed pivot values via accessors on custom pivot models

## When NOT To Use
- Do NOT use `withPivot()` for columns you don't need — wastes memory and bandwidth
- Do NOT use raw pivot attribute access when type safety matters — use custom pivot models
- Do NOT use `sync()` with attributes when you need to preserve unspecified existing attributes
- Do NOT expose pivot data in API responses without considering data leakage

## Best Practices (WHY)
- Call `->withPivot()` for every extra column you need to read — missing columns silently return null
- Use `->withTimestamps()` consistently when the pivot migration includes timestamps
- Use `syncWithoutDetaching()` when you want additive-only behavior without losing existing pivot data
- For bulk pivot attribute updates, prefer `sync()` with attribute arrays over individual `updateExistingPivot()` calls
- Use custom pivot models with `$casts` for automatic type conversion of pivot attributes

## Architecture Guidelines
- Whitelist only needed pivot columns — avoid selecting everything unless all columns are consumed
- Keep `withPivot()` calls in sync with the migration — add columns to both when extending
- Use `syncWithPivotValues($ids, $attributes)` (Laravel 10+) for setting same attributes across multiple IDs
- For read-only pivot attributes, manage them through dedicated pivot model methods, not the relationship
- Be explicit about whether pivot timestamps are expected — document the relationship clearly

## Performance
- Every extra pivot column selected in the join query adds to the result set size
- Large text/JSON pivot columns increase memory pressure — select only what's needed
- Timestamp columns add minimal overhead (8 bytes each) and are generally safe to include
- Custom pivot models add no query overhead — only extra object instantiation

## Security
- Pivot data is included in model serialization — use `withPivot()` to limit exposed columns
- Custom pivot models can use `$hidden` to prevent pivot attribute exposure
- Validate pivot attribute values before `attach()`/`sync()` — invalid values fail at DB level
- Be aware that pivot data in API responses may leak relationship metadata

## Common Mistakes
- Accessing pivot attributes without `withPivot()` — silent null returns
- Forgetting `withTimestamps()` on a timestamped pivot — timestamps never populated
- Passing nested arrays to `attach()` incorrectly — `attach()` with existing pairs creates duplicates
- Assuming pivot attributes are cast without a custom model — raw strings/ints without casting

## Anti-Patterns
- **Selecting all pivot columns**: using `withPivot('*')` or not filtering — wastes memory and may leak data
- **Missing withPivot for needed columns**: reading `$pivot->column` that's always null because it's not whitelisted
- **sync() losing data**: using `sync()` without `detach => false` and losing existing pivot attributes
- **No casting on pivot dates**: expecting Carbon instances from generic Pivot model

## Examples
```php
// Relationship with pivot columns
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('expires_at', 'level')
            ->withTimestamps()
            ->as('membership');
    }
}

// Reading pivot attributes
foreach ($user->roles as $role) {
    echo $role->membership->expires_at; // raw string unless cast
    echo $role->membership->level;
    echo $role->membership->created_at; // from withTimestamps
}

// Writing pivot attributes
$user->roles()->attach($roleId, [
    'expires_at' => now()->addYear(),
    'level' => 3,
]);

// Sync with attributes
$user->roles()->sync([
    1 => ['expires_at' => now()->addYear(), 'level' => 3],
    2 => ['expires_at' => now()->addMonth(), 'level' => 1],
]);

// Update single pivot row
$user->roles()->updateExistingPivot($roleId, [
    'expires_at' => now()->addYear(),
]);

// Sync with same values for all IDs (Laravel 10+)
$user->roles()->syncWithPivotValues([1, 2, 3], ['expires_at' => now()->addYear()]);
```

## Related Topics
- Pivot Table Conventions — table naming and migration design
- Custom Pivot Models — type safety for pivot attributes
- Pivot Events — reacting to changes in pivot attribute values
- BelongsToMany — many-to-many relationship type

## AI Agent Notes
- Always call `->withPivot()` for extra columns — missing columns silently return null
- Use `->withTimestamps()` when the pivot migration has timestamp columns
- `sync()` with attributes replaces all pivot rows — use `syncWithoutDetaching()` for additive-only
- Custom pivot models provide casting — generic Pivot does not cast attributes
- `syncWithPivotValues()` is a convenience method for setting the same attributes across multiple IDs

## Verification
- [ ] All needed extra pivot columns are whitelisted via `withPivot()`
- [ ] `withTimestamps()` is called when pivot has timestamp columns
- [ ] Pivot attributes are readable via `$model->pivot->attribute`
- [ ] `attach()` with extra columns inserts them correctly
- [ ] `sync()` with attribute arrays updates correctly
- [ ] Custom pivot model casts pivot attributes to expected types
- [ ] Pivot data in API responses is limited to intended columns
