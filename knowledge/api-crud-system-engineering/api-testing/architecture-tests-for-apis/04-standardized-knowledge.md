# ECC Standardized Knowledge — Architecture Tests for APIs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Architecture Tests for APIs |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Architecture tests (or "arch tests") enforce structural rules about your API codebase — ensuring controllers reside in the correct namespace, form requests extend the base class, tests follow naming conventions, routes are properly grouped, and every resource has the required test coverage. PestPHP's `arch()` testing or PHPUnit with custom assertions scans the codebase's directory structure and class hierarchy. Architecture tests act as automated code review, catching violations of team conventions before PR review.

## Core Concepts

- **`arch()` testing (PestPHP)**: `expect()->toExtend()`, `->toUse()`, `->toOnlyUse()`, `->toBeFinal()`, `->toBeReadonly()`, `->toHaveMethod()`
- **Namespace enforcement**: All API controllers must be in `App\Http\Controllers\Api`
- **Inheritance rules**: Controllers must extend `App\Http\Controllers\Controller`, form requests must extend `App\Http\Requests\FormRequest`
- **Route file isolation**: `routes/api.php` must not contain web routes
- **Test coverage enforcement**: Each controller must have a corresponding test file
- **Dependency rules**: Forbid service layer usage in form requests (via `->toOnlyUse()`)

## When To Use

- Every Laravel API project with defined conventions
- CI pipeline pre-filter — run arch tests first as they're fastest
- Teams enforcing layered architecture (controllers → services → repositories)
- Onboarding new developers to project conventions

## When NOT To Use

- Prototypes or minimal APIs with few structural rules
- Replacing static analysis (PHPStan, Psalm) — these are complementary, not alternatives
- Testing business logic or behavior — arch tests check structure only

## Best Practices

- **Namespace-convention enforcement**: `arch('Controllers')->expect('App\Http\Controllers\Api')->toExtend('App\Http\Controllers\Controller')`.
- **Test-coverage enforcement**: Assert file existence for each route or `expect('Tests\Feature\Api')->toHaveMethod('test_*')`.
- **Route file isolation**: Ensure `routes/api.php` doesn't use web middleware or `view()` calls.
- **Dependency rules**: `arch('Form Requests')->expect('App\Http\Requests\Api')->toOnlyUse(['Illuminate\Validation\Rule', 'App\Rules'])`.
- **Naming conventions**: Ensure RESTful controllers only have standard methods (index, show, store, update, destroy).

## Architecture Guidelines

- Architecture tests codify decisions made during project setup — directory structure, naming, class hierarchies.
- Rules are checked in CI; a violation is a hard failure.
- The granularity of arch rules (namespace-level vs file-level vs class-level) depends on team size and convention strictness.
- Keep arch rules broad enough to survive refactoring but specific enough to catch violations.

## Performance Considerations

- Architecture tests are the fastest tests — they don't boot the framework or hit the database.
- Typically complete in <100ms for the entire rule set.
- Run them first in CI as a pre-filter: if arch tests fail, feature tests will structurally fail too.

## Security Considerations

- Use arch tests to enforce: no `dd()` or `dump()` calls in production code (using `->toNotUse()`).
- Enforce that all public methods have return types (prevents accidental type leaks).
- Ensure no raw `DB::` calls exist outside repository/service classes.
- Prevent controllers from directly accessing request input without going through form requests.

## Common Mistakes

- Making arch rules too specific — changes to project structure require regex or rule updates.
- Enforcing rules without considering exceptions (e.g., helper classes that must extend different bases).
- Not running arch tests in CI — they languish in the test suite unenforced.
- Overlapping arch rules (same class checked by multiple rules with different outcomes).

## Anti-Patterns

- **Arch tests as documentation**: Writing arch tests that duplicate what's obvious from the directory structure — tests should enforce non-obvious conventions.
- **Too many rules**: Every folder gets an arch rule — creates maintenance burden without proportional value.
- **No exception mechanism**: Not providing a way to skip arch rules for legitimate cases (third-party packages, generated code).

## Examples

```php
// PestPHP arch tests
arch('Controllers')
    ->expect('App\Http\Controllers\Api')
    ->toExtend('App\Http\Controllers\Controller');

arch('Form Requests')
    ->expect('App\Http\Requests\Api')
    ->toExtend('App\Http\Requests\FormRequest')
    ->toOnlyUse(['Illuminate\Validation\Rule', 'App\Rules']);

arch('Routes')
    ->expect('routes/api.php')
    ->not->toUse('view')
    ->not->toUse('auth:web');

// Test coverage enforcement
arch('Test Coverage')
    ->expect('App\Http\Controllers\Api')
    ->toHaveTestFile();
```

## Related Topics

- **Prerequisites**: PestPHP `arch()` testing fundamentals, feature-test-structure, PHP Namespaces and Autoloading
- **Siblings**: layer-isolation-in-tests, contract-testing-with-openapi
- **Advanced**: Custom PestPHP Expectations for project-specific rules, Architecture testing for hexagonal architecture, PHPStan vs PestPHP arch testing

## AI Agent Notes

- Architecture tests are the most cost-effective tests per line written — a single arch rule enforces conventions across hundreds of classes.
- Laravel 11 projects created with PestPHP include `tests/ArchTest.php` by default with basic architecture rules.
- Combine arch tests with PHPStan for comprehensive enforcement: arch tests for structure, PHPStan for type safety.

## Verification

- [ ] All API controllers extend the correct base controller
- [ ] All form requests extend the correct base form request
- [ ] API routes are isolated in `routes/api.php` with no web routes
- [ ] No `dd()` / `dump()` calls exist in production code
- [ ] Each API controller has a corresponding test file
- [ ] Arch tests run in CI as a pre-filter before feature tests
