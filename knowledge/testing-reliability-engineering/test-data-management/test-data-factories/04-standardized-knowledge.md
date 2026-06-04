# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Data Management
Knowledge Unit: Test Data Factories (States & Sequences)
 KU Code: ku-01-test-data-factories
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Factory states and sequences are Laravel model factory features that enable concise creation of models with specific attributes and ordered variations. States (`->state()`) define predetermined attribute sets (draft, published, archived). Sequences (`->sequence()`) apply different attribute sets to each created model in order, useful for creating a range of models (one admin and three regular users). States and sequences reduce test setup verbosity, improve readability, and enable expressive test data creation.

# Core Concepts
- **State**: A named attribute configuration defined in the factory method. `public function published()` returns `$this->state(['status' => 'published'])`.
- **`->state()` method**: Applies a state to the factory. `Post::factory()->published()->create()`. States can be chained.
- **`->sequence()` method**: Applies different attributes to each created model sequentially. Supports callback with `$sequence->index`.
- **`$sequence` parameter**: Callback receives `$sequence` object with `index` (0-based) and `count` properties.
- **After-making/after-creating hooks**: Factory callbacks that execute after a model is made or created. Useful for relationships.
- **Truncating states**: States defined with `->truncated()` to exclude default attributes, providing only state-specific overrides.

# When To Use
- Creating models with commonly reused attribute combinations (published/draft, admin/member)
- Creating ordered variations of models (first user is admin, rest are members)
- Setting up relationships during factory creation via `afterCreating`
- Reducing test setup verbosity when creating many models with different attributes
- Reusable test data presets shared across multiple test files

# When NOT To Use
- One-off test scenarios where inline attributes are clearer
- Very simple models with only 1-2 attributes (factory overhead not justified)
- When state definitions duplicate model defaults (state adds no value)
- As a replacement for explicit test setup in complex integration scenarios
- When states create hidden side effects (use `afterCreating` sparingly)

# Best Practices (WHY)
- **Use states for commonly reused attribute sets**: Reason: `Post::factory()->published()->create()` is more readable than `Post::factory()->create(['status' => 'published', 'published_at' => now()])`. States encode domain vocabulary.
- **Use deterministic values in state definitions, not `now()`**: Reason: `now()` varies per test run. Use `Carbon::yesterday()` or freeze time. Deterministic data prevents flaky tests.
- **Prefer `->has()` over `afterCreating` for scenario-specific relationships**: Reason: `afterCreating` creates hidden side effects that aren't visible at the call site. `->has()` is explicit.
- **Use sequences for small numbers of varied models (2-10)**: Reason: sequences are concise for small batches. For larger batches or complex logic, explicit loops are clearer.
- **Document attribute precedence**: Reason: `create()` attributes > last state > first state > base definition. Teams must know this to avoid surprises.
- **Keep state definitions in sync with schema changes**: Reason: a state that references a removed attribute causes factory creation to fail. Review states during migrations.
- **Name states as domain actions, not data states**: Reason: `published()` reads better than `statusPublished()`. State method names should read as verbs/adjectives.

# Architecture Guidelines
- **State method naming**: Use descriptive names that match domain language: `published()`, `withTeam()`, `verified()`. Avoid `statusX()` or `attributeY()`.
- **State organization**: Group related states in the factory class. Use docblocks to document available states.
- **Sequence callback convention**: Use `fn ($seq) => ['attribute' => "value{$seq->index}"]` for dynamic sequences.
- **Factory class structure**: Base definition → state methods → afterCreating hooks. States reference the base definition.
- **State compatibility**: Ensure states that override the same attribute are not used together accidentally.
- **Factory type resolution**: Laravel resolves factory by model class. Custom resolution via `newModel()` for non-standard models.

# Performance
- **State evaluation**: Negligible overhead (attribute array merge). No performance concern.
- **Sequence iteration**: Linear O(n) over sequence items. Negligible for typical sizes (<100).
- **afterCreating hooks**: Add model creation time. For large batches, hooks can significantly increase time.
- **Relationship factories**: `->has()` creates related models in separate queries. For large relationships (100+), consider chunking.
- **Factory resolution**: Cached per test class. No repeated resolution overhead.

