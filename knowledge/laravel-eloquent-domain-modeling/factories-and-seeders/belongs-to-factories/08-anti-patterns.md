# BelongsTo Factories — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | BelongsTo Factories |
| Focus | Anti-patterns in belongs-to factory relationship usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Direct Foreign Key Assignment (Bypassing `for()`) | Framework Usage | High |
| 2 | Hard-Coded FK in Factory `definition()` | Design | High |
| 3 | Redundant Parent Creation with Factory Per Child | Performance | High |
| 4 | N+1 Parent Creation Without `recycle()` | Performance | Medium |
| 5 | Generic `for()` with Nested Factory Syntax | Maintainability | Medium |
| 6 | Missing BelongsTo Relationship Definition | Reliability | Critical |

## Repository-Wide Cross-Cutting Patterns

- The most common anti-pattern is hard-coding foreign key column values (e.g., `'user_id' => 1`) instead of using `for()` to resolve the relationship through the model definition
- Passing `Parent::factory()` to `for()` for every child when they should share one parent creates N redundant parent records
- Using generic `for()` with nested factory arguments instead of magic `for{Relation}()` methods reduces call-site readability

---

## 1. Direct Foreign Key Assignment (Bypassing `for()`)

### Category
Framework Usage

### Description
Creating child models by directly assigning the foreign key column value (e.g., `'user_id' => 1`) instead of using the `for()` or magic `for{Relation}()` method to establish the BelongsTo relationship through the factory.

### Why It Happens
Newer developers may not know `for()` exists. Direct assignment is the most obvious approach — "just set the column." Legacy code written before factory relationships were well-understood may use this pattern.

### Warning Signs
- `SomeModel::factory()->create(['foreign_key_id' => $id])` patterns
- Factory call sites that manually look up parent IDs and pass them as attributes
- Test code that creates a parent, gets its ID, and passes it to the child factory
- No `for()` or `for{Relation}()` calls in factory usage
- Foreign key values hard-coded as integers in factory calls
- Breaking tests when a foreign key column is renamed

### Why Harmful
- Creates hidden coupling from the factory call site to the database column name
- Renaming the foreign key column requires updating every call site
- The factory doesn't leverage Laravel's relationship resolution — manual work
- The child may be created with an invalid foreign key (no corresponding parent)
- No visual indication in the factory chain that a relationship is being established

### Consequences
- `Post::factory()->create(['user_id' => 1])` assumes user ID 1 exists — brittle test
- Renaming `user_id` to `author_id` requires a full-text search for all `'user_id'` strings
- A test creates a post with `user_id => 999` — no error at factory time, only at query time
- New team members don't see that `for()` is the intended pattern
- Factory call sites are inconsistent — some use `for()`, some use direct assignment

### Preferred Alternative
```php
Post::factory()->for(User::factory())->create();  // New parent
Post::factory()->for($existingUser)->create();     // Existing parent
```

### Refactoring Strategy
1. Identify factory call sites with direct foreign key assignments
2. Replace `'fk_column' => $value` with `for()` using either a factory or existing instance
3. For parent ID lookups, replace with passing the parent model instance directly
4. Remove any manual parent creation and ID extraction patterns
5. Verify the relationship resolves correctly by asserting the child's relation is non-null

### Detection Checklist
- [ ] Search for `::factory()->create([` followed by foreign key column names
- [ ] Check for patterns that create a parent, extract ID, pass to child
- [ ] Verify factory call sites use `for()` or `for{Relation}()` for BelongsTo
- [ ] Count hard-coded foreign key values in test/seeder files
- [ ] Review if renaming an FK column would require changes beyond the model

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use for() for All BelongsTo Factory Relationships |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |
| Knowledge | `04-standardized-knowledge.md` — BelongsTo Factories |

---

## 2. Hard-Coded FK in Factory `definition()`

### Category
Design

### Description
Including foreign key column assignments (e.g., `'user_id' => User::factory()`) inside a factory's `definition()` method rather than keeping relationships out of the definition and applying them at the call site with `for()`.

