# Decomposition: Class & Method Testing (DTO Factories)

## Topic Overview
DTO test factories create Data Transfer Object instances with valid defaults and per-test overrides, eliminating repetitive construction in unit tests. The builder pattern and deterministic defaults are key practices.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) DTO factory patterns (builder, named presets, composition), (2) factory design decisions (deterministic defaults vs random data, immutability), and (3) factory organization and placement conventions.

## Proposed Folder Structure
```
ku-02-class-method-testing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| Builder pattern | concept | Fluent factory with `new()`, `with*()`, and `build()` |
| Deterministic defaults | practice | Fixed values over Faker for predictable tests |
| Named presets | practice | Pre-configured factory methods for common variants |
| Nested composition | practice | Factories composing child factories |
| Immutability preservation | practice | Clone-based DTO creation |
| Factory organization | practice | `tests/DTOFactories/` directory structure |

## Dependency Graph
```
Class & Method Testing (DTO Factories)
├── Requires: Understanding of DTOs and immutability
├── Related: Unit testing patterns
├── Related: Model factory patterns
├── Related: Builder pattern design
└── Related: Spatie laravel-data library
```

## Boundary Analysis
This KU focuses on DTO factories for unit testing. It does not cover Eloquent model factories, database seeding, or integration-level test data management.

## Future Expansion Opportunities
- Auto-generated DTO factories from class reflection
- DTO factory testing patterns
- DTO factory composability patterns for complex object graphs
- Integration with Spatie's laravel-data validation
