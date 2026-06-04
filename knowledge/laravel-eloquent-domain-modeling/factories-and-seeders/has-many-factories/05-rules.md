# HasMany Factory Rules

## Rule 1: Use has() for All HasMany Factory Relationships
---
## Category
Framework Usage
---
## Rule
Always use `has()` or the magic `has{Relation}()` method when creating a parent model with owned child models.
---
## Reason
`has()` automatically resolves the foreign key from the `HasMany` relationship definition and creates children with the correct parent ID. Manually creating children and assigning the foreign key duplicates relationship logic and breaks when the relationship is renamed.
---
## Bad Example
```php
$user = User::factory()->create();
Post::factory()->count(3)->create(['user_id' => $user->id]);
```
---
## Good Example
```php
User::factory()->has(Post::factory()->count(3))->create();
```
---
## Exceptions
When the foreign key column differs from the convention and the relationship cannot be auto-resolved. Use explicit `for()` on the child factory instead.
---
## Consequences Of Violation
Maintenance: renaming the FK column requires updates to every manual creation site. Reliability: FK assignment errors with non-conventional column names.
---

## Rule 2: Use Magic has{Relation} Methods for Readability
---
## Category
Maintainability
---
## Rule
Prefer magic `has{Relation}()` methods (e.g., `hasPosts()`, `hasComments()`) for simple child creation with only a count.
---
## Reason
`User::factory()->hasPosts(3)` is immediately readable as "a user with 3 posts." The generic `has()` form buries the relationship in a factory call and is harder to scan in complex factory chains.
---
## Bad Example
```php
User::factory()
    ->has(Post::factory()->count(3))
    ->has(Profile::factory())
    ->create();
```
---
## Good Example
```php
User::factory()
    ->hasPosts(3)
    ->hasProfile()
    ->create();
```
---
## Exceptions
When the child factory needs states, sequences, or custom attributes. Use the explicit `has()` form for complex child configuration.
---
## Consequences Of Violation
Maintainability: factory chains are longer and harder to scan. Readability: relationship intent is less clear.
---

## Rule 3: Pass Attribute Overrides as the Second Argument to has()
---
## Category
Code Organization
---
## Rule
Use the second argument of `has()` to override child attributes when all children should share the same values.
---
## Reason
The second argument applies overrides uniformly to every child model, eliminating the need for repeated `->state()` calls on each child factory.
---
## Bad Example
```php
User::factory()
    ->has(Post::factory()->count(3)->state(['published' => true]))
    ->create();
```
---
## Good Example
```php
User::factory()
    ->has(Post::factory()->count(3), ['published' => true])
    ->create();
```
---
## Exceptions
When children need different overrides per instance. Use a `sequence()` on the child factory instead.
---
## Consequences Of Violation
Maintainability: unnecessary chaining obscures the intent of uniform overrides.
---

## Rule 4: Nest Relationships for Complete Graph Creation
---
## Category
Code Organization
---
## Rule
Nest `has()` calls to create multi-level model graphs in a single fluent expression.
---
## Reason
Nesting produces a complete, consistent graph in one call. Separate creation steps risk data inconsistency (e.g., comments referencing a different user's post) and obscure the domain structure.
---
## Bad Example
```php
$user = User::factory()->create();
$post = Post::factory()->for($user)->create();
$comment = Comment::factory()->for($post)->for($user)->create();
```
---
## Good Example
```php
User::factory()
    ->has(Post::factory()
        ->has(Comment::factory()->count(3)))
    ->create();
```
---
## Exceptions
When the nesting depth makes the expression unreadable (4+ levels). Break into intermediate variables with clear names.
---
## Consequences Of Violation
Maintainability: multi-step creation obscures the domain graph structure. Reliability: intermediate state may leak across test boundaries.
---

## Rule 5: Use has() Instead of afterCreating for Child Relationships
---
## Category
Framework Usage
---
## Rule
Prefer `has()` over `afterCreating()` callbacks for creating child models in `HasMany` relationships.
---
## Reason
`has()` is declarative, auto-resolves the foreign key, and documents the relationship at the call site. An `afterCreating()` callback hides the relationship inside the factory, making it impossible for callers to control or omit child creation without overriding.
---
## Bad Example
```php
// Inside PostFactory:
public function configure(): static
{
    return $this->afterCreating(fn (Post $post) => Comment::factory()->count(3)->create([
        'post_id' => $post->id,
    ]));
}
```
---
## Good Example
```php
// At call site:
Post::factory()->has(Comment::factory()->count(3))->create();
```
---
## Exceptions
When the child creation is universally required for every instance of the parent. Even then, consider making it a default state that can be overridden.
---
## Consequences Of Violation
Testing: every test pays the cost of child creation. Maintainability: callers cannot opt out of the relationship.
---

## Rule 6: Use the Same Count Across Related Factories for Balanced Data
---
## Category
Testing
---
## Rule
Choose meaningful, balanced counts when creating parent-child graphs to ensure test assertions are predictable.
---
## Reason
Random or mismatched counts produce unpredictable data volumes that make assertions on query results unreliable. A known, balanced count (3 posts per user, 5 comments per post) produces predictable pagination, aggregation, and relationship assertion results.
---
## Bad Example
```php
// Counts are mismatched — hard to assert on pagination or averages
User::factory()
    ->has(Post::factory()->count(fake()->numberBetween(1, 10)))
    ->create();
```
---
## Good Example
```php
// Known, balanced counts
User::factory()
    ->has(Post::factory()->count(3))
    ->create();
```
---
## Exceptions
When the test specifically validates behavior with varying data volumes. Use configuration-driven counts in that case.
---
## Consequences Of Violation
Testing: flaky assertions on counts, sums, and pagination. Debugging: test failures cannot be reproduced consistently.
---

## Rule 7: Do Not Use has() for BelongsTo or BelongsToMany Relationships
---
## Category
Framework Usage
---
## Rule
Never use `has()` for `BelongsTo` or `BelongsToMany` relationships. Use `for()` and `hasAttached()` respectively.
---
## Reason
`has()` assumes the child's table holds the foreign key to the parent (one-to-many). For `BelongsTo`, the relationship is reversed — the foreign key is on the caller's table. For `BelongsToMany`, a pivot table is involved. Using `has()` for either produces incorrect SQL and runtime errors.
---
## Bad Example
```php
// Post belongsTo User — using has() is backwards
User::factory()->has(Post::factory())->create();
```
---
## Good Example
```php
// Post belongsTo User — use for()
Post::factory()->for(User::factory())->create();
```
---
## Exceptions
No common exceptions. Relationship methods are not interchangeable.
---
## Consequences Of Violation
Reliability: runtime SQL errors or incorrect foreign key assignments.
---
