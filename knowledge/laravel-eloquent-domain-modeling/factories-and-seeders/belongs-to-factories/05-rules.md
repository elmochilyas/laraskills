# BelongsTo Factory Rules

## Rule 1: Use for() for All BelongsTo Factory Relationships
---
## Category
Framework Usage
---
## Rule
Always use `for()` or the magic `for{Relation}()` method when creating models that belong to a parent via a `BelongsTo` relationship.
---
## Reason
Directly setting the foreign key attribute in `definition()` bypasses the relationship, creates hidden coupling to column names, and breaks when the relationship is renamed or restructured. `for()` resolves the foreign key from the relationship definition automatically.
---
## Bad Example
```php
Post::factory()->create(['user_id' => 1]);
```
---
## Good Example
```php
Post::factory()->for(User::factory())->create();
```
---
## Exceptions
When you need precise control over the foreign key value for edge-case testing (orphaned records, null FK scenarios). Document why the relationship method is bypassed.
---
## Consequences Of Violation
Maintenance: renaming the foreign key column requires hunting down every hard-coded reference. Reliability: factory silently produces invalid models if the FK column name assumption is wrong.
---

## Rule 2: Pass a Factory for New Parents, Pass an Instance for Existing
---
## Category
Code Organization
---
## Rule
Prefer passing a model instance to `for()` when the parent already exists; pass a factory when the parent must be created on the fly.
---
## Reason
Passing an existing instance avoids redundant database writes and ensures shared references across children. Passing a factory creates a new parent per child, which is correct only when each child needs its own independent parent.
---
## Bad Example
```php
// Creates a new user for every post — wasteful when posts should share one user
Post::factory()->count(5)->for(User::factory())->create();
```
---
## Good Example
```php
$user = User::factory()->create();
Post::factory()->count(5)->for($user)->create();
```
---
## Exceptions
When each child legitimately needs an independent parent (e.g., each order has its own customer). Use `for(User::factory())` per child in that case.
---
## Consequences Of Violation
Performance: redundant parent creation multiplies database writes by the child count. Reliability: test assertions on parent count fail when too many parents are created.
---

## Rule 3: Use Magic for{Relation} Methods for Readability
---
## Category
Maintainability
---
## Rule
Prefer magic `for{Relation}()` methods (e.g., `forUser()`, `forCategory()`) over the generic `for()` when you need parent attribute overrides.
---
## Reason
Magic methods read as natural language and self-document the relationship. `forUser(['name' => 'Admin'])` is immediately clear; `for(User::factory(), ['name' => 'Admin'])` buries the parent factory and overrides in syntax noise.
---
## Bad Example
```php
Post::factory()->for(User::factory(), ['name' => 'Admin', 'email' => 'admin@example.com'])->create();
```
---
## Good Example
```php
Post::factory()->forUser(['name' => 'Admin', 'email' => 'admin@example.com'])->create();
```
---
## Exceptions
When the relationship name is ambiguous (e.g., multiple `BelongsTo` to the same model). Use explicit `for()` with the relationship name as the third argument.
---
## Consequences Of Violation
Maintainability: factory chains become harder to scan and understand. Readability degrades as nesting increases.
---

## Rule 4: Do Not Set Foreign Key Columns Directly in Factory Definitions
---
## Category
Framework Usage
---
## Rule
Never hard-code foreign key columns (e.g., `'user_id' => ...`) in a factory's `definition()` method for `BelongsTo` relationships.
---
## Reason
Foreign key columns are an implementation detail of the database schema. Setting them in `definition()` couples the factory to the column name, breaks when the relationship method changes, and prevents the factory from resolving the relationship automatically.
---
## Bad Example
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'user_id' => User::factory(), // hidden FK coupling
        ];
    }
}
```
---
## Good Example
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
        ];
    }
}

// Relationship applied at call site
Post::factory()->for(User::factory())->create();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Maintenance: renaming the FK column requires changes across all factory definitions. Reliability: factory relationship graph becomes untrustworthy.
---

## Rule 5: Attach Parent Attribute Overrides Positioned Near the Relationship
---
## Category
Code Organization
---
## Rule
Keep parent attribute overrides inside the `for()` or `for{Relation}()` call rather than scattering them across separate state methods.
---
## Reason
Overrides that define the parent's state are part of the relationship setup, not the child's state. Placing them in the `for()` call keeps related configuration in one location and makes the parent's expected shape visible at the call site.
---
## Bad Example
```php
Post::factory()
    ->withAdminUser()
    ->create();

// withAdminUser is defined elsewhere, far from the post creation
```
---
## Good Example
```php
Post::factory()
    ->forUser(['name' => 'Admin', 'is_admin' => true])
    ->create();
```
---
## Exceptions
When the parent configuration is reused across many tests. Extract it to a named state method on the child factory, but document the relationship coupling.
---
## Consequences Of Violation
Maintainability: parent configuration becomes scattered across state methods, making it difficult to see the full creation graph in one place.
---

## Rule 6: Use recycle() When Multiple Children Share the Same BelongsTo Parent
---
## Category
Performance
---
## Rule
Use `recycle()` with a pre-created parent instance when creating many children that all reference the same parent.
---
## Reason
Without `recycle()`, each call to `for(User::factory())` inside a loop creates a new user. With `recycle()`, all children share the same parent, reducing database writes from N+1 to 2.
---
## Bad Example
```php
$posts = collect();
foreach (range(1, 50) as $i) {
    $posts->push(Post::factory()->for(User::factory())->create());
}
// Creates 50 users + 50 posts = 100 DB writes
```
---
## Good Example
```php
$user = User::factory()->create();
$posts = Post::factory()->count(50)->recycle($user)->create();
// Creates 1 user + 50 posts = 51 DB writes
```
---
## Exceptions
When test requirements demand each child has an independent parent (e.g., testing per-user isolation).
---
## Consequences Of Violation
Performance: unnecessary parent creation multiplies seeding time and database load. Test slowness compounds as data volume grows.
---

## Rule 7: Do Not Use for() on Models Without a Defined BelongsTo Relationship
---
## Category
Framework Usage
---
## Rule
Never use `for()` unless the child model has a corresponding `belongsTo()` method defined in its Eloquent class.
---
## Reason
The factory's `for()` method resolves the foreign key and related model from the relationship definition. Without a `belongsTo()` method, the factory cannot determine the foreign key column or the related model class, causing a runtime exception.
---
## Bad Example
```php
// User model has no `belongsTo(Team::class)` defined
User::factory()->for(Team::factory())->create();
```
---
## Good Example
```php
// User model defines `public function team(): BelongsTo { ... }`
User::factory()->for(Team::factory())->create();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: runtime `InvalidArgumentException` during factory creation.
---
