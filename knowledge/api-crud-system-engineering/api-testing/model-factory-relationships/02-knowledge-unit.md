# Model Factory Relationships

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Model Factory Relationships
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Model Factory Relationships cover how to define and use Eloquent model relationships within Laravel factories for API tests. Proper factory relationship management ensures test data integrity, reduces boilerplate, and enables realistic API test scenarios.

---

## Core Concepts
- **Factory Relationship Methods**: `for()`, `has()`, `hasAttached()`, `belongsTo()` — defining relationships in factory definitions
- **Relationship States**: Defining factory states that configure related models (`->hasPosts(3)`)
- **Pivot Data**: Attaching data to many-to-many relationships in factories via `hasAttached()`
- **Polymorphic Relationships**: Defining morphable factory associations with `morphOne()`, `morphMany()`, `morphToMany()`
- **Circular Dependency Resolution**: Using `afterCreating()` to resolve circular factory relationships
- **Count Parameterization**: `has(3)` and `has($count)` for variable relationship counts

---

## Mental Models
1. **Data Graph Model**: Think of factory relationships as building a graph of interconnected models. Each relation is an edge; each model is a node.
2. **Blueprint-Then-Build Model**: Define the relationship structure (blueprint) in the factory definition, then instantiate (build) it in the test.

---

## Internal Mechanics
Factory relationship methods register callbacks that execute after the parent model is created. `has()` creates related models using their factory definition. `for()` sets the foreign key on the child model. `afterCreating()` runs arbitrary code after creation, useful for resolving circular dependencies.

---

## Patterns

### Pattern 1: Inline Relation Definition
**Purpose**: Define relationships inline in the test using `User::factory()->hasPosts(3)->create()`
**Benefits**: Tests are self-contained; relationships are explicit per test
**Tradeoffs**: Duplicates relationship logic across tests

### Pattern 2: Factory State Relationships
**Purpose**: Define named states in the factory that include relationship creation
**Benefits**: Reusable relationship scenarios; reduces test boilerplate
**Tradeoffs**: Factory files grow complex; relationships become implicit

---

## Architectural Decisions
### When To Use
- Any API test that requires related model data
- Tests for nested resource endpoints
- Tests that verify relationship inclusion in responses

### When To Avoid
- Tests that don't need related data (use simple `User::factory()->create()`)
- Unit tests that mock relationships (use mocked repositories instead)

### Alternatives
- `RefreshDatabase` + direct model creation in tests
- Database seeders for shared test scenarios
- `create()` with manual relationship assignment

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Realistic test data | Factory definitions are extra maintenance | Keep factories aligned with migrations |
| Reusable relationship states | Factory complexity grows with deep nesting | Limit to 2-level deep factory relationships |
| Expressive test setup | Implicit relationships hide test preconditions | Prefer inline definitions for clarity |

---

## Performance Considerations
- Deep factory chains (5+ levels) significantly slow test suites
- Use `create()` only when IDs are needed; use `make()` for non-DB tests
- Batch relationship creation with `has(10)` instead of `has(1)->has(1)->has(1)`
- Use `DatabaseTransactions` over `RefreshDatabase` to reduce test overhead

---

## Production Considerations
- Keep factory relationship definitions in sync with database migrations
- Add `afterCreating()` cleanup for relationships that should cascade delete
- Document complex factory states in comments for team understanding

---

## Common Mistakes
**Circular factory dependencies**: Two factories that create each other cause infinite recursion. Use `afterCreating()` to break the cycle.
**Over-creating related data**: Defaulting to `has(3)` in factory definitions creates unnecessary data when only one is needed.
**Missing foreign key constraints**: Factories that violate foreign key constraints fail silently or with confusing errors. Match factory relationships to migration constraints.

---

## Failure Modes
**Stale factory definitions**: Migrations change but factories aren't updated. *Detection:* Run `php artisan db:check` or test with `RefreshDatabase`. *Mitigation:* Add architecture tests that verify factory definitions match models.
**Massive data creation**: A test that creates deeply nested relationships generates hundreds of rows. *Detection:* Slow test runs. *Mitigation:* Profile test data creation and minimize relationship depth.

---

## Ecosystem Usage
Laravel's `HasFactory` trait adds `factory()` to all models. The `Factory` base class provides `for`, `has`, `hasAttached`, `afterCreating`, and `state` methods. Pest's `on()` helper enables factory chaining in the `expect()` API.

---

## Related Knowledge Units
### Prerequisites
- Laravel Eloquent relationships
- Factory definitions and states

### Related Topics
- Database seeder integration
- Test data factory design

### Advanced Follow-up Topics
- Factory sequence and callback patterns
- Factory for polymorphic many-to-many relationships
- Performance-optimized batch factory creation

---

## Research Notes
- `hasAttached()` is the cleaner alternative to `afterCreating()` for many-to-many pivot data
- Factory sequences (`Sequence`) enable creating related models with varied attribute values
- `when()` in factories allows conditional relationship creation based on parent model state
