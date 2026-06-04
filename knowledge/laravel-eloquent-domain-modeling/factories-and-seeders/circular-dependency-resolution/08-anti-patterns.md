# Circular Dependency Resolution — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Factories & Seeders |
| Knowledge Unit | Circular Dependency Resolution |
| Focus | Anti-patterns in circular factory dependency handling |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Unresolved Circular Factory Dependencies | Reliability | Critical |
| 2 | Calling `Model::factory()` Inside Another's `definition()` | Architecture | Critical |
| 3 | Both Sides Non-Nullable in Circular Relationships | Architecture | High |
| 4 | Undocumented Cycle Resolutions | Maintainability | Medium |
| 5 | Using `afterCreating()` When `recycle()` Would Suffice | Maintainability | Medium |
| 6 | Missing Cycle Identification Before Seeding | Reliability | High |

## Repository-Wide Cross-Cutting Patterns

- The most critical anti-pattern is leaving circular factory dependencies unresolved, causing stack overflow crashes during seeding and testing
- Calling `Model::factory()` inside another model's `definition()` creates invisible recursion that's difficult to debug when it crashes
- Making both sides of a circular relationship non-nullable creates a creation deadlock that requires workarounds

---

## 1. Unresolved Circular Factory Dependencies

### Category
Reliability

### Description
Allowing circular factory dependencies to remain unresolved — two or more factories create each other through `definition()`, `configure()`, or `afterCreating()` callbacks, causing infinite recursion and stack overflow at runtime.

### Why It Happens
The cycle emerges gradually: Factory A creates Model B; later, Factory B's `afterCreating()` is modified to create Model A. The cycle is not noticed until it crashes. Each individual change seems reasonable in isolation.

### Warning Signs
- PHP `Maximum function nesting level` errors during factory execution
- Factories that sometimes crash and sometimes don't (non-deterministic cycles)
- Factory creation never completes for certain model combinations
- Stack traces showing circular calls between factory classes
- Tests that pass individually but crash when run together (cycle via shared state)
- Seeders that crash with deep recursion on large datasets

### Why Harmful
- PHP crashes with no helpful error message — just a nesting level error
- Seeding fails after partial creation — inconsistent database state
- CI builds fail intermittently depending on test order
- Debugging is difficult because the recursion happens inside framework code
- Production deployment failures when seeders crash

### Consequences
- `UserFactory::afterCreating` creates 5 posts, each `PostFactory::afterCreating` assigns a user → 6th nesting level triggers recursion limit
- Seeding 10,000 records crashes at record 4,723 — partial data, no rollback
- A test that creates a User succeeds in isolation but fails when other tests have already created data
- Debugging requires adding `xdebug.log` to trace factory call chains
- Team avoids using factories for certain models due to "random crashes"

### Preferred Alternative
```php
// Pre-create users to break the cycle
$users = User::factory()->count(10)->create();
Post::factory()->count(50)->recycle($users)->create();
```

### Refactoring Strategy
1. Trace the factory call chain: identify every model that each factory creates
2. Map the directed graph of factory → model dependencies
3. Identify all cycles in the graph
4. Choose one side of each cycle to pre-create with `recycle()`
5. Implement the resolution and test that no recursion occurs
6. Document the cycle and resolution on the factory class

### Detection Checklist
- [ ] Trace all factory `definition()`, `configure()`, and callback methods
- [ ] Map which models each factory creates (directly or transitively)
- [ ] Search for cycles in the factory dependency graph
- [ ] Create models at scale (N=100) and check for recursion errors
- [ ] Run factory tests in random order to surface non-deterministic cycles

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Break Every Circular Factory Dependency Before Seeding |
| Skill | `06-skills.md` — Resolve Circular Factory Dependency with recycle() |
| Knowledge | `04-standardized-knowledge.md` — Circular Dependency Resolution |

---

## 2. Calling `Model::factory()` Inside Another's `definition()`

### Category
Architecture

### Description
Invoking `RelatedModel::factory()` or passing it as a default value inside a factory's `definition()` method when the related model's factory may create the first model in its own chain, creating an implicit circular dependency.

### Why It Happens
Developers set up default relationships in `definition()` for convenience — `'user_id' => User::factory()`. This seems harmless until the `UserFactory` itself has an `afterCreating` that creates posts, creating the cycle through callbacks.

