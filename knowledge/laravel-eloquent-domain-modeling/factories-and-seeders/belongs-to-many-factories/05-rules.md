# BelongsToMany Factory Rules

## Rule 1: Use hasAttached() for All BelongsToMany Factory Relationships
---
## Category
Framework Usage
---
## Rule
Always use `hasAttached()` or the magic `has{Relation}()` method when creating models that share a many-to-many relationship.
---
## Reason
`hasAttached()` handles pivot table insertion automatically, resolves the pivot table name and foreign keys from the relationship definition, and supports pivot attributes. Manually inserting pivot rows couples the factory to schema details and breaks when the relationship changes.
---
## Bad Example
```php
$user = User::factory()->create();
$role = Role::factory()->create();
DB::table('role_user')->insert(['user_id' => $user->id, 'role_id' => $role->id]);
```
---
## Good Example
```php
User::factory()->hasAttached(Role::factory())->create();
```
---
## Exceptions
When testing pivot table constraints or triggers directly. Use raw inserts only in dedicated pivot-specific tests.
---
## Consequences Of Violation
Maintenance: renaming the pivot table or foreign keys requires updating every raw insert. Reliability: factory graph fails silently if pivot column assumptions are wrong.
---

## Rule 2: Use Closures for Varying Pivot Attributes
---
## Category
Maintainability
---
## Rule
Use a closure as the second argument to `hasAttached()` when pivot attributes differ per attachment; use a plain array when all pivot rows share the same values.
---
## Reason
A plain array applies the same values to every pivot row, which is correct for uniform data. A closure receives the related model and returns per-row overrides, enabling per-attachment customization without splitting the factory call.
---
## Bad Example
```php
// Every pivot row gets the same team_id — likely wrong
User::factory()
    ->hasAttached(Role::factory()->count(3), ['team_id' => 1])
    ->create();
```
---
## Good Example
```php
User::factory()
    ->hasAttached(
        Role::factory()->count(3),
        fn () => ['team_id' => Team::factory()->create()->id]
    )
    ->create();
```
---
## Exceptions
When all pivot rows genuinely share the same attribute values. A plain array is simpler and correct in that case.
---
## Consequences Of Violation
Reliability: tests pass with wrong data because all pivot rows look identical. Maintainability: impossible to evolve per-attachment behavior without rewriting the factory chain.
---

## Rule 3: Pass Existing Models for Known Reference Datasets
---
## Category
Performance
---
## Rule
Prefer passing an array of existing model instances to `hasAttached()` when attaching from a known, pre-existing set of related models.
---
## Reason
Passing existing models skips related-model creation while still inserting the correct pivot rows. This avoids redundant writes for reference data (roles, permissions, tags) that already exist in the database.
---
## Bad Example
```php
User::factory()
    ->hasAttached(Role::factory()->count(3)) // Creates 3 new roles
    ->create();
```
---
## Good Example
```php
$admin = Role::firstWhere('name', 'admin');
$editor = Role::firstWhere('name', 'editor');

User::factory()
    ->hasAttached([$admin, $editor])
    ->create();
```
---
## Exceptions
When the related model does not pre-exist and must be created as part of the test scenario.
---
## Consequences Of Violation
Performance: duplicate reference data accumulates across seeding runs. Reliability: tests break when reference data IDs change across environments.
---

## Rule 4: Name Magic has{Relation} Methods According to the Relationship
---
## Category
Code Organization
---
## Rule
Use the magic `has{Relation}()` method name that matches the Eloquent relationship method exactly.
---
## Reason
Laravel's factory resolver derives the magic method from the relationship method name. A mismatch (e.g., `hasRoles()` when the relationship is `roles()`) causes a `BadMethodCallException`. Consistent naming also makes the relationship graph self-documenting.
---
## Bad Example
```php
// Relationship is defined as `roles()`, not `permissions()`
User::factory()->hasPermissions(3)->create();
```
---
## Good Example
```php
// Relationship is defined as `roles()`
User::factory()->hasRoles(3)->create();
```
---
## Exceptions
When the magic method name would collide with an existing method on the factory. Use explicit `hasAttached()` with the relationship name parameter instead.
---
## Consequences Of Violation
Reliability: runtime exception during factory creation. Maintainability: confusing relationship mapping.
---

## Rule 5: Do Not Manually Set Pivot Attributes in the Related Model's Definition
---
## Category
Architecture
---
## Rule
Never define pivot-table columns in the related model's factory `definition()` method.
---
## Reason
Pivot attributes belong to the pivot table, not to the related model's table. Setting them in `definition()` inserts them into the wrong table, causing SQL exceptions or silently populating unrelated columns.
---
## Bad Example
```php
class RoleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->word(),
            'team_id' => 1, // team_id is a pivot column, not a role column
        ];
    }
}
```
---
## Good Example
```php
// Pivot attributes go into hasAttached(), not definition()
User::factory()
    ->hasAttached(Role::factory(), ['team_id' => 1])
    ->create();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: SQL column mismatch errors. Data integrity: pivot data stored in the wrong table.
---

## Rule 6: Use hasAttached() for Count-Controlled Many-to-Many Data
---
## Category
Testing
---
## Rule
Use `hasAttached(Related::factory()->count(N))` when the test needs exactly N related models attached via the pivot.
---
## Reason
Count-based attachment ensures predictable data volumes for assertions. Without the count, each child factory invocation attaches exactly one related model, which may not match test expectations.
---
## Bad Example
```php
// Attaches exactly 1 role — test may expect more
User::factory()->hasAttached(Role::factory())->create();
```
---
## Good Example
```php
// Attaches exactly 3 roles — predictable and assertable
User::factory()->hasAttached(Role::factory()->count(3))->create();
```
---
## Exceptions
When a single attachment is the explicit test requirement.
---
## Consequences Of Violation
Reliability: tests pass or fail non-deterministically as related model counts vary. Test coverage: edge cases with multiple attachments go untested.
---

## Rule 7: Keep hasAttached() Calls Outside of Factory Definitions
---
## Category
Architecture
---
## Rule
Apply `hasAttached()` at the call site, not inside the factory's `definition()` or `configure()` method, unless the attachment is universally required for every model instance.
---
## Reason
Factory definitions should produce the minimum valid model. Many-to-many attachments are scenario-specific. Embedding them in the definition couples every usage of the factory to the attachment, slowing tests and reducing flexibility.
---
## Bad Example
```php
class UserFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(fn (User $user) => $user->roles()->attach(Role::factory()->create()));
    }
}
```
---
## Good Example
```php
// Call-site attachment
User::factory()
    ->hasAttached(Role::factory()->count(2))
    ->create();
```
---
## Exceptions
When the relationship is logically mandatory (e.g., a `User` always has at least one `Role` in an RBAC system). Document the coupling on the factory class.
---
## Consequences Of Violation
Testing: every test pay the cost of attachment, even when roles are irrelevant. Maintainability: changing the attachment logic requires touching all factory consumers.
---
