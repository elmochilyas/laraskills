# Skill: Write Architecture Tests For APIs

## Purpose
Write PestPHP architecture tests enforcing structural rules — namespace conventions, inheritance chains, route file isolation, test coverage per controller, forbidden debug calls, and layer dependency rules — running as the first CI stage.

## When To Use
- Every Laravel API project with defined conventions
- CI pipeline pre-filter — run arch tests first as they're fastest
- Teams enforcing layered architecture (controllers → services → repositories)
- Onboarding new developers to project conventions

## When NOT To Use
- Prototypes or minimal APIs with few structural rules
- Replacing static analysis (PHPStan, Psalm)
- Testing business logic or behavior

## Prerequisites
- PestPHP `arch()` testing fundamentals
- Feature test structure
- PHP Namespaces and Autoloading

## Inputs
- Project namespace and directory structure
- Base class hierarchy (controllers, form requests, services)
- Route file configuration
- Layer dependency boundaries

## Workflow
1. Enforce namespace conventions: all API controllers must extend the correct base controller; all form requests must extend the correct base request
2. Enforce test coverage per controller: assert every API controller has a corresponding feature test file
3. Isolate API routes from web routes: assert `routes/api.php` does not reference `web` middleware, `view()`, or session-related code
4. Forbid debug calls in production code: `->not->toUse(['dd', 'dump', 'ray', 'var_dump', 'print_r'])`
5. Enforce dependency rules between layers with `->toOnlyUse()`: form requests must only import validation rules; services must not import HTTP concerns
6. Run arch tests as the first CI stage — they complete in <100ms and catch structural violations before feature tests run
7. Use PestPHP's `->ignoring()` for legitimate exceptions (abstract base classes, helper services)

## Validation Checklist
- [ ] All API controllers extend the correct base controller
- [ ] All form requests extend the correct base form request
- [ ] API routes isolated in `routes/api.php` with no web routes
- [ ] No `dd()` / `dump()` calls in production code
- [ ] Each API controller has a corresponding test file
- [ ] Form requests only use allowed dependencies (validation rules, not Eloquent)
- [ ] Services do not use HTTP concerns
- [ ] Arch tests run in CI as a pre-filter before feature tests

## Common Failures
- Making arch rules too specific — changes to project structure require regex or rule updates
- No exception mechanism — arch rules break on legitimate exceptions
- Not running arch tests in CI — they languish unenforced
- Overlapping arch rules (same class checked by multiple rules)

## Decision Points
- Rule granularity: namespace-level vs file-level vs class-level
- Arch test suite: single file vs per-concern files
- CI stage: blocking pre-filter vs non-blocking advisory

## Performance Considerations
- Architecture tests are the fastest tests — no framework boot, no database
- Typically complete in <100ms for entire rule set
- Run first in CI as pre-filter: if arch tests fail, feature tests will structurally fail too

## Security Considerations
- Use arch tests to enforce no `dd()` or `dump()` calls in production code
- Ensure all public methods have return types (prevents accidental type leaks)
- Ensure no raw `DB::` calls outside repository/service classes
- Prevent controllers from directly accessing request input without form requests

## Related Rules
- Enforce Namespace Conventions
- Enforce Test Coverage Per Controller
- Isolate API Routes From Web Routes
- Forbid DD And Dump Calls In Production Code
- Enforce Dependency Rules Between Layers
- Run Arch Tests First In CI

## Related Skills
- Test Layer Isolation
- Write Contract Tests With OpenAPI
- Test Form Request Unit

## Success Criteria
- All structural conventions are enforced by arch tests
- Arch tests run in CI as the first stage
- No false-positive arch test failures (exceptions handled with `->ignoring()`)
- Each controller has a corresponding test file verified by arch test
- Debug calls are forbidden in production code
- Layer dependency rules prevent architectural erosion