### Warning Signs
- `definition()` methods containing `Model::factory()` calls for related models
- `definition()` with foreign key defaults that use factory instances
- Default factory relationships defined inline in `definition()` instead of at call site
- Intermittent stack overflow errors when creating large numbers of models
- Comments warning "do not change this factory — causes recursion"
- Tests that break when a new relationship callback is added to a related factory

### Why Harmful
- Creates implicit coupling between factory definitions — changing one factory breaks others
- The cycle is invisible — not apparent from reading any single factory
- Debugging requires tracing through multiple factory files to understand the recursion
- Adding a simple callback to one factory can cascade into a system-wide crash
- Factory definitions are no longer self-contained

### Consequences
- `PostFactory::definition()` has `'user_id' => User::factory()` — UserFactory's `afterCreating` creates a `Post` → recursion
- A developer adds a `->has(Comment::factory()->count(3))` to `PostFactory::configure()` — CommentFactory creates Post → new cycle
- Removing the `'user_id'` line from `PostFactory::definition()` resolves the crash but breaks 50 call sites that relied on the default
- The factory dependency graph is undocumented — no one knows all the cycles
- New developers add relationships to `definition()` unaware of the hidden cycles

### Preferred Alternative
```php
class PostFactory extends Factory
{
    public function definition(): array
    {
        return ['title' => fake()->sentence()]; // Pure, no relationships
    }
}

// Relationship established at call site
Post::factory()->for(User::factory())->create();
```

### Refactoring Strategy
1. Identify all `definition()` methods containing `Model::factory()` calls
2. Remove all factory calls from `definition()` methods
3. Move relationship setup to call sites using `for()`, `has()`, or `hasAttached()`
4. Trace the factory dependency graph to verify no cycles remain
5. Add `recycle()` where needed to pre-create shared models

### Detection Checklist
- [ ] Search for `::factory()` calls inside `definition()` methods
- [ ] Map which models each factory `definition()` references
- [ ] Check if referenced model's factory creates the original model anywhere in its chain
- [ ] Verify no factory `definition()` creates related models implicitly
- [ ] Confirm all relationships are established at call sites, not in definitions

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Call Model::factory() Inside Another Model's definition() |
| Skill | `06-skills.md` — Resolve Circular Factory Dependency with recycle() |

---

## 3. Both Sides Non-Nullable in Circular Relationships

### Category
Architecture

### Description
Designing both foreign keys in a bidirectional relationship as non-nullable (`constrained()->nullable(false)`), preventing either model from existing without the other. This creates a chicken-and-egg problem for factory creation.

### Why It Happens
Database designers enforce referential integrity by making foreign keys required. The domain may view the relationship as mandatory from both sides. The creation problem only surfaces when factories try to create the models.

### Warning Signs
- Two related models both have `foreignId(...)->constrained()->nullable(false)`
- Factory creation requires complex workarounds to satisfy both foreign keys
- Seeding code must use raw SQL to bypass foreign key constraints temporarily
- Tests must create models in a specific order that avoids the deadlock
- Foreign key constraint violations during seeding
- `Cannot add or update a child row: a foreign key constraint fails` — both sides required

### Why Harmful
- Circular creation is impossible without workarounds (recycle, afterCreating, raw SQL)
- The database schema forces an impossible constraint — both models require the other to exist first
- Factory code becomes convoluted with callbacks and pre-creation steps
- Test setup code is more complex than the actual test logic
- The schema doesn't reflect real domain flexibility most of the time

### Consequences
- `users.team_id` (required) and `teams.owner_id` (required) — cannot create either alone
- Factory must create a user without a team, then create a team, then update the user — three steps
- `Post` requires `user_id` and `User`'s `afterCreating` requires at least one Post — creation deadlock
- New team members spend hours figuring out the "magic incantation" to create test data
- Migration rollbacks fail because both tables reference each other

### Preferred Alternative
```php
Schema::create('posts', function (Blueprint $table) {
    $table->foreignId('user_id')->nullable()->constrained();
});

// Can create posts without users, then associate later
$post = Post::factory()->create(['user_id' => null]);
```

### Refactoring Strategy
1. Identify circular relationships with both FKs non-nullable
2. Evaluate which side of the relationship can be optional from a domain perspective
3. Change the less-critical FK to nullable
4. Update factories to work without the non-nullable side
5. Add domain validation where the non-nullable relationship must exist

