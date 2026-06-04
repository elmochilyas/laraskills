# Skill: Seed Test Data with Declarative Factory Methods

## Purpose
Create declarative factory methods in test helpers to encapsulate complex seeding logic behind descriptive names, enabling readable, maintainable, and reusable test data setup.

## When To Use
- When complex object creation requires multiple factory calls and relationships
- When test scenarios appear in multiple test files
- When improving readability of Arrange sections in feature tests
- When creating domain-specific test data (subscriptions, teams, orders)
- When onboarding new team members (declarative methods document patterns)

## When NOT To Use
- For simple single-model creation (use `User::factory()->create()` directly)
- For very rarely used scenarios (the method won't be found or reused)
- When the method body is longer than the inline setup it replaces
- As a substitute for understanding factory states and sequences
- When methods create hidden data dependencies that confuse readers

## Prerequisites
- Model factory definitions and states
- Understanding of PHP traits for method organization
- Knowledge of the domain models and their relationships

## Inputs
- Model classes and their relationships
- Common creation scenarios across tests
- Factory states available for each model
- Return type declarations

## Workflow
1. Identify repeated object creation patterns shared across 3+ tests
2. Create a domain-specific trait: `Tests/Helpers/UserFactory.php`
3. Name methods by what they create: `createAdminUser()` not `createUserWithAdminRole()`
4. Prefix persisted methods with `create`, non-persisted with `make`
5. Declare explicit PHP return types on every method
6. Limit parameters to 2-3; use `array $overrides = []` for variations
7. Return all created objects from multi-object methods using named arrays
8. Use deterministic defaults — no `now()`, no Faker
9. Use the trait in test classes that need it

## Validation Checklist
- [ ] Declarative methods use `create` (persisted) and `make` (non-persisted) naming convention
- [ ] Methods have explicit PHP return types
- [ ] Methods are organized in domain-specific traits, not the base test class
- [ ] Each method has 3 or fewer parameters
- [ ] Multi-object methods return named tuples with all created objects
- [ ] Methods use deterministic defaults (no `now()`, no Faker)
- [ ] Methods are documented with what they create and their assumptions
- [ ] Trait is used only in test classes that need it (not globally)

## Common Failures
- Over-parameterization — one method with many parameters creates unreadable call sites
- Methods with hidden global state — creates objects but doesn't return them
- Not using return types — no IDE autocompletion, unclear contract
- Too many tiny methods — `createUser1()`, `createUser2()`, `createUser3()` for minor variations
- Inconsistent naming — mixing `create`, `make`, `build`, `setup` prefixes
- Base class dumping ground — all methods in base test class instead of domain traits

## Decision Points
- Trait vs base test class — trait for domain-specific methods, base class for app-wide helpers
- `create()` vs `make()` — create for persisted, make for non-persisted
- Fixed vs parameterized — fixed defaults for most cases, parameterized for variations

## Performance Considerations
- No overhead: declarative methods add no performance impact beyond factory calls
- Chained creation may create more data than needed — accept count parameters
- Trait loading: PHP class loading is negligible
- Transaction cleanup: `RefreshDatabase` rolls back all data created by methods

## Security Considerations
- Method visibility: declarative methods should be `private` or `protected`
- Methods may create sensitive test data (admin users, payment records) — review what's created
- Side effects: methods may trigger notifications, jobs, or external calls — use `Queue::fake()` as needed
- Trait access: traits used across test classes can introduce unexpected dependencies

## Related Rules
- [Rule: Name Methods to Describe What They Create](./05-rules.md)
- [Rule: Use the `create`/`make` Naming Convention](./05-rules.md)
- [Rule: Always Declare Explicit Return Types](./05-rules.md)

## Related Skills
- Factory States and Sequences
- Minimal Data Principle
- Test Organization Patterns

## Success Criteria
- [ ] Declarative factory methods exist for repeated complex scenarios
- [ ] Methods are organized in domain-specific traits
- [ ] Return types are declared and all created objects are returned
- [ ] Call sites are more readable than inline factory chains
- [ ] Methods are used across multiple test files in the same domain
