# Pivot Attributes Rules

## Rule: PivotAttr-WithPivot-For-Extra-Columns
---
## Category
Framework Usage
---
## Rule
Always call `->withPivot()` to whitelist every extra pivot column that needs to be read.
---
## Reason
Only the two foreign keys are hydrated onto the pivot model by default. Accessing unwhitelisted extra columns silently returns `null`, causing subtle logic errors.
---
## Bad Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class);
    // expires_at column never hydrated
}

$role->pivot->expires_at; // Always null
```
---
## Good Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class)->withPivot('expires_at', 'level');
}
```
---
## Exceptions
When the pivot table has no extra columns beyond the two foreign keys.
---
## Consequences Of Violation
Silent null returns, broken business logic, difficult debugging.

## Rule: PivotAttr-WithTimestamps-Consistency
---
## Category
Reliability
---
## Rule
Call `->withTimestamps()` on the relationship whenever the pivot migration includes `$table->timestamps()`.
---
## Reason
Without `withTimestamps()`, the `created_at` and `updated_at` columns are never populated during `attach()` or `sync()`, even though the columns exist in the database.
---
## Bad Example
```php
// Migration has ->timestamps()
// Relationship does NOT have ->withTimestamps()
$user->roles()->attach($roleId);
// created_at and updated_at remain null in pivot
```
---
## Good Example
```php
public function roles(): BelongsToMany
{
    return $this->belongsToMany(Role::class)->withTimestamps();
}
```
---
## Exceptions
When the pivot table has a custom timestamp column name that must be handled separately.
---
## Consequences Of Violation
Null timestamp values, broken time-based queries on pivot data.

## Rule: PivotAttr-Selective-Whitelisting
---
## Category
Performance
---
## Rule
Whitelist only the pivot columns that are actually consumed, avoiding `withPivot('*')`.
---
## Reason
Every whitelisted column is selected and hydrated. Large text or JSON columns in pivot tables add significant memory pressure when loading many pivot rows.
---
## Bad Example
```php
return $this->belongsToMany(Tag::class)->withPivot('*');
// All columns selected — potentially wasteful
```
---
## Good Example
```php
return $this->belongsToMany(Tag::class)->withPivot('added_at');
// Only needed columns selected
```
---
## Exceptions
When the pivot table has few columns and all are used.
---
## Consequences Of Violation
Wasted memory, increased data transfer, slower serialization.

## Rule: PivotAttr-Sync-Preserves-Attributes
---
## Category
Reliability
---
## Rule
Use `syncWithoutDetaching()` when existing pivot attributes must be preserved during additive operations.
---
## Reason
`sync()` replaces the entire pivot set. Existing pivot rows not in the ID array are deleted — along with their extra attribute values.
---
## Bad Example
```php
$user->roles()->sync([4, 5]); // Deletes roles 1, 2, 3 with all their pivot attributes
```
---
## Good Example
```php
$user->roles()->syncWithoutDetaching([4, 5]); // Adds 4, 5 without touching existing rows
// Or use sync with attribute arrays for full control
$user->roles()->sync([
    1 => ['expires_at' => $existing->expires_at],
    2 => ['expires_at' => $existing->expires_at],
    4 => ['expires_at' => now()->addYear()],
]);
```
---
## Exceptions
When full replacement with identical attributes is the intended behavior.
---
## Consequences Of Violation
Unintentional data loss of pivot attributes, user-facing inconsistency.

## Rule: PivotAttr-CustomPivot-For-Casting
---
## Category
Maintainability
---
## Rule
Use custom pivot models with `$casts` when pivot attributes need type conversion (dates, booleans, enums).
---
## Reason
The default `Pivot` class does not cast any attributes. Values from the database remain raw strings/ints — no Carbon dates, no boolean conversion.
---
## Bad Example
```php
// With generic Pivot
$role->pivot->expires_at; // Raw string, not Carbon
// Cannot call ->diffForHumans() or ->isPast()
```
---
## Good Example
```php
class Membership extends Pivot
{
    protected $casts = [
        'expires_at' => 'datetime',
        'is_admin' => 'boolean',
    ];
}

// Using Membership pivot
$role->membership->expires_at; // Carbon instance
$role->membership->is_admin;   // true/false boolean
```
---
## Exceptions
When pivot columns are simple types (integers, always-manipulated-as-strings) that don't need casting.
---
## Consequences Of Violation
Type errors, manual formatting boilerplate, date comparison bugs.

## Rule: PivotAttr-SyncWithPivotValues
---
## Category
Framework Usage
---
## Rule
Use `syncWithPivotValues()` (Laravel 10+) when setting the same pivot attributes across multiple IDs.
---
## Reason
Setting the same attributes for multiple IDs with standard `sync()` requires duplicating the attribute array for each ID. `syncWithPivotValues()` accepts a single attribute array applied to all IDs.
---
## Bad Example
```php
$user->roles()->sync([
    1 => ['expires_at' => now()->addYear()],
    2 => ['expires_at' => now()->addYear()],
    3 => ['expires_at' => now()->addYear()],
]);
```
---
## Good Example
```php
$user->roles()->syncWithPivotValues([1, 2, 3], ['expires_at' => now()->addYear()]);
```
---
## Exceptions
When different IDs need different pivot attribute values.
---
## Consequences Of Violation
Code duplication, error-prone repetitive arrays.

## Rule: PivotAttr-Pivot-Serialization-Security
---
## Category
Security
---
## Rule
Be aware that pivot attributes are included in model serialization — limit exposure with `withPivot()` and `$hidden`.
---
## Reason
All whitelisted pivot columns are serialized when the model is converted to JSON or an array. Sensitive pivot data may leak to API responses unintentionally.
---
## Bad Example
```php
return $this->belongsToMany(User::class)->withPivot('internal_note', 'approved_by');
// internal_note exposed in API responses
```
---
## Good Example
```php
// In custom pivot model
protected $hidden = ['internal_note'];

// Or use withPivot selectively
return $this->belongsToMany(User::class)->withPivot('approved_by');
```
---
## Exceptions
When pivot data is intentionally public.
---
## Consequences Of Violation
Sensitive data leakage, compliance violations.