### Detection Checklist
- [ ] Check migration files for `nullable(false)` or omitted `nullable()` on foreign keys
- [ ] Identify circular FK references in the database schema
- [ ] Test creating each model independently — does it fail with FK constraint?
- [ ] Evaluate whether both sides truly must be non-nullable in the domain
- [ ] Check for complex factory workarounds that could be eliminated by nullable FK

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Make One Side of the Cycle Nullable at the Database Level |
| Decision Tree | `07-decision-trees.md` — Nullable FK vs recycle() Approach |

---

## 4. Undocumented Cycle Resolutions

### Category
Maintainability

### Description
Resolving circular factory dependencies without documenting what was resolved and how. Future developers may inadvertently reintroduce the cycle by modifying factories or adding new relationships.

### Why It Happens
The original developer who fixed the cycle understands the issue intimately and doesn't think about future maintainers. The resolution (e.g., adding `recycle()`) seems self-explanatory at the time.

### Warning Signs
- `recycle()` used in factory chains but no comment explaining why
- `afterCreating()` callbacks that set up reciprocal relationships with no explanation
- Factory classes with no docblock about circular dependencies
- Previous incidents of circular dependency bugs recurring after refactoring
- New team members breaking factories by "simplifying" code that was hiding a cycle fix
- Factory code with cryptic workarounds that no one can explain

### Why Harmful
- The same cycle is reintroduced repeatedly as team members change
- "Simplifying" the factory code breaks it because the cycle resolution is removed
- New developers waste hours debugging the same cycle that was already fixed
- Knowledge of the cycle exists only in the heads of current team members
- Code reviews miss cycle reintroductions because the original resolution isn't visible

### Consequences
- A developer refactors `UserFactory` to add posts — the old cycle reappears
- Six months after the original fix, no one remembers why `recycle()` is there, and someone removes it
- The cycle fix took 3 hours to debug the first time — it takes another 3 hours the second time
- Factory docblocks have no warnings — no way to know that this model is part of a cycle
- The team develops a superstition about certain factories being "fragile" without understanding why

### Preferred Alternative
```php
/**
 * Resolves User ↔ Post circular dependency.
 * Users are pre-created via recycle() at the call site.
 * Posts reference recycled users; no afterCreating cycle exists.
 */
class PostFactory extends Factory
{
    ...
}
```

### Refactoring Strategy
1. Identify all factory classes involved in circular dependencies
2. Add PHPDoc to each factory documenting:
   - Which models form the cycle
   - Which model is the independent/pre-created side
   - What method resolves the cycle (recycle, afterCreating, nullable FK)
   - Warning: do not add reciprocal factory creation without re-evaluating
3. For complex cycles, also document the resolution in the project's contributing guide
4. Review the documentation when any relationship is added or modified

### Detection Checklist
- [ ] Check factory docblocks for circular dependency documentation
- [ ] Review `recycle()` usage — is there a comment explaining why it's needed?
- [ ] Check if new team members know about existing cycle resolutions
- [ ] Verify that modifying one factory wouldn't accidentally recreate a cycle
- [ ] Document any cycle that has been encountered, even if currently resolved

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Document Circular Dependency Resolutions in Factory DocBlocks |
| Decision Tree | `07-decision-trees.md` — Documentation Strategy |

---

## 5. Using `afterCreating()` When `recycle()` Would Suffice

### Category
Maintainability

### Description
Using `afterCreating()` callbacks to establish reciprocal relationships in a cycle when `recycle()` could pre-create the independent side and avoid the callback complexity entirely.

### Why It Happens
Developers reach for `afterCreating()` as a general-purpose "do something after creation" tool. The callback approach seems straightforward: create Model A, then create Model B and link them. The developer may not consider that pre-creating one side with `recycle()` is simpler.

### Warning Signs
- `afterCreating()` callbacks that look up or create related models
- Factories with multiple `afterCreating()` callbacks for relationship setup
- Callback logic that could be replaced with `for()` or `has()` at the call site
- Complex `afterCreating()` chains that are hard to read and debug
- Callbacks that fail because the reciprocal model doesn't exist yet
- `afterCreating()` callbacks that are the only place relationships are defined

