# Custom Pivot Models — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Custom Pivot Models
- **ECC Version:** 1.0

## Overview
Custom pivot models extend the base `Pivot` class to attach behavior, accessors, mutators, casts, and business logic to many-to-many intermediary rows. When a pivot table carries more than just foreign keys — timestamps, flags, quantities — a custom pivot model transforms the join row from a passive data carrier into an active domain object.

## Core Concepts
- Extends `Illuminate\Database\Eloquent\Relations\Pivot` (or `MorphPivot` for polymorphic pivots)
- Registered via `->using(CustomPivot::class)` on the `belongsToMany` definition
- Supports accessors, mutators, `$casts`, `$appends`, events, and custom methods
- `Pivot` is a Model subclass with `$incrementing = false` and `$timestamps = false` by default
- Hydrated via `fromRawAttributes()` factory method instead of standard constructor
- Pivot model events do NOT fire during `attach()`/`detach()` — only on explicit `$pivot->save()`

## When To Use
- When the pivot table has extra columns that need type casting (dates, booleans, enums)
- When pivot data needs computed attributes via accessors
- When the relationship itself has domain logic (isActive(), markAsExpired(), renew())
- When you need `$appends` on pivot data in API serialization
- When the pivot requires its own event listeners or observers

## When NOT To Use
- Do NOT use for simple pivot tables with only two foreign keys (no extra columns needed)
- Do NOT use when you're comfortable accessing raw pivot data via `$model->pivot->attribute`
- Do NOT use for polymorphic pivots without extending `MorphPivot` instead of `Pivot`
- Do NOT use `->using()` on only one side of the relationship — must be consistent

## Best Practices (WHY)
- Register `->using()` on BOTH sides of the `belongsToMany` for consistent behavior
- Always extend `MorphPivot` (not `Pivot`) for polymorphic many-to-many relationships
- Call `parent::boot()` in the pivot's `boot()` method to ensure traits initialize
- Explicitly set `$incrementing` based on whether the pivot has its own auto-increment ID
- Add PHPDoc annotations on the relationship model for IDE support on pivot methods
- Use `$casts` on the pivot for automatic type conversion of pivot columns

## Architecture Guidelines
- Keep pivot model classes lean — they represent a relationship, not a full domain entity
- Place domain logic on the pivot that belongs to the relationship, not to either endpoint
- Use pivot accessors for computed values derived from raw pivot columns
- Monitor serialization: `$appends` on pivot models adds to every relationship response
- Custom pivot collections via `newCollection()` override for aggregate methods on pivot sets

## Performance
- Custom pivot models add no query overhead — SQL is identical to standard `BelongsToMany`
- Only extra cost is object instantiation per pivot row (<1µs each)
- Large collections with many pivots generate many pivot model instances
- Expensive accessors or `$appends` on pivot models add serialization cost
- Use lazy property loading or cached accessors for expensive pivot computations

## Security
- Pivot model attributes are serialized in JSON responses — ensure `$hidden` and `$appends` are configured
- `$casts` on pivot models apply to API output — be mindful of data exposure
- Pivot model events don't fire on `attach()`/`detach()` — important for audit/security listeners

## Common Mistakes
- Not calling `->using()` on both sides of the relationship — inconsistent pivot types
- Assuming pivot model events fire on `attach()`/`detach()` — they don't; use relationship events
- Not calling `parent::boot()` in the pivot's `boot()` method — traits don't initialize
- Forgetting `$incrementing` configuration — save operations may fail unexpectedly
- Extending `Pivot` instead of `MorphPivot` for polymorphic pivots — write operations may corrupt data

## Anti-Patterns
- **Custom pivot for every relation**: creating pivot model classes for simple FK-only pivot tables
- **Heavy logic on pivot models**: placing complex business logic on what should be a lightweight relationship object
- **Inconsistent using()**: registering `->using()` on one side but not the other
- **Pivot as full Entity**: treating the pivot as a full aggregate root when it's naturally a value object

## Examples
```php
// Custom pivot model
class Membership extends Pivot
{
    protected $casts = [
        'expires_at' => 'datetime',
        'is_admin' => 'boolean',
    ];

    protected $appends = ['is_active'];

    public function isActive(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->isActive();
    }

    public function renew(int $days = 365): void
    {
        $this->update(['expires_at' => now()->addDays($days)]);
    }
}

// Register on both sides
class User extends Model
{
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class)
            ->using(Membership::class)
            ->withPivot('expires_at', 'is_admin')
            ->withTimestamps();
    }
}

class Team extends Model
{
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(Membership::class)
            ->withPivot('expires_at', 'is_admin')
            ->withTimestamps();
    }
}

// Usage
$user->teams->first()->pivot->isActive(); // true/false
$user->teams->first()->pivot->is_active; // accessor
$user->teams->first()->pivot->renew(30); // custom method
```

## Related Topics
- Pivot Table Conventions — table structure fundamentals
- Pivot Attributes — reading/writing pivot data
- Pivot Events — lifecycle hooks
- Morph Pivot — custom pivots for polymorphic many-to-many

## AI Agent Notes
- Always register `->using()` on both sides of the relationship
- Extend `MorphPivot` for polymorphic pivots, not `Pivot`
- Pivot model events don't fire on `attach()`/`detach()` — use relationship events instead
- Add PHPDoc `@property` annotations for pivot columns on the main model
- Keep pivot models lightweight — they represent an association, not a full entity

## Verification
- [ ] Custom pivot model extends `Pivot` (or `MorphPivot`)
- [ ] `->using()` is called on both sides of the relationship
- [ ] `$casts` and `$appends` are configured correctly
- [ ] `parent::boot()` is called in the pivot's `boot()` method
- [ ] `$incrementing` is correctly configured
- [ ] Pivot methods work as expected via `$model->pivot->method()`
- [ ] Serialization includes pivot data correctly
