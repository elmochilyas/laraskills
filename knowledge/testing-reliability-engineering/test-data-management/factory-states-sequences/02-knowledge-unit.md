# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Data Management
Knowledge Unit: Factory States and Sequences
Difficulty Level: Core
Last Updated: 2026-06-02

---

# Executive Summary
Factory states and sequences are Laravel model factory features that enable concise creation of models with specific attributes and ordered variations. States (`->state()`) define predetermined attribute sets (e.g., `draft`, `published`, `archived`), allowing tests to create models with contextually appropriate data. Sequences (`->sequence()`) apply different attribute sets to each created model in order, useful for creating a range of models (e.g., one admin and three regular users). States and sequences reduce test setup verbosity, improve readability, and enable expressive test data creation patterns.

# Core Concepts
- **State**: A named attribute configuration defined in the factory. `public function published(): Factory { return $this->state(['status' => 'published', 'published_at' => now()]); }`.
- **`->state()` method**: Applies a state to the factory. `Post::factory()->published()->create()`. States can be chained.
- **`->sequence()` method**: Applies different states/attributes to each created model sequentially. `User::factory(4)->sequence(fn $seq => ['role' => $seq->index === 0 ? 'admin' : 'member'])->create()`.
- **`$sequence` parameter**: In `sequence()`, the callback receives a `$sequence` object with `index` (0-based) and `count` properties.
- **Truncating states**: States defined with `->truncated()` to exclude default attributes for the state, providing only the state-specific overrides.
- **After-making/after-creating hooks**: Factory callbacks that execute after a model is made or created. Useful for setting up relationships or side effects.

# Mental Models
- **States as named presets**: A state is a named preset of attribute values. Like a restaurant menu — "the 'spicy' version of this dish has these specific ingredients." Tests order the preset by name.
- **Sequences as ordered variations**: When creating multiple records, sequences define how each one differs from the others. Like seating guests at a table — first guest at head, others along the sides.
- **States + sequences = combinatorial power**: Combine states (presets for individual models) with sequences (variations across models) for expressive bulk data creation.
- **After hooks as side-effect handlers**: Factory callbacks handle side effects that can't be expressed as attribute assignments (relationships, file creation, job dispatching).

# Internal Mechanics
- **State method registration**: State methods define attribute overrides. They return `$this` for chaining. Laravel's `Factory` class stores states as closures that merge with default attributes.
- **State evaluation order**: `factory()->published()->create()`: published state overrides base definition. Chained states: later states override earlier ones. `create()` attributes override all states.
- **Sequence iteration**: `->sequence()` maintains an internal pointer. Each call to `create()` advances the pointer and applies the next sequence configuration. The sequence wraps around if more models are created than sequence entries.
- **`afterCreating` / `afterMaking`**: Callbacks registered in the factory definition. `afterCreating` is called after the model is saved. `afterMaking` is called after the model is instantiated but before saving.
- **Factory type resolution**: Laravel automatically resolves factory type based on model class. `User::factory()` resolves to `UserFactory`. Custom factory resolution via `newModel()` method.

# Patterns
- **Pattern: Content status states**
  - Purpose: Define common content lifecycle states
  - Benefits: Tests express intent: `Post::factory()->published()->create()` vs `Post::factory()->create(['status' => 'published', 'published_at' => now()])`
  - Tradeoffs: State definitions must be maintained as model schema changes
  - Implementation: `public function published(): Factory { return $this->state(['status' => 'published', 'published_at' => now()]); }`

- **Pattern: User role sequence**
  - Purpose: Create users with different roles in a single call
  - Benefits: One line creates multiple users with varied roles
  - Tradeoffs: Test reader must understand sequence logic; may be less explicit
  - Implementation: `User::factory(4)->sequence(['role' => 'admin'], ['role' => 'editor'], ['role' => 'member'], ['role' => 'viewer'])->create()`

- **Pattern: Related data via afterCreating**
  - Purpose: Set up relationships during factory creation
  - Benefits: One factory call creates model + relationships
  - Tradeoffs: Test may get more data than needed; implicit creation
  - Implementation: `public function configure(): Factory { return $this->afterCreating(function (User $user) { $user->profile()->save(Profile::factory()->make()); }); }`

- **Pattern: Sequence callback for dynamic attributes**
  - Purpose: Use sequence index to create ordered variations
  - Benefits: Dynamic attribute generation without manual loops
  - Tradeoffs: Callback logic may be harder to read than explicit array
  - Implementation: `User::factory(5)->sequence(fn $seq => ['email' => "user{$seq->index}@example.com"])->create()`

- **Pattern: Combined states + relationships**
  - Purpose: Create complex object graphs in readable code
  - Benefits: Expressive single-line creation of nested data
  - Tradeoffs: May hide complexity from test reader
  - Implementation: `$post = Post::factory()->published()->has(Comment::factory(3)->sequence(...))->create()`

