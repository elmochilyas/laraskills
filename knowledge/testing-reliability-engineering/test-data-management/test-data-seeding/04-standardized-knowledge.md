# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Data Management
Knowledge Unit: Test Data Seeding (Declarative Factory Methods)
 KU Code: ku-02-test-data-seeding
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Declarative factory methods are custom helper methods that encapsulate complex object creation logic behind descriptive names, making test setup readable, self-documenting, and maintainable. Instead of inline factory calls chained with states and relationships, declarative methods like `$this->createSubscribedUser()` express the test's intent directly. This pattern is a core recommendation in the Laravel testing community for improving test readability and reducing duplication. Declarative methods serve as a domain-specific language (DSL) for test data creation.

# Core Concepts
- **Declarative method**: A test helper that encapsulates object creation. Named to describe the created object's state and role. `private function createAdminUser(): User`.
- **Factory method vs direct call**: `$this->createPublishedPost()` vs `Post::factory()->published()->create()`. Declarative version expresses intent without implementation details.
- **Parameterized methods**: Methods accepting parameters for configurable values. `$this->createUserWithRole('editor')`.
- **Chained creation**: Methods creating multiple related objects. `$this->createTeamWithOwnerAndMembers()`.
- **Return types**: Declarative methods return the created model or named tuples for complex setups.
- **Trait-based organization**: Methods are often organized in traits (`Tests/Helpers/UserFactory.php`) for reuse.

# When To Use
- Complex object creation requiring multiple factory calls and relationships
- Test scenarios that appear in multiple test files (standardized setup)
- Improving readability of Arrange sections in feature tests
- Creating domain-specific test data (subscriptions, teams, orders)
- Onboarding new team members (declarative methods document data creation patterns)

