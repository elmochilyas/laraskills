# Architecture Tests for APIs

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Architecture Tests for APIs
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Architecture tests (or "arch tests") enforce structural rules about your API codebase — ensuring controllers reside in the correct namespace, form requests extend the base class, tests follow naming conventions, routes are properly grouped, and every resource has the required test coverage. PestPHP's `arch()` testing or PHPUnit with custom assertions scans the codebase's directory structure and class hierarchy. Architecture tests act as automated code review, catching violations of team conventions before PR review.

---

## Core Concepts
PestPHP's `arch()` testing provides `expect()->toExtend()`, `->toUse()`, `->toOnlyUse()`, `->toBeFinal()`, `->toBeReadonly()`, and `->toHaveMethod()`. Custom arch rules can be defined via closures or custom Expectations. Common API architecture rules: controllers must extend `App\Http\Controllers\Controller`, form requests must extend `App\Http\Requests\FormRequest`, API routes must be in `routes/api.php`, all API controllers must be in `App\Http\Controllers\Api`, each controller must have a corresponding test file, and every `Store*Request` must have a `rules()` method. Laravel's built-in `php artisan make:controller --api` conventions can be enforced through arch tests.

---

## Mental Models
Architecture tests are **building code inspectors** — they check that the codebase follows the floor plan (directory structure, naming conventions, inheritance rules) without checking the logic inside. Like a linting rule but for project structure rather than formatting.

---

## Internal Mechanics
PestPHP's `arch()` testing uses PHP's Reflection API and file system traversal. `toExtend()` checks `class_parents()`, `toUse()` checks `class_uses()`, `toOnlyUse()` verifies no unexpected traits are used, `toBeFinal()` checks the `final` keyword via `ReflectionClass::isFinal()`. Custom expectations can traverse directories recursively (e.g., "all files in `app/Http/Controllers/Api` must extend `ApiController`"). The tests run in the same PHPUnit process and are fast — mostly filesystem stat calls and reflection lookups with no framework boot.

---

## Patterns
- **Namespace-convention enforcement**: `arch('Controllers')->expect('App\Http\Controllers\Api')->toExtend('App\Http\Controllers\Controller')`.
- **Test-coverage enforcement**: `arch('Tests')->expect('Tests\Feature\Api')->toHaveMethod('test_*')` or assert file existence for each route.
- **Route file isolation**: Ensure `routes/api.php` doesn't contain web routes (no `view()` calls, no `auth:web` middleware).
- **Dependency rules**: `arch('Form Requests')->expect('App\Http\Requests\Api')->toOnlyUse(['Illuminate\Validation\Rule', 'App\Rules'])` — forbid service layer usage in form requests.
- **Naming conventions**: `arch('Controllers')->expect()->toHaveMethodNaming('^(index|show|store|update|destroy)$')` for RESTful controllers.
- **Extend-only-one-class rule**: API controllers must extend exactly one base controller, not multiple.

---

## Architectural Decisions
Architecture tests codify decisions made during the project's initial setup — directory structure, naming conventions, class hierarchies. They trade initial setup cost (writing the arch rules) for long-term consistency enforcement (no manual code review needed for structural violations). The rules are checked in CI; a violation is a hard failure. The granularity of arch rules (namespace-level vs file-level vs class-level) depends on team size and convention strictness.

---

## Tradeoffs
| Tradeoff | Strict Arch Rules | Loose (No Arch Rules) |
|---|---|---|
| Consistency | High (machine-enforced) | Low (manual review) |
| Developer friction | Higher (violations block PRs) | Lower (no structural constraints) |
| Onboarding clarity | High (rules document conventions) | Low (tribal knowledge) |
| Refactoring cost | Higher (rules must be updated) | Lower (no rules to break) |

---

## Performance Considerations
Architecture tests are the fastest tests in the suite — they don't boot the framework, don't hit the database, and don't make HTTP requests. They typically complete in <100ms for the entire rule set. Run them first in CI as a pre-filter: if arch tests fail, feature tests will also be structurally invalid.

---

## Production Considerations
Architecture tests enforce the API's structural integrity. Use them to ensure: only allowed service providers are registered, no `dd()` or `dump()` calls exist in production code (using `->toNotUse()`), all public methods have return types, and no raw `DB::` calls exist outside repositories. These rules prevent common production incidents (debug statements in responses, missing return types causing 500s).

---

## Common Mistakes
- Making arch rules too specific — changes to project structure require regex updates.
- Enforcing rules without considering exceptions (e.g., a helper class that must extend a different base).
- Not running arch tests in CI — they languish in the test suite unenforced.
- Overlapping arch rules (same class checked by multiple rules with different outcomes).

---

## Failure Modes
- **False positives**: A rule says "all API controllers must extend BaseController" — a new third-party controller that gets auto-discovered fails.
- **False negatives**: Arch test only checks existence, not correctness — a controller extends a different class but the test's regex misses it.
- **Rule drift**: Arch tests are written for the initial structure but never updated as the project evolves — rules become dead code.

---

## Ecosystem Usage
PestPHP v2+ ships with built-in `arch()` testing. Kahlan (PHP unit test framework) has similar architecture testing. PHPStan and Psalm provide static analysis-based architecture rules. Laravel's first-party testing documentation recommends arch testing for API project structure. Jetstream and Breeze use arch tests internally.

---

## Related Knowledge Units
### Prerequisites
- PestPHP `arch()` testing fundamentals
- feature-test-structure (conventions enforced by arch rules)
- PHP Namespaces and Autoloading

### Related Topics
- layer-isolation-in-tests (arch rules enforce layer boundaries)
- feature-test-structure (test file organization conventions)
- contract-testing-with-openapi (spec-file conformance)

### Advanced Follow-up Topics
- Custom PestPHP Expectations for project-specific rules
- Architecture testing for hexagonal architecture (ports and adapters)
- PHPStan vs PestPHP arch testing for different rule types

---

## Research Notes
### Source Analysis
PestPHP `arch()` expectations in `Pest\Arch\Expectations`. Uses reflection (`ReflectionClass`, `ReflectionMethod`) and `glob()` for directory traversal. Laravel's `Illuminate\Foundation\Testing\Concerns` provides test helpers but no built-in architecture assertions.
### Key Insight
Architecture tests are the most cost-effective tests per line written — a single arch rule (`expect('App\Http\Controllers')->toExtend(...)`) enforces a convention across hundreds of classes.
### Version-Specific Notes
PestPHP v2.34+ includes `arch()` as a first-class feature. Laravel 11 projects created with PestPHP include `tests/ArchTest.php` by default with basic architecture rules.