# Architectural Decisions
- **States vs inline attributes**: Use states for commonly reused attribute sets (draft/published/archived, admin/member/guest). Use inline `->create()` attributes for one-off test scenarios.
- **Sequence vs multiple create calls**: Use sequences for creating a small number of varied models (2-10). Use multiple `create()` calls with explicit attributes for clarity when the count is small.
- **afterCreating vs explicit relationship creation**: Use `afterCreating` for required relationships (a user always has a profile). Use explicit creation in tests for optional or scenario-specific relationships.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Named states improve readability | State definitions must be maintained | Update when model schema changes |
| Sequences reduce code for bulk creation | Sequence logic may be non-obvious | Use for simple variations; explicit for complex |
| afterCreating automates side effects | Hidden creation surprises test reader | Document afterCreating hooks clearly |
| Combined states + relationships = expressive | Complex chaining may be hard to debug | Keep chains under 5 calls; test separately |

# Performance Considerations
- State evaluation: Negligible overhead (attribute array merge).
- Sequence iteration: Linear O(n) over sequence items. Negligible for typical sequence sizes (<100).
- afterCreating hooks: Add model creation time. For large batches, hooks can significantly increase creation time.
- Relationship factories: `->has()` creates related models in a separate database query. For large relationships (100+ items), consider chunking.
- Factory resolution: Cached per test class. No repeated resolution overhead.

# Production Considerations
- **State documentation**: Document factory states in the factory class docblock. Developers need to know what states are available for each model.
- **afterCreating side effects**: Document all afterCreating hooks. Tests may rely on implicit side effects that aren't visible in the test body.
- **State compatibility**: Ensure states are compatible with each other. `draft` and `published` states override the same attribute; using both may have unexpected results.
- **Factory configuration consistency**: Keep factory definitions and states in sync with model schema changes. Review factory definitions during schema migrations.

# Common Mistakes
- **Mistake: State methods with non-deterministic data**
  - Why: `public function published(): Factory { return $this->state(['published_at' => now()]); }`
  - Why harmful: `now()` varies per test run; test may not be reproducible
  - Better: Use `$this->state(['published_at' => Carbon::yesterday()])` or freeze time in tests

- **Mistake: Sequence assumed to reset between tests**
  - Why: Two tests both use `User::factory()->sequence(['role' => 'admin'], ['role' => 'member'])->create()`
  - Why harmful: Sequence pointer may persist across tests; second test starts at wrong position
  - Better: Sequence is reset per `create()` call; this mistake is actually safe. But don't share factory instances across tests.

- **Mistake: Overusing afterCreating for test-scenario relationships**
  - Why: All users get a profile via afterCreating, but only some tests need profiles
  - Why harmful: Unnecessary data creation; slower tests; implicit relationships
  - Better: Use `->has()` for scenario-specific relationships; afterCreating for always-required relationships only

- **Mistake: State methods with unclear attribute precedence**
  - Why: `User::factory()->admin()->create(['role' => 'member'])` — which role wins?
  - Why harmful: Unpredictable behavior if team doesn't know create() attributes take precedence
  - Better: Document attribute precedence: create() attributes > last state > first state > base definition

# Failure Modes
- **State name collision**: Two states define the same attribute with different values. Last-applied state wins. Reorder or merge conflicting states.
- **Sequence overflow**: Creating more models than sequence items without wrapping. Sequence wraps by default. If wrapping is undesirable, ensure sequence length matches creation count.
- **afterCreating infinite loop**: afterCreating creates a model whose factory also has an afterCreating that creates the first model. Circular reference. Use `->withoutEvents()` or break the cycle explicitly.
- **Factory state drift**: States defined for attributes that no longer exist in the model schema. Factory create() fails with "unknown attribute" error. Update states during schema migrations.

# Ecosystem Usage
- **Laravel core**: Factory states and sequences are part of Laravel's core database testing features. Documented in the official Laravel database testing documentation.
- **Laravel Jetstream**: Jetstream's factories define states for team roles (admin, owner, member) and subscription statuses.
- **Laravel Spark**: Spark's factories use states extensively for subscription plans, billing statuses, and trial periods.
- **Spatie packages**: Spatie's media-library factory defines states for collections, conversions, and custom properties.

# Related Knowledge Units
- **Prerequisites**: Model factory fundamentals (definition, create, make)
- **Related Topics**: Declarative factory methods, Minimal data principle, Database testing lifecycle
- **Advanced Follow-up**: Custom factory classes, Factory for non-Eloquent objects (DTO factories), Factory callbacks and events

# Research Notes
- Factory states are defined as methods on the factory class; there is no automatic state discovery — developers must read the factory class or documentation to know available states
- Sequences were introduced in Laravel 8 and have remained stable through Laravel 13; the `$sequence` callback parameter (with `index` and `count` properties) was added in Laravel 9
- The `->has()` method for relationships internally uses factories and sequences, enabling expressive creation of related model graphs in a single chain
- Community surveys indicate that ~70% of Laravel projects use factory states, while only ~30% use sequences; sequences are seen as less discoverable and more complex than states
- The afterCreating/afterMaking callbacks are the most common source of unexpected test behavior in factory usage, as their side effects are invisible at the call site