# When NOT To Use
- Simple single-model creation that doesn't reduce verbosity
- Very rarely used scenarios (the method won't be discovered or reused)
- When the method body is longer than the inline setup it replaces
- As a substitute for understanding factory states and sequences
- When methods create hidden data dependencies that confuse readers

# Best Practices (WHY)
- **Name methods to describe what they create, not how**: Reason: `createAdminUser()` tells you what you get. `createUserWithAdminRole()` tells you how it's done. Prefer what over how.
- **Use the `create` vs `make` convention**: Reason: `createX()` persists to database. `makeX()` returns unsaved model. Established Laravel convention that all developers understand.
- **Return typed values**: Reason: IDE autocompletion and static analysis work with declared return types. Untyped returns force readers to read the method body.
- **Limit parameters to 2-3 per method**: Reason: too many parameters reduce readability. Use an options array or split into multiple methods for more variations.
- **Organize methods in domain-specific traits**: Reason: `UserFactory` trait groups user-related methods. `TeamFactory` trait groups team methods. Mix and match per test class.
- **Document what each method creates**: Reason: other developers need to know assumptions, defaults, and side effects without reading the implementation.
- **Review and consolidate methods quarterly**: Reason: unused methods accumulate. Duplicate methods for similar scenarios increase maintenance burden.

# Architecture Guidelines
- **Method location hierarchy**: Trait > base test class > dedicated factory class. Traits are most flexible.
- **Return convention**: Single model for simple methods. Named array/destructuring for multi-object returns. Avoid returning more than 3-4 objects.
- **Default value philosophy**: Sensible defaults that make tests pass. Override only for test-specific variations.
- **Method discovery**: Use IDE navigation, organized traits, and naming conventions. Consider generating a factory method index.
- **Consistency with factory states**: Declarative methods should use factory states internally, not duplicate state logic.

# Performance
- **No overhead**: Declarative methods add no performance overhead beyond the underlying factory calls.
- **Chained creation**: May create more data than needed. Accept count parameters to limit.
- **Trait loading**: PHP class loading is negligible. No runtime impact.
- **Transaction cleanup**: `RefreshDatabase` rolls back all data created by declarative methods.

# Security
- **Method visibility**: Declarative methods are typically `private` or `protected`. Don't expose them as public API.
- **Data exposure**: Methods may create sensitive test data (admin users, payment records). Review what data is created.
- **Side effects**: Methods may trigger notifications, jobs, or external calls. Use `Queue::fake()` and `Mail::fake()` as needed.
- **Trait access**: Traits used across test classes can introduce unexpected dependencies. Ensure traits are used intentionally.

# Common Mistakes

**Mistake: Over-parameterization**
- Description: One method with 10 parameters for every possible variation
- Cause: "One method to rule them all"
- Consequence: Test callers are hard to read; most parameters irrelevant to specific tests
- Better: Multiple focused methods with 1-3 key parameters each. Use `$overrides` array for exceptional cases.

**Mistake: Methods with hidden global state**
- Description: `createUserWithTeam()` creates team and attaches user but returns only the user
- Cause: Convenience; "the test doesn't need the team"
- Consequence: Test may inadvertently depend on the team existing without knowing it
- Better: Return all created objects or use descriptive names that reveal what's created.

**Mistake: Not using return types**
- Description: PHP dynamic typing; return type is implicit
- Cause: "PHP doesn't require return types"
- Consequence: IDE can't autocomplete; callers don't know what they get
- Better: Always declare return types. Use named arrays or DTOs for complex returns.

**Mistake: Too many tiny methods**
- Description: `createUser1()`, `createUser2()`, `createUser3()` for minor variations
- Cause: Creating methods for every test scenario instead of using parameters
- Consequence: Cluttered test helpers; hard to find the right method
- Better: Use parameterized methods or factory states for variations. Limit method count per trait.

# Anti-Patterns
- **Method-as-black-box**: A declarative method that creates so much data the test reader can't reason about what exists. Keep methods focused.
- **Circular dependencies**: Method A calls method B which calls method A. Keep methods independent.
- **Inconsistent naming**: `createAdmin()`, `makeAdminUser()`, `buildAdmin()` all do different things. Standardize `create` (persisted) and `make` (non-persisted).
- **Base class dumping ground**: Putting all declarative methods in the base test class instead of organizing by domain in traits.
- **Testing the factory method**: Writing unit tests for declarative factory methods. They're test helpers, not production code.

# Examples

**Single-object declarative method**
```php
trait UserFactory
{
    private function createAdminUser(array $overrides = []): User
    {
        return User::factory()->admin()->create($overrides);
    }

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->make($overrides);
    }
}
```

**Multi-object declarative method**
```php
trait TeamFactory
{
    private function createTeamWithAdminAndMember(): array
    {
        $admin = User::factory()->admin()->create();
        $team = Team::factory()->hasAttached($admin, ['role' => 'admin'])->create();
        $member = User::factory()->create();
        $team->members()->attach($member, ['role' => 'member']);

        return [$team, $admin, $member];
    }
}
```

**Parameterized declarative method**
```php
private function createUserOnPlan(string $plan = 'free', array $overrides = []): User
{
    return User::factory()
        ->state(array_merge(['plan' => $plan], $overrides))
        ->has(Subscription::factory()->state(['plan' => $plan]))
        ->create();
}
```

**Usage in a test**
```php
test('admin can access admin dashboard', function () {
    $admin = $this->createAdminUser();
    $this->actingAs($admin)->get('/admin')->assertOk();
});
```

# Related Topics
- Factory states and sequences
- Minimal data principle
- Test organization patterns
- Builder pattern for test data
- Database testing lifecycle

# AI Agent Notes
- When generating test code, always prefer declarative factory methods over inline factory chains for complex object creation.
- Use the `create`/`make` naming convention consistently in generated code.
- Generate methods with explicit return types. Use `@return array{Team, User, User}` for multi-object returns.
- Limit parameters to 3 max. Use `array $overrides = []` as the last parameter for exceptional variations.
- Organize generated methods in domain-specific traits (UserFactory, TeamFactory, SubscriptionFactory) rather than a single helper file.
- When a test's Arrange section exceeds 5 lines, suggest extracting a declarative method.

# Verification
- [ ] Declarative methods use `create` (persisted) and `make` (non-persisted) naming convention
- [ ] Methods have explicit PHP return types
- [ ] Methods are organized in domain-specific traits, not the base test class
- [ ] Each method has 3 or fewer parameters
- [ ] Multi-object methods return named tuples with all created objects
- [ ] Methods use deterministic defaults (no `now()`, no Faker)
- [ ] Methods are documented with what they create and their assumptions
- [ ] Trait is used only in test classes that need it (not globally)
