# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Data Management |
| Knowledge Unit | Declarative Factory Methods |
| Difficulty | Intermediate |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Model factories (definition, states), PHP class and trait basics |
| Related KUs | Factory states and sequences, Minimal data principle, Test organization patterns |
| Source | domain-analysis.md K047 |

# Overview

Declarative factory methods are custom helper methods that encapsulate complex object creation logic behind descriptive names, making test setup readable, self-documenting, and maintainable. Instead of inline factory calls chained with states, sequences, and relationships, declarative methods like `$this->createSubscribedUser()` or `$this->createTeamWithAdminAndMember()` express the test's intent directly. This pattern is a core recommendation in the Laravel testing community for improving test readability and reducing duplication. Declarative factory methods serve as a domain-specific language (DSL) for test data creation.

# Core Concepts

- **Declarative method**: A test helper method that encapsulates object creation. Named to describe the created object's state and role.
- **Factory method vs direct factory call**: `$this->createPublishedPost()` vs `Post::factory()->published()->create()`. The declarative version expresses intent without implementation details.
- **Parameterized methods**: Declarative methods that accept parameters for configurable values. `$this->createUserWithRole('editor')`.
- **Chained creation**: Methods that create multiple related objects. `$this->createTeamWithOwnerAndMembers($ownerCount = 5)`.
- **Return types**: Declarative methods typically return the created model or a named tuple (`[$user, $team]`) for complex setups.
- **Trait-based organization**: Declarative factory methods are often organized in traits (`Tests/Helpers/UserFactory.php`) and used across multiple test files.

# When To Use

- Complex object creation scenarios involving relationships
- Repeated creation patterns across multiple test files
- Improving test readability by abstracting setup details
- Establishing a consistent domain vocabulary for test data
- Reducing test boilerplate for common scenarios

# When NOT To Use

- Simple single-model creation with no special state (use `User::factory()->create()`)
- One-off test scenarios with unique data (inline factory calls are clearer)
- Over-abstraction: when the method signature is harder to understand than the factory call
- Methods with too many parameters (indicates poor encapsulation)
- Before establishing a consistent naming convention

# Best Practices (WHY)

- **Name methods to describe what is created, not how**: Reason: `createSubscribedUser()` tells the reader what the setup state is. `createUserWithSubscriptionAndPaymentMethod()` describes implementation details.
- **Use `createX()` for persisted, `makeX()` for non-persisted**: Reason: follows Laravel's factory convention. Developers immediately know whether the object is in the database.
- **Limit parameters to 1-3 per method**: Reason: too many parameters reduce readability. Use `$overrides` array for exceptional cases.
- **Always declare return types**: Reason: enables IDE autocompletion. Callers know what they receive.
- **Return all created objects**: Reason: if a method creates a team and a user, return both. Hidden state causes brittle tests.
- **Organize in traits by domain**: Reason: traits allow mixing and matching across test classes without forcing a single hierarchy.

# Architecture Guidelines

- **Method location**: Traits in `Tests/Helpers/` for domain-specific methods. Base test class for application-wide helpers. Dedicated factory class for complex setups.
- **Naming conventions**: `createX()` (persisted), `makeX()` (non-persisted), `buildX()` (with specific state).
- **Return type conventions**: Single model for simple methods. Named arrays/destructuring for multi-object returns. Avoid >3-4 objects per method.
- **Method organization**: Group related methods in traits (`UserFactory.php`, `TeamFactory.php`, `PostFactory.php`).
- **Parameterization balance**: 2-3 key parameters. Beyond that, use `$overrides` array or split into multiple methods.

# Performance Considerations

- Declarative methods have no performance overhead beyond underlying factory calls.
- Chained creation methods may create more data than needed for a specific test. Be mindful of unnecessary data creation.
- Traits loaded per-test have minimal overhead (PHP class loading).
- Methods creating many related objects should accept count parameters to limit data creation.
- Database transactions (RefreshDatabase) roll back all created data automatically.

