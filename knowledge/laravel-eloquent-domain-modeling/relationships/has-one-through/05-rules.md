# HasOneThrough Rules

## Rule: Through-Argument-Order-Target-First
---
## Category
Framework Usage
---
## Rule
Always pass the target model as the first argument and the intermediate model as the second argument in `HasOneThrough`.
---
## Reason
The argument order `hasOneThrough(Target, Intermediate, ...)` is counterintuitive (target first). Getting it wrong produces incorrect SQL without immediate errors.
---
## Bad Example
```php
public function avatar(): HasOneThrough
{
    return $this->hasOneThrough(Profile::class, Avatar::class);
    // Wrong order — intermediate and target swapped
}
```
---
## Good Example
```php
public function avatar(): HasOneThrough
{
    return $this->hasOneThrough(Avatar::class, Profile::class);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Incorrect join SQL, wrong query results, silent data corruption.

## Rule: Through-Index-All-Keys
---
## Category
Performance
---
## Rule
Index both `intermediate.parent_id` and `target.intermediate_id` when using `HasOneThrough`.
---
## Reason
The join query traverses both foreign keys. Without indexes on both, the database performs full table scans on the join.
---
## Bad Example
```php
// No indexes on foreign keys in either migration
```
---
## Good Example
```php
Schema::create('profiles', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->index();
});
Schema::create('avatars', function (Blueprint $table) {
    $table->foreignId('profile_id')->constrained()->index();
});
```
---
## Exceptions
Trivially small tables under 1,000 rows.
---
## Consequences Of Violation
Slow join queries, degraded page load times.

## Rule: Through-ReadOnly-Documentation
---
## Category
Maintainability
---
## Rule
Document that `HasOneThrough` is read-only and provide the write path through the intermediate model.
---
## Reason
Consumers unfamiliar with through relationships expect write support. Without documentation, they discover the limitation at runtime via exceptions.
---
## Bad Example
```php
public function avatar(): HasOneThrough
{
    return $this->hasOneThrough(Avatar::class, Profile::class);
}
```
---
## Good Example
```php
/**
 * Read-only. Create avatars via $user->profile->avatar()->create(...).
 */
public function avatar(): HasOneThrough
{
    return $this->hasOneThrough(Avatar::class, Profile::class);
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exceptions, developer confusion, wasted debugging time.

## Rule: Through-Unique-Intermediate
---
## Category
Reliability
---
## Rule
Add `UNIQUE` constraints on both `intermediate.parent_id` and `target.intermediate_id` when using `HasOneThrough`.
---
## Reason
`HasOneThrough` assumes one-to-one cardinality at each hop. Without unique constraints, duplicate intermediate or target records break the one-to-one guarantee.
---
## Bad Example
```php
// No unique constraints — multiple profiles per user possible
Schema::create('profiles', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained();
});
```
---
## Good Example
```php
Schema::create('profiles', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->unique();
});
Schema::create('avatars', function (Blueprint $table) {
    $table->foreignId('profile_id')->constrained()->unique();
});
```
---
## Exceptions
When duplicate intermediates are acceptable and the first match is used.
---
## Consequences Of Violation
Non-deterministic results, data integrity corruption.

## Rule: Through-Not-For-Meaningful-Intermediate
---
## Category
Design
---
## Rule
Do not use `HasOneThrough` when the intermediate model is meaningful in the domain and should be exposed.
---
## Reason
`HasOneThrough` hides the intermediate model, making it invisible to API consumers and view templates. If the intermediate has its own significance, use nested eager loading instead.
---
## Bad Example
```php
// Profile is meaningful (has settings, bio), but hidden by HasOneThrough
$user->avatar; // Profile is invisible
```
---
## Good Example
```php
// Expose the intermediate
$user->profile;
$user->profile->avatar;
```
---
## Exceptions
When the intermediate model is purely structural and has no domain meaning.
---
## Consequences Of Violation
Hidden domain concepts, incomplete API responses, consumer confusion.

## Rule: Through-Nullsafe-Access
---
## Category
Reliability
---
## Rule
Always use nullsafe access (`$user->avatar?->url`) when accessing a `HasOneThrough` target.
---
## Reason
If the intermediate model does not exist, the through relationship returns `null`. Without null protection, accessing attributes on `null` throws a fatal error.
---
## Bad Example
```php
echo $user->avatar->url; // Fatal error if no profile exists
```
---
## Good Example
```php
echo $user->avatar?->url; // null if no profile or avatar
```
---
## Exceptions
When both intermediate and target are guaranteed to exist through application logic.
---
## Consequences Of Violation
Runtime crashes, 500 errors.

## Rule: Through-Cascade-From-Target
---
## Category
Reliability
---
## Rule
Add `ON DELETE CASCADE` from the target table to the intermediate table in the target migration.
---
## Reason
Deleting an intermediate model orphans the target record. Since `HasOneThrough` implies dependent existence, orphans represent data corruption.
---
## Bad Example
```php
Schema::create('avatars', function (Blueprint $table) {
    $table->foreignId('profile_id')->constrained();
    // No cascade — deleting Profile leaves orphaned Avatar
});
```
---
## Good Example
```php
Schema::create('avatars', function (Blueprint $table) {
    $table->foreignId('profile_id')->constrained()->cascadeOnDelete();
});
```
---
## Exceptions
When targets should outlive the intermediate (archival patterns).
---
## Consequences Of Violation
Orphaned target records, wasted storage, stale data.
