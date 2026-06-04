# Factory States Rules

## Rule 1: Name States After Domain Conditions, Not Implementation
---
## Category
Maintainability
---
## Rule
Always name factory state methods after the business condition they represent, not the attribute they set.
---
## Reason
`->admin()` expresses intent: "create an admin user." `->isAdmin(true)` expresses implementation: "set is_admin to true." Intent-oriented names survive refactoring (renaming the column) and are readable by non-technical stakeholders reviewing test scenarios.
---
## Bad Example
```php
public function isAdmin(bool $value): static
{
    return $this->state(['is_admin' => $value]);
}

// Usage: User::factory()->isAdmin(true)->create();
```
---
## Good Example
```php
public function admin(): static
{
    return $this->state(['is_admin' => true]);
}

// Usage: User::factory()->admin()->create();
```
---
## Exceptions
When a state represents a parameterized condition that varies (e.g., `->approvalStatus('pending')`). Use a descriptive method name with a value parameter.
---
## Consequences Of Violation
Maintainability: renaming the database column requires renaming state methods across all test files. Readability: test scenarios are cluttered with implementation details.
---

## Rule 2: Always Return $this from State Methods for Chaining
---
## Category
Framework Usage
---
## Rule
Ensure every state method returns `$this` to enable fluent method chaining.
---
## Reason
Laravel's factory builder expects state methods to return the factory instance for chaining. A void return breaks the chain: `User::factory()->admin()->verified()->create()` would fail because `admin()` returns `null`.
---
## Bad Example
```php
public function admin(): void // void — breaks chaining
{
    $this->state(['is_admin' => true]);
}
```
---
## Good Example
```php
public function admin(): static
{
    return $this->state(['is_admin' => true]);
}
```
---
## Exceptions
No common exceptions. The `: static` return type is a hard requirement.
---
## Consequences Of Violation
Reliability: `Call to a member function on null` error when chaining states.
---

## Rule 3: Compose States Explicitly; Document Conflicts
---
## Category
Maintainability
---
## Rule
Document which factory states conflict with each other and which combination order is expected.
---
## Reason
States compose by overriding earlier values for the same key. `->admin()->unverified()` and `->unverified()->admin()` may produce different results depending on which attribute wins. Without documentation, callers do not know the correct order or which combinations are invalid.
---
## Bad Example
```php
public function admin(): static
{
    return $this->state(['is_admin' => true, 'email_verified_at' => now()]);
}

public function unverified(): static
{
    return $this->state(['email_verified_at' => null]);
}

// Caller: which one wins? Is an unverified admin valid?
```
---
## Good Example
```php
/**
 * Admin state. Always applied before unverified if combining:
 * @example User::factory()->admin()->unverified()->create()
 * Composing admin + unverified produces an unverified admin.
 */
public function admin(): static
{
    return $this->state(['is_admin' => true, 'email_verified_at' => now()]);
}

public function unverified(): static
{
    return $this->state(['email_verified_at' => null]);
}
```
---
## Exceptions
When states set non-overlapping keys and composition order is irrelevant. Document that they are orthogonal.
---
## Consequences Of Violation
Maintainability: callers guess the wrong application order, producing invalid test data. Reliable: composition produces unexpected attribute values.
---

## Rule 4: Extract Repeated Overrides into Named State Methods
---
## Category
Maintainability
---
## Rule
Extract any attribute override used in three or more locations into a dedicated state method on the factory.
---
## Reason
Duplicated attribute arrays violate DRY and spread knowledge of "what makes a user admin" across tests. A single `admin()` method centralizes that knowledge and updates every caller when the definition changes.
---
## Bad Example
```php
// Three tests each repeat the same overrides
$user = User::factory()->create(['is_admin' => true, 'role' => 'superuser']);
$user = User::factory()->create(['is_admin' => true, 'role' => 'superuser']);
$user = User::factory()->create(['is_admin' => true, 'role' => 'superuser']);
```
---
## Good Example
```php
// Single source of truth
$user = User::factory()->admin()->create();
$user = User::factory()->admin()->create();
$user = User::factory()->admin()->create();
```
---
## Exceptions
When the override is a one-time test-specific value that will never be reused. Keep it inline with a comment.
---
## Consequences Of Violation
Maintainability: changing the admin definition requires touching every test file. Reliability: inconsistent admin setups across tests.
---

## Rule 5: Use State Closures for Computed Attributes That Depend on Other Values
---
## Category
Maintainability
---
## Rule
Use a closure inside `state()` when the attribute value depends on other attributes already set in the chain.
---
## Reason
The closure receives the current accumulated attribute array, enabling cross-attribute computation. A static array cannot reference other attributes.
---
## Bad Example
```php
public function fullAccess(): static
{
    return $this->state([
        'role' => 'admin',
        'permissions' => '*', // Should be computed from role
    ]);
}
```
---
## Good Example
```php
public function fullAccess(): static
{
    return $this->state(fn (array $attrs) => [
        'role' => 'admin',
        'permissions' => $attrs['role'] === 'admin' ? '*' : 'read',
    ]);
}
```
---
## Exceptions
When the attribute values are independent of all other attributes. Use a plain array for simplicity.
---
## Consequences Of Violation
Reliability: attributes fall out of sync when computed separately from their dependencies.
---

## Rule 6: Do Not Truncate or Delete Data Inside Factory States
---
## Category
Architecture
---
## Rule
Never perform destructive database operations (truncation, bulk deletion) inside factory state methods.
---
## Reason
Factory states create model instances. Mixing destruction into a creation flow creates surprising side effects for the caller and violates the principle of least astonishment.
---
## Bad Example
```php
public function freshStart(): static
{
    User::truncate(); // Destructive side effect hidden in a state
    return $this->state(['name' => 'First User']);
}
```
---
## Good Example
```php
// Separate concern: cleanup happens explicitly before creation
User::truncate();
User::factory()->create(['name' => 'First User']);
```
---
## Exceptions
No common exceptions. Destructive operations belong in the test or seeder, not in the factory.
---
## Consequences Of Violation
Reliability: tests fail non-deterministically because a state method deleted data that a concurrent test expected.
---

## Rule 7: Use the Built-In trashed() State for Soft-Deletable Models
---
## Category
Framework Usage
---
## Rule
Use the built-in `trashed()` state method instead of manually setting `deleted_at` on soft-deletable models.
---
## Reason
Laravel's `trashed()` state sets `deleted_at` to a valid Faker date, ensuring the soft delete is properly applied. Manual `deleted_at` setting may produce unexpected behavior (null vs Carbon mismatch, validation issues).
---
## Bad Example
```php
Post::factory()->create(['deleted_at' => now()]);
```
---
## Good Example
```php
Post::factory()->trashed()->create();
```
---
## Exceptions
When you need a specific `deleted_at` timestamp for time-sensitive assertions. Override the attribute after the state: `Post::factory()->trashed()->create(['deleted_at' => $specificDate])`.
---
## Consequences Of Violation
Maintainability: every soft-delete scenario re-implements the same logic. Reliability: inconsistent `deleted_at` format across the codebase.
---
