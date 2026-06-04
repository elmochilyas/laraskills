# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Model Factory Relationships
**Difficulty:** Intermediate
**Category:** Testing & Quality Assurance
**Last Updated:** 2026-06-03

---

# Overview

Model Factory Relationships are the patterns for defining, creating, and managing Eloquent model relationships within Laravel model factories — covering belongs-to, has-many, belongs-to-many, morph relationships, nested relationship creation, and relationship state management. They exist because API tests invariably require related models (a post belongs to a user, a comment belongs to a post), and manually wiring these relationships creates fragile, duplicated test setup.

Engineers must care because inefficient relationship handling in factories is the leading cause of slow, brittle test suites. Every relationship created in a factory test adds database queries and setup time. Proper relationship factory patterns minimize database operations, prevent N+1 problems in test setup, and keep test suites fast.

---

# Core Concepts

**Belongs-To Relationship:** Child model references parent. `Comment::factory()->for(Post::factory())` creates both with a single call.

**Has-Many Relationship:** Parent model has children. `Post::factory()->has(Comment::factory()->count(3))` creates a post with 3 comments.

**Belongs-To-Many Relationship:** Models share a pivot table. `User::factory()->hasAttached(Role::factory()->count(2))` creates a user with 2 roles.

**Morph Relationships:** Polymorphic associations. `Comment::factory()->for($commentable, 'commentable')` creates a comment for any commentable model.

**Nested Relationships:** Multi-level creation. `Post::factory()->has(Comment::factory()->count(3)->for(User::factory()))` creates a post with 3 comments, each by a different user.

**Factory States for Relationships:** Named states that configure relationship conditions. `User::factory()->hasPosts(3)->create()` semantically communicates the test scenario.

---

# When To Use

- Every test that requires related model data
- Tests for endpoints that include or return related resources
- Testing query scopes and filters that depend on relationships
- Testing validation rules that check related data existence
- Feature tests for nested resource endpoints

---

# When NOT To Use

- Unit tests for isolated logic that doesn't need database
- Tests where relationship data is irrelevant to the scenario
- Performance benchmarks (use raw DB inserts for precision)

---

# Best Practices

**Use factory relationship methods over manual creation.** `HasFactory::for()` and `has()` are more expressive and handle foreign key assignment automatically.

**Chain relationships for nested scenarios.** For a post with 5 comments from 3 different users, chain the factory calls rather than creating models individually.

**Use states to configure relationship conditions.** `Post::factory()->published()->has(Comment::factory()->count(3))` communicates test intent.

**Create minimum viable relationships.** If a test only needs a post that belongs to a user, create just that relationship. Don't add unnecessary comments, tags, or likes.

**Use recycle() to reuse existing models.** When multiple factories need the same parent, `User::factory()->recycle($sharedUser)->has(Post::factory()->count(5))` creates a single user shared across 5 posts.

**Prefer sequence() for varied relationship data.** `Comment::factory()->count(3)->sequence(fn ($seq) => ['rating' => $seq->index + 1])` creates comments with incremental values.

---

# Architecture Guidelines

**Relationship factories mirror the domain model's relationships.** If a Post hasMany Comment and belongsTo User, the factory definitions should support both directions.

**Factory relationship methods are defined in the factory class.** `post()->hasComments(3)` is a custom factory method, not inline magic. This keeps relationship creation discoverable.

**Reusable relationship traits belong in factory traits.** Shared relationship patterns (like `withAuthor`, `withTags`) are extracted to traits for use across multiple factories.

**Deep nesting (3+ levels) should be split into test helpers.** A post → comments → replies → likes scenario deserves a helper method rather than inline factory chain.

---

# Performance Considerations

**Each related model adds a database insert.** 5 comments + 1 post + 1 user = 7 inserts. Use `recycle()` to share existing models and reduce total inserts.

**N+1 in test setup.** Creating `Post::factory()->has(Comment::factory()->count(50))` creates 51 models. For lists, limit relationship count to what the test needs.

**Factory creation with relationships is not lazy.** Calling `create()` on a factory with `has()` immediately creates all related models. Use `make()` for non-persisted relationship testing.

**Recycle existing users across tests.** Creating a new user per test is the most common performance waste. Share a single user instance via `beforeEach` and `recycle()`.

---

# Security Considerations

**Factory relationships create real database records.** Ensure test database is isolated from production.

**Sensitive model attributes (passwords, tokens) should be handled by factory defaults.** Relationship creation doesn't change parent attribute handling.

**Factory state can override security defaults.** A `User::factory()->admin()->create()` creates an admin user — ensure tests using admin factories don't accidentally grant excessive privileges.

---

# Common Mistakes

**Creating unnecessary relationships.** A test for "list posts" doesn't need comments, tags, or likes. Extra relationships slow the test without adding value.

**Manual foreign key assignment.** `Comment::factory()->create(['post_id' => $post->id])` works but is less expressive than `Comment::factory()->for($post)->create()`.

**Not recycling existing models.** Creating a new user for every factory call in the same test creates unnecessary database records.

**Deep inline factory chains without helper extraction.** 6-level deep factory chains are unreadable and fragile.

**Forgetting to handle unique constraints.** Creating 2 users with the same email triggers unique constraint violations. Use `sequence()` or `state()` to vary constrained fields.

---

# Anti-Patterns

**Factory Sprawl:** Creating every possible related model for every test regardless of test need.
**Better approach:** Create only the minimum relationships required for the specific test scenario.

**Magic Number Relationships:** `Comment::factory()->count(5)` — why 5? Use named constants or meaningful counts.
**Better approach:** Name the count intention: `Comment::factory()->count(self::PAGE_SIZE)`.

**Global Recycled User Mismatch:** Reusing a single user across tests that need different user states.
**Better approach:** Create the base user with default state; create specialized users per test.

---

# Examples

**Belongs-to relationship:**
```
$comment = Comment::factory()
    ->for(Post::factory()->for(User::factory()), 'commentable')
    ->create();
```

**Has-many with count:**
```
$post = Post::factory()
    ->has(Comment::factory()->count(3))
    ->create();
```

**Belongs-to-many with pivot data:**
```
$user = User::factory()
    ->hasAttached(
        Role::factory()->count(2),
        ['assigned_by' => 'system']
    )
    ->create();
```

**Recycle shared parent:**
```
$user = User::factory()->create();
Post::factory()
    ->count(5)
    ->recycle($user)
    ->has(Comment::factory()->count(2)->recycle($user))
    ->create();
```

---

# Related Topics

**Prerequisites:**
- Laravel Eloquent Relationships — understanding relationship types
- Model Factory Basics — factory definition and creation

**Closely Related Topics:**
- Test Data Factory Design — comprehensive factory patterns
- Feature Test Structure — where factory creation lives in tests

**Advanced Follow-Up Topics:**
- Factory Sequences and States — advanced factory configuration
- Performance Optimization in Tests — minimizing database operations

**Cross-Domain Connections:**
- Eloquent Relationship Modeling — domain-level relationship design
- Database Seeding — factory relationships in seeders
