# Decomposition: Unit Test Structure

## Topic Overview
Unit tests validate isolated business logic without booting the full Laravel framework. The `#[UnitTest]` attribute and proper AAA structure are essential for maintaining fast, reliable unit tests.

## Decomposition Strategy
This knowledge unit breaks down into three areas: (1) unit test fundamentals including `#[UnitTest]` and isolation, (2) test structure patterns (AAA, one scenario per test, datasets), and (3) the distinction between state verification and interaction verification.

## Proposed Folder Structure
```
ku-01-unit-test-structure/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory
| Component | Type | Description |
|-----------|------|-------------|
| `#[UnitTest]` attribute | concept | Marks tests that skip Laravel framework boot |
| AAA pattern | practice | Arrange-Act-Assert universal test structure |
| One scenario per test | practice | Each test method verifies one behavior |
| State vs interaction verification | practice | Prefer asserting results over method calls |
| Dataset parameterization | practice | Using `->with()` for multiple input variations |
| Time manipulation | practice | Freezing time with `Carbon::setTestNow()` |
| Edge case coverage | practice | Testing boundary conditions and error paths |

## Dependency Graph
```
Unit Test Structure
├── Requires: PHP/Pest basics
├── Related: Test double taxonomy
├── Related: DTO test factories
├── Related: Dependency injection testing
└── Related: Mockery integration
```

## Boundary Analysis
This KU focuses on the structure and conventions of individual unit tests. It does not cover specific mocking strategies, DTO factories, or dependency injection patterns, which are covered in related KUs.

## Future Expansion Opportunities
- Property-based testing for Laravel
- Mutation testing guided by unit test coverage
- Test-driven development workflows
- Unit test naming conventions catalog
