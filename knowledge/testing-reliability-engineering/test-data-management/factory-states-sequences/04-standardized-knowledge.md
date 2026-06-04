# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Data Management |
| Knowledge Unit | Factory States and Sequences |
| Difficulty | Core |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Model factory fundamentals (definition, create, make) |
| Related KUs | Declarative factory methods, Minimal data principle, Database testing lifecycle |
| Source | domain-analysis.md K006 |

# Overview

Factory states and sequences are Laravel model factory features that enable concise creation of models with specific attributes and ordered variations. States (`->state()`) define predetermined attribute sets (e.g., `draft`, `published`, `archived`), allowing tests to create models with contextually appropriate data. Sequences (`->sequence()`) apply different attribute sets to each created model in order, useful for creating a range of models (e.g., one admin and three regular users). States and sequences reduce test setup verbosity, improve readability, and enable expressive test data creation patterns.

# Core Concepts

- **State**: A named attribute configuration defined in the factory. `public function published(): Factory { return $this->state(['status' => 'published', 'published_at' => now()]); }`.
- **`->state()` method**: Applies a state to the factory. `Post::factory()->published()->create()`. States can be chained.
- **`->sequence()` method**: Applies different states/attributes to each created model sequentially. `User::factory(4)->sequence(...)->create()`.
- **`$sequence` parameter**: In `sequence()`, the callback receives a `$sequence` object with `index` (0-based) and `count` properties.
- **Truncating states**: States defined with `->truncated()` to exclude default attributes, providing only state-specific overrides.
- **After-making/after-creating hooks**: Factory callbacks that execute after a model is made or created. Useful for setting up relationships or side effects.

# When To Use

- Creating models with common lifecycle states (draft, published, archived)
- Setting up user roles with different permissions (admin, editor, member, viewer)
- Generating ordered model variations (first item is different from rest)
- Combining states to create complex model configurations
- Creating relationships automatically via afterCreating hooks

# When NOT To Use

- One-off attribute overrides (use `->create(['key' => 'value'])` directly)
- Creating a single model with unique attributes (factory + create is simpler)
- When states would hide important setup details from test readers
- Over-engineering: when a simple factory create() with attributes is sufficient
- For frequently changing states that add maintenance overhead

# Best Practices (WHY)

- **Use states for commonly reused attribute sets**: Reason: `Post::factory()->published()->create()` is more readable than `Post::factory()->create(['status' => 'published', 'published_at' => now()])`.
- **Document available states in factory docblocks**: Reason: developers need to know what states are available without reading the factory source.
- **Avoid non-deterministic data in state methods**: Reason: `published_at => now()` varies per test run. Use `Carbon::yesterday()` or freeze time.
- **Document afterCreating hooks**: Reason: tests may rely on implicit side effects that aren't visible in the test body.
- **Use `->has()` for scenario-specific relationships**: Reason: afterCreating for required relationships only. `->has()` for optional or scenario-specific relationships.
- **Understand attribute precedence**: Reason: `create()` attributes > last state > first state > base definition. Document this precedence for the team.

# Architecture Guidelines

- **State method naming**: Use descriptive names that match the domain. `published()`, `draft()`, `archived()`, `admin()`, `subscribed()`.
- **State organization**: Group related states in the factory class. `UserFactory` states for roles, `PostFactory` states for content status.
- **Sequence with callback**: Use sequence callbacks for dynamic attribute generation based on index. Use explicit arrays for static variations.
- **Combined patterns**: States + sequences + `->has()` for expressive bulk data creation. `Post::factory()->published()->has(Comment::factory(3))->create()`.

# Performance Considerations

- **State evaluation**: Negligible overhead (attribute array merge).
- **Sequence iteration**: Linear O(n) over sequence items. Negligible for typical sizes (<100).
- **afterCreating hooks**: Add model creation time. For large batches, hooks can significantly increase time.
- **Relationship factories**: `->has()` creates related models in separate database queries. For large relationships (100+), consider chunking.
- **Factory resolution**: Cached per test class. No repeated resolution overhead.

# Security Considerations

- **afterCreating side effects**: Ensure afterCreating hooks don't accidentally trigger real service calls (emails, API requests). Use `->withoutEvents()` for sensitive operations.
- **State data exposure**: Factory states should not contain sensitive or real user data.

# Common Mistakes

**Mistake: State methods with non-deterministic data**
- Description: `public function published(): Factory { return $this->state(['published_at' => now()]); }`
- Cause: "now() is the natural value"
- Consequence: `now()` varies per test run; test may not be reproducible
- Better: Use `$this->state(['published_at' => Carbon::yesterday()])` or freeze time in tests.

**Mistake: Overusing afterCreating for test-scenario relationships**
- Description: All users get a profile via afterCreating, but only some tests need profiles
- Cause: "Saves writing relationship setup in each test"
- Consequence: Unnecessary data creation; slower tests; implicit relationships
- Better: Use `->has()` for scenario-specific relationships.

**Mistake: Unclear attribute precedence**
- Description: `User::factory()->admin()->create(['role' => 'member'])` — which role wins?
- Cause: Not knowing create() attributes take precedence
- Consequence: Unpredictable behavior
- Better: Document precedence: create() > last state > first state > base.

# Anti-Patterns

- **Non-deterministic state values**: Using `now()`, `rand()`, or `Str::random()` in state definitions.
- **Hidden afterCreating complexity**: Tests that rely on afterCreating side effects without knowing they exist.
- **Incompatible state combinations**: Using both `draft` and `published` states that override the same attribute.
- **Sequence overflow assumptions**: Creating more models than sequence items without understanding wrapping behavior.

# Examples

**Content status states**
```php
class PostFactory extends Factory
{
    public function published(): static
    {
        return $this->state(['status' => 'published', 'published_at' => Carbon::yesterday()]);
    }

    public function draft(): static
    {
        return $this->state(['status' => 'draft', 'published_at' => null]);
    }

    public function archived(): static
    {
        return $this->state(['status' => 'archived', 'published_at' => Carbon::yesterday()]);
    }
}
```

**User role sequence**
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

**Sequence callback for dynamic attributes**
```php
Post::factory(10)
    ->sequence(fn $seq => [
        'title' => "Article {$seq->index}",
        'published_at' => now()->subDays($seq->index),
    ])
    ->create();
```

**Combined states + relationships**
```php
$post = Post::factory()
    ->published()
    ->has(Comment::factory(3)->sequence(
        ['is_approved' => true],
        ['is_approved' => true],
        ['is_approved' => false],
    ))
    ->create();
```

# Related Topics

- Declarative factory methods
- Minimal data principle
- Database testing lifecycle
- Custom factory classes
- Factory for non-Eloquent objects (DTO factories)
- Factory callbacks and events

# AI Agent Notes

- When generating factory states, use deterministic values (Carbon::yesterday()) not dynamic ones (now()).
- Generate state methods for the most common domain states: publish/draft/archive, admin/member/guest, active/inactive.
- Use sequence callbacks with `$seq->index` for index-based variations.
- Document afterCreating hooks clearly in generated factory code.
- For relationship creation in tests, use `->has()` not afterCreating for scenario-specific relationships.

# Verification

- [ ] State methods use deterministic values (not now(), rand(), Str::random())
- [ ] Factory states are documented in factory docblocks
- [ ] afterCreating hooks are documented and minimal
- [ ] Sequence usage is clear and tested
- [ ] Attribute precedence is documented (create() > state() > base)
- [ ] States are compatible with each other (no conflicting attributes)
- [ ] afterCreating hooks don't trigger real service calls
- [ ] Factory definitions are reviewed during schema migrations
