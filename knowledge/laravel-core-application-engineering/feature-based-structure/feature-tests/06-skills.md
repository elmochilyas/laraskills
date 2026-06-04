# Skill: Create Feature Test Structure

## Purpose

Set up a mirrored test directory for a feature with a base test case, organized test files, and proper database isolation — enabling per-feature test execution and clear test ownership.

## When To Use

- Creating a new feature that needs test coverage
- Refactoring global test files into per-feature test directories
- Adding a base test case for an existing feature

## When NOT To Use

- Features with no test coverage and no plan to add tests
- Single-file features where a single test file suffices
- Prototypes where test infrastructure overhead is not justified

## Prerequisites

- Feature source directory exists at `app/Features/{Feature}/`
- PHPUnit is configured in the project
- `"Tests\\": "tests/"` in `composer.json` autoload-dev section

## Inputs

- Feature name (e.g., `Billing`)
- List of source classes to mirror
- Feature-specific setup needs (migrations, factories, seeder)

## Workflow

1. Create `tests/Features/{Feature}/` mirroring the source structure
2. Create subdirectories: `Controllers/`, `Services/`, `Requests/` as needed
3. Create an abstract base test case: `Tests\Features\{Feature}\{Feature}TestCase` extending `Tests\TestCase`
4. In the base case's `setUp()`, add feature-specific migration loading and shared factory states
5. Add helper methods for common test scenarios (e.g., `createPaidUser()`)
6. Create test files for each source class, extending the feature base test case
7. Apply `RefreshDatabase` or `DatabaseTransactions` to every test class
8. Create `phpunit.{feature}.xml` if per-feature CI execution is needed

## Validation Checklist

- [ ] Test directory mirrors source structure exactly
- [ ] Base test case exists with feature-specific `setUp()`
- [ ] All test classes extend the feature base test case
- [ ] `RefreshDatabase` or `DatabaseTransactions` applied to every test class
- [ ] Test files split by class or behavior (not one giant file)
- [ ] Tests focus on public API, not internal implementation
- [ ] Factory `$model` references feature model FQCN
- [ ] Tests pass when run in isolation: `phpunit tests/Features/{Feature}/`

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Stale test mirror | Feature renamed, test dir not | Rename test directory when feature is renamed |
| Duplicate setup | No base test case | Extract shared setup into base case |
| One giant test file | All scenarios in single file | Split by class or behavior |
| Shared DB state | Missing `RefreshDatabase` | Apply trait to every test class |
| Testing internals | Testing private methods | Test behavior/output, not internals |

## Decision Points

- **Feature test vs Integration test**: Keep feature tests focused on the feature's boundary. Cross-feature interactions go in `tests/Integration/`.
- **Unit vs Feature subdirectories**: Mirror the source structure: `Controllers/` for HTTP tests, `Services/` for service tests. Add a `Feature/` subdirectory for integration-style tests within the feature.

## Performance Considerations

Per-feature test suites run faster (fewer tests) than the full suite. Use `phpunit tests/Features/Billing` for quick feedback during development. Parallel test execution with `brianium/paratest` supports per-feature execution.

## Security Considerations

Feature tests follow standard Laravel testing security. Authentication, authorization, and validation are tested via HTTP testing utilities. No special security concerns.

## Related Rules

- Mirror Source Structure Exactly In Tests (05-rules.md)
- Create A Base Test Case Per Feature (05-rules.md)
- Test Public API, Not Internal Implementation (05-rules.md)
- Isolate Feature Tests With Database Transactions (05-rules.md)
- Split Tests By Class Or Behavior (05-rules.md)
- Keep Integration Tests Separate From Feature Tests (05-rules.md)

## Related Skills

- Configure Per-Feature PHPUnit Suites For CI
- Create A New Feature Scaffold
- Add A Feature-Specific Model

## Success Criteria

- Feature test directory mirrors source structure
- Base test case provides shared setup for all feature tests
- Tests pass when run in isolation
- Tests focus on behavior, not implementation details
- New source files have corresponding test files

---

# Skill: Configure Per-Feature PHPUnit Suites For CI

## Purpose

Define separate PHPUnit test suite entries for each feature, enabling parallel CI execution and targeted test runs based on changed code.

## When To Use

- CI runs full test suite takes >2 minutes
- Project has 5+ features with test directories
- Multiple developers working on different features simultaneously
- CI path filtering is needed to run only affected tests

## When NOT To Use

- Projects with <20 total tests
- Single-team projects where full suite runs in <2 minutes
- Projects without per-feature test directories

## Prerequisites

- Per-feature test directories exist at `tests/Features/{Feature}/`
- Base test case is set up for each feature
- `phpunit.xml` is configured in the project root

## Inputs

- List of features with test directories
- CI platform (GitHub Actions, GitLab CI, etc.)

## Workflow

1. Open the project's `phpunit.xml`
2. Add a `<testsuite>` entry for each feature: `<testsuite name="Billing"><directory>tests/Features/Billing</directory></testsuite>`
3. Verify per-feature execution: `phpunit --testsuite=Billing`
4. Configure CI to use path-based triggers for each feature
5. Add a scheduled full-suite run on main branch merges or nightly

## Validation Checklist

- [ ] Each feature has a `<testsuite>` entry in `phpunit.xml`
- [ ] `phpunit --testsuite={Feature}` runs only that feature's tests
- [ ] CI path triggers detect changes to `app/Features/{Feature}/**` and `tests/Features/{Feature}/**`
- [ ] CI runs only affected feature test suites on PR
- [ ] Full suite runs on merges to main or nightly schedule
- [ ] Parallel suite execution is configured if using multiple CI runners

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|-------------|
| Missing suite entry | Feature added but phpunit.xml not updated | Add suite when creating feature |
| Wrong path in suite | Typo in directory path in phpunit.xml | Verify with `--testsuite` flag |
| CI path trigger mismatch | Pattern doesn't match feature path | Test trigger with empty PR |
| Tests pass together but fail alone | Shared DB state between features | Use `RefreshDatabase` in every test |

## Decision Points

- **Path trigger vs change detection**: GitHub Actions path triggers are simpler. For complex monorepos, consider tools like nx or turborepo for dependency-aware test selection.
- **Parallel suites**: Use multiple CI jobs for parallel execution. Each job runs one `--testsuite={Feature}`. Configure job matrix for easy maintenance.

## Performance Considerations

Per-feature CI keeps feedback under 2 minutes even for large projects. Parallel execution across multiple CI runners reduces wall-clock time proportionally to runner count.

## Security Considerations

Path-based CI triggers should not be relied upon for security — malicious actors could craft paths that bypass triggers. Always run a full suite on main branch merges.

## Related Rules

- Use Per-Feature PHPUnit Suites For CI (05-rules.md)
- Use CI Path Filtering For Targeted Test Execution (05-rules.md)
- Measure Coverage Per Feature (05-rules.md)
- Keep Integration Tests Separate From Feature Tests (05-rules.md)

## Related Skills

- Create Feature Test Structure
- Run Affected Tests Only In CI (large-project-structure)

## Success Criteria

- `phpunit --testsuite={Feature}` runs only that feature's tests
- CI runs only affected test suites on PR changes
- Full suite runs on main branch merges
- CI feedback time is under 2 minutes for single-feature changes
