# Skill: Organize Tests for Readability and Maintainability

## Purpose
Structure Laravel test files by feature with descriptive naming, AAA pattern, and declarative factory methods to maximize readability, maintainability, and documentation value.

## When To Use
- When starting a new project (establish conventions from day one)
- When the test suite exceeds 50 tests (organization becomes critical)
- When multiple developers contribute (consistent naming and structure)
- When onboarding new team members (tests as living documentation)
- When refactoring an existing disorganized test suite

## When NOT To Use
- For trivial test suites (<20 tests) where flat structure is clear
- When rigid conventions slow down prototyping (establish patterns later)
- When testing a proof-of-concept or prototype
- When the team hasn't agreed on organization conventions

## Prerequisites
- Pest or PHPUnit test writing experience
- Understanding of AAA (Arrange-Act-Assert) structure
- Knowledge of feature-based directory organization
- Familiarity with Declarative Factory Methods

## Inputs
- Application features and their boundaries
- Test directory structure (feature-based)
- Naming conventions for test files and methods
- Shared setup patterns for extraction

## Workflow
1. Organize test directories by business feature: `tests/Feature/Invoices/`, `tests/Feature/Users/`
2. Split large test files at ~300 lines into sub-feature files
3. Name test files by sub-feature: `InvoiceSubmissionTest.php`, `InvoiceCancellationTest.php`
4. Write test names as descriptive sentences: `test('rejects invoice with past due date')`
5. Structure each test with AAA and blank line separation
6. Accept reasonable duplication in tests over extraction to distant helpers
7. Extract declarative factory methods into domain-specific traits for repeated complex setup
8. Use `describe()` blocks in Pest for grouping related tests within a file
9. Review test structure quarterly — rename, split, or consolidate as features evolve

## Validation Checklist
- [ ] Tests are organized by feature, not by implementation type
- [ ] Each feature has a dedicated test directory
- [ ] Test files are kept under ~300 lines
- [ ] Test names are descriptive and communicate expected behavior
- [ ] AAA pattern is used with blank line separation
- [ ] Declarative factory methods encapsulate complex setup
- [ ] Test naming conventions are documented and consistent
- [ ] Architecture tests enforce organizational conventions
- [ ] Dead test helpers are removed quarterly

## Common Failures
- Organizing tests by implementation type — related tests scattered, understanding a feature requires 5 files
- Long, unstructured test methods — first assertion failure hides later assertions
- Mixing AAA sections — unclear where setup ends and verification begins
- Generic test names — failure report doesn't indicate what broke
- Bloated single test files — impossible to navigate at 2000+ lines
- Over-extracted test helpers — readers must jump between files to understand setup

## Decision Points
- Feature-based vs type-based organization — feature for most applications, type-based only for very large codebases
- File vs `describe()` grouping — separate files per sub-feature when >50 tests, `describe()` for smaller groupings
- Inline duplication vs extraction — inline for readability when setup is simple, extract when same pattern appears in 3+ tests

## Performance Considerations
- Organization does not directly affect execution time
- Feature-based grouping works well with parallel execution — each feature directory can be a shard
- Well-organized tests are easier to profile and optimize
- Large fixture data in helpers may increase memory — use lazy loading

## Security Considerations
- Security-critical tests (auth, permissions) must be easy to find and review
- Feature-based organization helps locate security tests
- Architecture tests can enforce security conventions
- Security test files should have clear naming for easy identification

## Related Rules
- [Rule: Group Tests by Feature, Not by Implementation Type](./05-rules.md)
- [Rule: Use Descriptive Test Names](./05-rules.md)
- [Rule: Use AAA with Blank Line Separation](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Test Naming Conventions
- Flaky Test Prevention

## Success Criteria
- [ ] Test suite follows feature-based organization consistently
- [ ] Test names are readable as specifications of behavior
- [ ] Test files are under 300 lines and easy to navigate
- [ ] New team members can understand system behavior by reading tests
- [ ] Architecture tests enforce organizational conventions where possible