### Why Harmful
- Callbacks run on every factory creation, even when the relationship isn't needed
- Understanding the factory's behavior requires reading callback code
- Callback logic is harder to test and debug than declarative `recycle()` usage
- Callbacks couple the factory to specific relationship setups
- The factory cannot create a model without creating the callback's related data

### Consequences
- `UserFactory::afterCreating` creates a Profile, Team, and 3 Posts — even for a test just needing a user ID
- A developer removes the `afterCreating` expecting fewer database writes — breaks all tests relying on the relationships
- Debugging why a factory creates 5 extra records requires reading `configure()` and `afterCreating` callbacks
- The callback defines relationship data that should be explicit at the call site
- Tests must override or detach callback-created data for specific scenarios

### Preferred Alternative
```php
// Pre-create the independent side — no callbacks needed
$users = User::factory()->count(10)->create();
$posts = Post::factory()->count(50)->recycle($users)->create();
```

### Refactoring Strategy
1. Identify `afterCreating()` callbacks that establish relationships
2. Determine if the relationship could be replaced with pre-creation + `recycle()`
3. Move relationship setup from callbacks to call sites
4. Remove the callback if it's only used for relationship setup
5. Verify the cycle is still resolved

### Detection Checklist
- [ ] Review all `afterCreating()` callbacks — what relationships do they establish?
- [ ] Could those relationships be established with `recycle()` at the call site?
- [ ] Are callbacks creating extra data that some tests don't need?
- [ ] Count DB writes per factory call — are callbacks adding unexpected writes?
- [ ] Verify callbacks don't recreate circular dependencies

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use recycle() to Break Circular Dependencies |
| Rule | `05-rules.md` — Defer the Dependent Side of a Cycle to afterCreating |
| Skill | `06-skills.md` — Resolve Circular Factory Dependency with recycle() |

---

## 6. Missing Cycle Identification Before Seeding

### Category
Reliability

### Description
Running large seeding operations or test suites with high model counts without first verifying that factory dependency graphs are cycle-free. The cycle only manifests at scale, causing intermittent crashes.

### Why It Happens
Factories are tested with small data volumes (N=1) where cycles may not trigger due to early exit conditions or lucky ordering. The cycle is hidden until the factory chain reaches enough depth to hit PHP's nesting limit.

### Warning Signs
- Factory tests always use `count(1)` and never test with larger volumes
- Random "maximum nesting level" errors that are hard to reproduce
- CI failures on large test runs that pass on local machines
- Production seeding works for small environments but fails on large ones
- Team assumption: "factories work fine" — no cycle testing
- No factory dependency graph documented or tested

### Why Harmful
- The cycle is discovered during production deployment seeding, not during development
- Partial seeding leaves the database in an inconsistent state
- Debugging under production-like load is difficult and time-consuming
- The issue is hard to reproduce locally because smaller datasets don't trigger it
- Confidence in the deployment pipeline is eroded

### Consequences
- A migration seeding 100,000 records crashes at 5,000 — production database is partially seeded
- A test suite passes locally (small DB) but fails in CI (larger dataset triggers the cycle)
- PHP's recursion limit is reached at depth 256 — only manifests with 200+ factory creations
- The team increases `xdebug.max_nesting_level` instead of fixing the cycle
- Production deployment requires manual database cleanup after the crash

### Preferred Alternative
```php
// Verify cycle-free operation at scale before seeding
public function test_factories_handle_bulk_creation(): void
{
    $posts = Post::factory()->count(100)->create();
    $this->assertCount(100, $posts);
}
```

### Refactoring Strategy
1. Write a test that creates each factory with `count(100)`
2. Run the test and check for nesting level errors
3. If crashes occur, trace the cycle using the stack trace
4. Resolve all discovered cycles
5. Add the bulk-creation test to the CI suite as a regression guard
6. Document the maximum safe batch size for each factory

### Detection Checklist
- [ ] Run each factory with `count(100)` — does it complete without errors?
- [ ] Check `xdebug.max_nesting_level` or PHP recursion limit settings
- [ ] Review test suites — do they use bulk factory creation?
- [ ] Map the factory dependency graph for all models
- [ ] Monitor CI for intermittent "nesting level" errors

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Break Every Circular Factory Dependency Before Seeding |
| Skill | `06-skills.md` — Resolve Circular Factory Dependency with recycle() |