# Security
- **State data exposure**: States may create models with sensitive attribute defaults. Review what data states produce.
- **afterCreating side effects**: Hooks may trigger notifications, emails, or external calls. Use `->withoutEvents()` when appropriate.
- **Factory model creation**: Ensure factory-created models don't bypass authorization (e.g., creating admin users).
- **Deterministic data**: Avoid Faker-generated data in state definitions that could produce unexpected values.

# Common Mistakes

**Mistake: Non-deterministic state data**
- Description: `public function published() { return $this->state(['published_at' => now()]); }`
- Cause: Convenience; "it's just test data"
- Consequence: Tests may fail intermittently based on timing; unreproducible failures
- Better: Use `Carbon::yesterday()` or `Carbon::setTestNow()` in test setup.

**Mistake: Overusing afterCreating**
- Description: All users get a profile via afterCreating even though few tests need it
- Cause: "It's convenient to always have related data"
- Consequence: Unnecessary data creation slows tests; implicit relationships confuse readers
- Better: Use `->has()` for scenario-specific relationships. afterCreating only for always-required relationships.

**Mistake: State name collisions**
- Description: Two states define the same attribute with different values
- Cause: Multiple states evolving independently
- Consequence: Last-applied state wins; unpredictable attribute values
- Better: Document which attributes each state overrides. Avoid overlapping state definitions.

**Mistake: Sequence wrapping assumption**
- Description: Creating more models than sequence items, assuming an error
- Cause: Not knowing that sequences wrap around
- Consequence: Models get unexpected attribute values when sequence repeats
- Better: Ensure sequence length matches creation count, or explicitly handle wrapping.

# Anti-Patterns
- **State-as-fixture**: Using states to create complete fixture data that isn't related to the test scenario. Creates data bloat.
- **Global afterCreating**: Adding afterCreating to the base factory that creates related models for every test. Use per-factory afterCreating.
- **Hidden sequence state**: Assuming sequence pointer persists across tests. Each `create()` call has an independent sequence.
- **State explosion**: Creating a state method for every possible attribute combination. Use parameterized factory methods instead.
- **Mocking factories**: Mocking Eloquent models defeats the purpose of factory states. Use real model creation.

# Examples

**State definition**
```php
class PostFactory extends Factory
{
    public function published(): static
    {
        return $this->state([
            'status' => 'published',
            'published_at' => Carbon::yesterday(),
        ]);
    }

    public function draft(): static
    {
        return $this->state([
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
```

**Sequence for role variation**
```php
User::factory(4)
    ->sequence(
        ['role' => 'admin'],
        ['role' => 'editor'],
        ['role' => 'member'],
        ['role' => 'viewer'],
    )
    ->create();
```

**Dynamic sequence callback**
```php
User::factory(5)
    ->sequence(fn ($sequence) => [
        'email' => "user{$sequence->index}@example.com",
    ])
    ->create();
```

**AfterCreating for required relationships**
```php
class UserFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            $user->profile()->save(Profile::factory()->make());
        });
    }
}
```

# Related Topics
- Declarative factory methods
- Model factory fundamentals
- Minimal data principle
- Database testing lifecycle
- Relational model factories

# AI Agent Notes
- When generating factory states, always use deterministic values (`Carbon::yesterday()`, fixed strings). Never use `now()` or Faker in states.
- Prefer `->has()` over `afterCreating` when generating code. `->has()` is explicit and visible at the call site.
- State methods should be named as verbs/adjectives (`published()`, `withTeam()`), not as getters (`getPublishedState()`).
- Sequences are best for small model batches (2-10). For larger batches, use explicit loops with `create()`.
- Document attribute precedence (`create()` > last state > first state > base) in generated factory comments.
- When generating sequence callbacks, use `$sequence->index` for dynamic values. The index is 0-based.

# Verification
- [ ] Can define a state method that returns `$this->state([...])` and apply it via `->published()->create()`
- [ ] Can chain multiple states and verify the last state's attribute values take precedence
- [ ] Can create models with a sequence and verify each model has the expected attribute values
- [ ] Sequence callbacks using `$sequence->index` produce correct sequential values
- [ ] afterCreating hook correctly creates related models after the parent model is saved
- [ ] State definitions use deterministic values (no `now()`, no Faker)
- [ ] Factory states are documented in the factory class docblock
