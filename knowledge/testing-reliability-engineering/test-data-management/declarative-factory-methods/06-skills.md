# Skill: Create Declarative Factory Methods

## Purpose
Write custom declarative factory methods that encapsulate complex object creation behind descriptive names, making Laravel test setup readable, self-documenting, and reducing duplication.

## When To Use
- When complex object creation involving relationships is repeated across tests
- When improving test readability by abstracting setup details
- When establishing a consistent domain vocabulary for test data
- When reducing test boilerplate for common scenarios
- When the Arrange section of tests becomes longer than Act + Assert combined

## When NOT To Use
- For simple single-model creation with no special state (use `User::factory()->create()`)
- For one-off test scenarios with unique data (inline factory calls are clearer)
- When the method adds more complexity than the inline setup it replaces
- Before establishing a consistent naming convention
- When methods would have more than 3 parameters

## Prerequisites
- Laravel model factories (definition, states, relationships)
- Understanding of PHP traits for method organization
- Knowledge of the domain models and their relationships

## Inputs
- Model classes and their relationships
- Common creation scenarios across tests
- Factory states available for each model
- Return type for the method (single model, array, collection)

## Workflow
1. Identify repeated object creation patterns across 3+ tests
2. Create a domain-specific trait: `Tests/Helpers/UserFactory.php`
3. Use the `create`/`make` convention: `createAdminUser()` (persisted), `makeUser()` (non-persisted)
4. Name methods by what they create, not how: `createSubscribedUser()` not `createUserWithSubscription()`
5. Declare explicit return types: `private function createAdminUser(): User`
6. Limit parameters to 1-3; use `array $overrides = []` for exceptional variations
7. Return all created objects from multi-object methods: `[$team, $admin] = $this->createTeamWithAdminAndMember()`
8. Use trait in test classes: `class InvoiceTest extends TestCase { use UserFactory; }`
9. Use deterministic defaults (no `now()`, no Faker in defaults)

## Validation Checklist
- [ ] Declarative methods use descriptive names (what, not how)
- [ ] `createX()` = persisted, `makeX()` = non-persisted convention is followed
- [ ] Return types are declared on all methods
- [ ] Multi-object methods return all created objects
- [ ] Methods are organized in domain-specific traits
- [ ] Parameters are limited to 1-3 per method
- [ ] afterCreating hooks are not used for scenario-specific relationships
- [ ] Method name accurately describes what is created
- [ ] Methods use deterministic defaults

## Common Failures
- Over-parameterization — one method with 10 parameters for every variation, unreadable call sites
- Methods with hidden global state — creates objects but doesn't return them, brittle tests
- Not using return types — IDE can't autocomplete, callers don't know what they get
- Too many tiny methods — `createUser1()`, `createUser2()`, `createUser3()` for minor variations
- Method drift — behavior changes without updating all callers
- Inconsistent naming — `createAdmin()`, `makeAdminUser()`, `buildAdmin()` all do different things

## Decision Points
- Trait vs base test class — trait for domain-specific methods, base class for application-wide helpers
- `create()` vs `make()` — create for persisted objects, make for non-persisted
- Fixed vs parameterized — fixed for simple creation, parameterized when callers need variations

## Performance Considerations
- Declarative methods have no overhead beyond underlying factory calls
- Chained creation methods may create more data than needed — accept count parameters to limit
- Traits loaded per-test have minimal overhead (PHP class loading)
- Database transactions (RefreshDatabase) roll back all created data automatically

## Security Considerations
- Method documentation: document what each method creates and its assumptions
- Naming consistency: ensure method names accurately describe what's created
- Hidden behavior: a method named `createUser()` should not also create teams or posts without indicating so
- Ensure methods don't create data with real user information or PII

## Related Rules
- [Rule: Name Methods to Describe What Is Created](./05-rules.md)
- [Rule: Use `createX()` for Persisted, `makeX()` for Non-Persisted](./05-rules.md)
- [Rule: Always Declare Return Types](./05-rules.md)

## Related Skills
- Factory States and Sequences
- Minimal Data Principle
- Test Organization Patterns

## Success Criteria
- [ ] Declarative factory methods exist for repeated creation patterns
- [ ] Methods are named by what they create, not how
- [ ] Return types are declared and all created objects are returned
- [ ] Methods are organized in domain-specific traits
- [ ] Call sites are more readable than inline factory chains