### Why It Happens
It seems convenient to define a "default" parent in the definition so every created model automatically has one. The developer may not realize this couples the factory to the relationship and prevents flexible reuse.

### Warning Signs
- `definition()` contains `'user_id' => User::factory()` or similar FK + factory
- Factory definition creates related models implicitly through FK values
- Breaking a factory's `definition()` when the relationship method name changes
- Inability to create a model without a parent because the definition always creates one
- Test code overrides the FK to null — fighting the definition default
- Factory has hard-coded FK for some relationships but not others

### Why Harmful
- The factory is coupled to the database column name, not the relationship method
- Renaming the `belongsTo()` method or FK column requires changing the factory definition
- The factory always creates a parent, even when the test doesn't need one — wasted writes
- Overriding the default parent at the call site is awkward (must pass `['user_id' => null]`)
- The factory's purpose (define model attributes) is mixed with relationship setup

### Consequences
- `PostFactory::definition()` creates a new user every time — 1000 posts = 1000 extra users in tests
- A test for "post without user" must fight the default: `Post::factory()->create(['user_id' => null])`
- Renaming `user_id` to `author_id` requires changing both model migration and factory definition
- The factory cannot be used for scenarios requiring a specific parent user
- Stripping relationships from `definition()` requires refactoring all existing call sites

### Preferred Alternative
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