# Security Considerations

- **Method documentation**: Document what each method creates and what assumptions it makes. Hidden behavior can lead to test false positives.
- **Naming consistency**: Ensure method names accurately describe what's created. A method named `createUser()` should not also create teams or posts without indicating so.

# Common Mistakes

**Mistake: Over-parameterization**
- Description: One method with 10 parameters for every variation
- Cause: "One method to rule them all"
- Consequence: Test callers are hard to read; most parameters irrelevant
- Better: Multiple focused methods with 1-3 key parameters each.

**Mistake: Methods that create hidden global state**
- Description: `createUserWithTeam()` creates a team but doesn't return it
- Cause: Test only needs the user; team is secondary
- Consequence: Test may inadvertently depend on the team existing
- Better: Return all created objects or name the method to reveal what's created.

**Mistake: Not using return types**
- Description: PHP dynamic typing; return type is implicit
- Cause: Laziness
- Consequence: IDE can't autocomplete; callers don't know what they get
- Better: Always declare return types.

**Mistake: Too many tiny methods**
- Description: `createUser1()`, `createUser2()`, `createUser3()` for minor variations
- Cause: "Each variation deserves its own method"
- Consequence: Cluttered test helpers; hard to find the right method
- Better: Use parameterized methods or factory states for variations.

# Anti-Patterns

- **Method drift**: Declarative method behavior changes without updating all callers. Review all callers when changing a shared method.
- **Hidden data dependencies**: A declarative method creates data the test doesn't explicitly need. Keep methods focused.
- **Inconsistent naming**: `createAdmin()`, `makeAdminUser()`, `buildAdmin()` all do different things but sound similar. Standardize.
- **Circular dependencies**: Method A calls Method B which calls Method A. Keep methods independent.

# Examples

**Single-object declarative method**
```php
trait UserFactory
{
    private function createAdminUser(): User
    {
        return User::factory()->admin()->create();
    }

    private function createSubscribedUser(): User
    {
        return User::factory()
            ->subscribed('pro')
            ->has(PaymentMethod::factory())
            ->create();
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
        $team = Team::factory()
            ->hasAttached($admin, ['role' => 'admin'])
            ->create();
        $member = User::factory()->create();
        $team->members()->attach($member, ['role' => 'member']);
        return [$team, $admin, $member];
    }
}
```

**Parameterized declarative method**
```php
trait PostFactory
{
    private function createPublishedPost(string $title = 'Test Post', int $commentCount = 0): Post
    {
        $factory = Post::factory()->published()->state(['title' => $title]);
        if ($commentCount > 0) {
            $factory = $factory->has(Comment::factory($commentCount));
        }
        return $factory->create();
    }
}
```

**Usage in test**
```php
test('admin can see all team members', function () {
    [$team, $admin] = $this->createTeamWithAdminAndMember();
    $this->actingAs($admin)
        ->get("/teams/{$team->id}/members")
        ->assertOk()
        ->assertSee('member');
});
```

# Related Topics

- Factory states and sequences
- Minimal data principle
- Test organization patterns
- Builder pattern for test data
- Domain-specific test DSL
- Test data factory refactoring

# AI Agent Notes

- When generating declarative factory methods, use descriptive names that reveal what's created.
- Use `createX()` for persisted objects and `makeX()` for non-persisted.
- Always declare return types on generated methods.
- Return all created objects from multi-object methods.
- Organize methods in domain-specific traits, not in the base test class.
- Limit parameters to 2-3 per method; use `$overrides` array for exceptional cases.

# Verification

- [ ] Declarative methods use descriptive names (what, not how)
- [ ] `createX()` = persisted, `makeX()` = non-persisted convention is followed
- [ ] Return types are declared on all methods
- [ ] Multi-object methods return all created objects
- [ ] Methods are organized in domain-specific traits
- [ ] Parameters are limited to 1-3 per method
- [ ] afterCreating hooks are not used for scenario-specific relationships
- [ ] Method name accurately describes what is created