// Relationship applied at call site:
Post::factory()->for(User::factory())->create();
```

### Refactoring Strategy
1. Remove foreign key assignments from `definition()` methods
2. Add `for()` calls at each factory call site that needs a parent
3. For tests that relied on the default parent, add `for()` with a fresh or shared parent
4. For tests that explicitly overrode the parent, remove the override and use `for()`
5. Verify the factory can now create orphaned models when needed

### Detection Checklist
- [ ] Search for `'*_id' =>` inside `definition()` methods — look for FK patterns
- [ ] Check if factory definitions contain `::factory()` calls for related models
- [ ] Verify that removing FK from `definition()` doesn't break existing tests
- [ ] Ensure call sites explicitly use `for()` for BelongsTo relationships
- [ ] Confirm the factory can create models without related parent models

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Set Foreign Key Columns Directly in Factory Definitions |
| Rule | `05-rules.md` — Use for() for All BelongsTo Factory Relationships |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |

---

## 3. Redundant Parent Creation with Factory Per Child

### Category
Performance

### Description
Passing `Parent::factory()` to `for()` inside a loop or `count()` when multiple children should share the same parent. Each child creates its own parent, resulting in N redundant database writes.

### Why It Happens
Developers write `Post::factory()->count(5)->for(User::factory())->create()` without considering that each post gets its own user. The factory chain reads naturally and the extra writes may not be noticed until data volume grows.

### Warning Signs
- `->count(N)->for(Model::factory())` — each child creates its own parent
- Loop with `for(Model::factory())` inside — N parents for N children
- Test assertions about parent count that fail because too many were created
- Slow test suites with many extra database writes
- Seeder scripts that create far more parents than expected
- Factories inside loops without pre-created parent instances

### Why Harmful
- 50 posts each creating a user = 100 database writes instead of 51
- Test suite runtime increases linearly with child count due to redundant parent writes
- Database state becomes unrealistic — 50 users instead of 1 for 50 posts
- Assertions on user count or relationships produce confusing results
- The performance problem compounds when multiple BelongsTo relationships exist on one model

### Consequences
- 500 posts with `->for(User::factory())` creates 500 users — test takes 5x longer than needed
- A test asserting "user has 5 posts" fails because each post has a different user
- Database seeding creates 10,000 users for 10,000 posts when only 100 users are needed
- Teardown is slower: deleting 10,000 users instead of 100
- The extra writes trigger foreign key checks and indexes, compounding slowness

### Preferred Alternative
```php
$user = User::factory()->create();
Post::factory()->count(5)->for($user)->create();
// 1 user + 5 posts = 6 DB writes
```

### Refactoring Strategy
1. Identify factory call sites using `->count(N)->for(Model::factory())`
2. Determine if children should share a parent or have independent parents
3. For shared parents, pre-create the parent and pass the instance to `for()`
4. Use `recycle()` for even cleaner shared-parent semantics
5. Update test assertions that counted on individual parents

### Detection Checklist
- [ ] Search for `->count(.*)->for(.*::factory())` patterns
- [ ] Search for loops with `for(.*::factory())` inside
- [ ] Measure test database writes — are they higher than expected?
- [ ] Check test assertions — do they assume one parent per child?
- [ ] Review seeder files for redundant parent creation patterns

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Pass a Factory for New Parents, Pass an Instance for Existing |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |
| Decision Tree | `07-decision-trees.md` — Factory vs Instance for Parent |

---

## 4. N+1 Parent Creation Without `recycle()`

### Category
Performance

### Description
Creating multiple children that share a parent by repeatedly passing a fresh factory to `for()` in a loop, instead of using `recycle()` with a pre-created parent instance to share across all children.

### Why It Happens
Developers may not know about the `recycle()` method. The loop-based approach is intuitive — create a parent, then create children for it. When working with multiple independent creation calls, the parent is repeatedly re-created.

### Warning Signs
- `recycle()` is never used in factory call sites
- Each child in a group creates its own parent via `for(Model::factory())`
- Manual parent creation followed by individual child creation without sharing
- Seeder scripts with N+1 writes for parent-child relationships
- Database has more parent records than expected for the test scenario
- Tests explicitly set up a parent for every child in a data provider

### Why Harmful
- Database write count is O(N+1) instead of O(2) for N children sharing one parent
- Each redundant parent write consumes transaction log space, index maintenance, and time
- Seeders become prohibitively slow at scale (10,000 children = 10,000 extra parent writes)
- Test data is less realistic (unique parents for children that should share one)
- Performance degrades quadratically with multiple BelongsTo relationships

### Consequences
- 100 posts, each with a user and a category via separate `for()` loops = 201 writes instead of 3
- A seeder that creates 1000 posts with per-child parents takes 10 seconds instead of 1
- The test database has 500 users for 500 posts that should belong to 1 admin user
- CI pipeline is slow because every test suite pays the N+1 tax
- Developers avoid writing tests that need large datasets because they're too slow

### Preferred Alternative
```php
$user = User::factory()->create();
$posts = Post::factory()->count(50)->recycle($user)->create();
// Creates 1 user + 50 posts = 51 DB writes
```

### Refactoring Strategy
1. Identify factory call sites that create children with per-child parents
2. Pre-create the shared parent instance
3. Pass the parent to `recycle()` so all children reference the same instance
4. Remove per-child `for()` calls — they're redundant with `recycle()`
5. Verify test assertions about parent counts still pass

### Detection Checklist
- [ ] Search for `recycle(` in factory call sites — is it used?
- [ ] Measure parent-to-child ratio in test data — should be 1:N
- [ ] Check loops or `count()` calls with `for(Model::factory())` inside
- [ ] Profile slow test suites — are they creating too many parents?
- [ ] Review seeders for N+1 parent creation patterns

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use recycle() When Multiple Children Share the Same BelongsTo Parent |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |
| Decision Tree | `07-decision-trees.md` — Factory vs Instance for Parent |

---

## 5. Generic `for()` with Nested Factory Syntax

### Category
Maintainability

### Description
Using the generic `for()` method with a nested factory and attribute overrides as a second argument instead of using the magic `for{Relation}()` shorthand method. The factory chain is harder to read and understand.

### Why It Happens
Developers learn the generic `for()` method first and may not discover the magic method shorthand. The generic form works correctly, so there's no obvious reason to change. Teams may explicitly forbid magic methods as a policy.

### Warning Signs
- `for(Model::factory(), ['attr' => 'value'])` patterns throughout the codebase
- Magic `for{Relation}()` methods never used
- Factory chains with deep nesting inside `for()` arguments
- Difficulty quickly identifying which relationship a `for()` call establishes
- Inconsistent style: some `for()` used with factory, some with instance
- New developers confused by the `for()` nesting syntax

### Why Harmful
- The parent factory and attribute overrides are buried inside the `for()` call arguments
- The relationship name is not visible at the call site — must read the factory's definition()
- Attribute overrides for the parent are nested inside the call, reducing scanability
- The factory chain is longer and more complex than necessary
- Magic methods exist exactly to solve this readability problem

### Consequences
- `Post::factory()->for(User::factory(), ['name' => 'Admin', 'email' => 'admin@example.com'])->create()` — the parent configuration is nested and hard to parse
- A reader must mentally parse the `for()` arguments to understand what's happening
- Adding more parent attributes makes the line even longer
- The factory chain doesn't read like natural language
- New team members don't know about the cleaner magic method alternative

### Preferred Alternative
```php
Post::factory()->forUser(['name' => 'Admin', 'email' => 'admin@example.com'])->create();
```

### Refactoring Strategy
1. Identify `for(Model::factory(), [...])` calls with attribute overrides
2. Replace with the magic `for{Relation}()` shorthand
3. For ambiguous relationships (multiple BelongsTo to the same model), use explicit `for()` with the relationship name as third argument
4. For simple `for()` without overrides, the generic form is acceptable
5. Add a team convention to prefer magic methods

### Detection Checklist
- [ ] Search for `for(.*::factory()` patterns — count generic vs magic usage
- [ ] Review readability of factory chains — are they easy to scan?
- [ ] Check if magic `for{Relation}()` methods are available but unused
- [ ] Time a new developer's ability to identify the parent in a factory chain
- [ ] Verify that ambiguous relationships use explicit naming, not magic methods

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Magic for{Relation} Methods for Readability |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |
| Decision Tree | `07-decision-trees.md` — Magic for{Relation} vs Explicit for() |

---

## 6. Missing BelongsTo Relationship Definition

### Category
Reliability

### Description
Calling `for()` on a factory for a model that does not have a corresponding `belongsTo()` method defined in its Eloquent class. The factory cannot resolve the relationship and throws a runtime exception.

### Why It Happens
Developers add `for()` based on the database schema (there's a foreign key column) without adding the relationship method to the model. The factory relies on the relationship method to determine the foreign key and related model class.

### Warning Signs
- `InvalidArgumentException` thrown from factory `for()` calls at runtime
- `for()` works in some models but fails in others — relationship method missing
- Models with foreign key columns but no corresponding `belongsTo()` methods
- Database-first development where columns are added without model relationship methods
- Factory call sites reference relationship names that don't exist as methods

### Why Harmful
- Factory creation fails with a confusing exception at runtime
- The relationship is established at the database level but not at the ORM level
- Eloquent features (eager loading, lazy loading, `with()`) for this relationship don't work
- Tests fail with non-obvious errors when the relationship is missing
- The factory's `for()` method depends on the model's relationship definition — missing it breaks the chain

### Consequences
- `Post::factory()->for(User::factory())->create()` throws `InvalidArgumentException` because `Post` has no `user()` BelongsTo method
- A migration adds `author_id` to `posts` table but the `Post` model never defines `author()` relationship
- Test failures are traced back to a missing `belongsTo()` method — not obvious from the error
- The relationship is usable at the DB level (raw queries work) but not at the ORM level
- Adding the relationship method later requires fixing the model, tests, and potentially other code

### Preferred Alternative
```php
class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Now for() works:
Post::factory()->for(User::factory())->create();
```

### Refactoring Strategy
1. Identify `for()` calls that fail with relationship resolution errors
2. Add the missing `belongsTo()` relationship method to the child model
3. Ensure the foreign key column matches the relationship convention or is explicitly specified
4. Test that the factory `for()` now resolves correctly
5. Verify Eloquent relationship features (eager loading, `with()`) also work

### Detection Checklist
- [ ] Check if all `for()` calls have matching `belongsTo()` methods on the model
- [ ] Cross-reference foreign key columns in the schema with model relationship methods
- [ ] Test each `for()` call in factory tests to ensure it doesn't throw
- [ ] Verify relationship method naming matches the factory's `for{Relation}()` name convention
- [ ] Ensure new models get both the column and the relationship method together

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use for() on Models Without a Defined BelongsTo Relationship |
| Skill | `06-skills.md` — Set Up BelongsTo Factory Relationship with for() |
