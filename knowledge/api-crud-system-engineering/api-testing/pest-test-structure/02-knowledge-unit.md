# Pest Test Structure

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Pest Test Structure
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Pest Test Structure defines how API test files are organized, named, and grouped within a Laravel project. Proper test structure ensures maintainability, clear failure reporting, and alignment with Pest's expressive testing paradigm.

---

## Core Concepts
- **File Naming Conventions**: `*Test.php` files in `tests/Feature/Api/` organized by resource or domain
- **Describe Blocks**: `describe('POST /api/users')` groups related tests into readable sections
- **Test Functions**: `it('creates a new user')` or `test('the index returns paginated results')` for individual test cases
- **Higher-Order Tests**: Pest's `->assertOk()->assertJsonStructure(...)` chaining for concise endpoint tests
- **Dataset Providers**: `with()` and `dataset()` for testing the same assertion against multiple inputs
- **Architecture Tests**: `arch('Api')->expect('App\Http\Controllers\Api')->toUseStrictTypes()` for structural enforcement

---

## Mental Models
1. **Documentation-as-Tests Model**: Every test function name should read like a specification sentence. `it('returns 404 when the user does not exist')` replaces paragraphs of documentation.
2. **Group-by-Endpoint Model**: Organize test files by API endpoint or resource, mirroring the route structure for easy navigation.

---

## Internal Mechanics
Pest loads all `*Test.php` files from configured directories. Each `it()` or `test()` call registers a PHPUnit test case. `describe()` blocks create nested test class namespaces for organized output. Higher-order tests use `$this->` method forwarding to chain assertions on `TestResponse`.

---

## Patterns

### Pattern 1: Resource-Centric File Organization
**Purpose**: One test file per API resource (`UsersTest.php`, `PostsTest.php`)
**Benefits**: Easy to find tests for a specific endpoint; maps 1:1 to controllers
**Tradeoffs**: Large files for resources with many endpoints

### Pattern 2: Action-Centric Describe Blocks
**Purpose**: Group tests by HTTP action (describe('index'), describe('store'), describe('show'))
**Benefits**: Clear separation of different behaviors; easier to run subsets
**Tradeoffs**: More nesting than flat test functions

---

## Architectural Decisions
### When To Use
- All Laravel API projects using Pest (Pest 4 is the default for Laravel 13)
- Teams that value test readability and expressive failure messages

### When To Avoid
- Projects still using base PHPUnit without Pest (migration recommended)
- Tests that follow strict BDD conventions incompatible with descriptive blocks

### Alternatives
- Traditional PHPUnit class-based structure
- Per-action test files for resources with very complex logic

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Highly readable test output | Learning curve for new Pest users | Invest in team training |
| Concise higher-order tests | Less familiar to PHPUnit veterans | Migrate gradually |
| Built-in arch testing | Arch tests can slow test suite | Run arch tests separately in CI |

---

## Performance Considerations
- Each `describe()` block adds a test class wrapper — deep nesting has negligible overhead
- `dataset()` providers are evaluated once per test run, not once per test
- Architecture tests scan the filesystem; cache results for large codebases

---

## Production Considerations
- Run `pest --parallel` for faster CI execution
- Exclude `arch` tests from the default run; run them as a separate CI step
- Use `tests/Pest.php` for global setup (database migrations, auth helpers)

---

## Common Mistakes
**Flat test organization**: All tests in a single file or directory. Group by resource and action for maintainability.
**Overusing higher-order tests**: Complex test logic in a chain is harder to debug than explicit assertions. Use higher-order tests for simple assertion chains only.
**Mixing unit and feature tests**: Keep `tests/Unit/` and `tests/Feature/` strictly separated. API tests belong in Feature.

---

## Failure Modes
**Test ordering dependencies**: Tests that rely on previous test state fail when run in isolation. Use `RefreshDatabase` or `DatabaseTransactions` to ensure clean state.
**Slow arch tests**: File-system scanning tests that examine many files take seconds. Target arch tests narrowly.

---

## Ecosystem Usage
Laravel 13 ships with Pest 4 as the default test framework. `tests/Pest.php` is the entry point for test configuration. The `tests/Feature/Api/` convention is community-standard.

---

## Related Knowledge Units
### Prerequisites
- Basic PHP and Laravel project structure
- Composer dependency management

### Related Topics
- HTTP endpoint assertions
- Pest custom helpers
- Architecture tests

### Advanced Follow-up Topics
- Custom Pest expectations and matchers
- Parallel test execution strategies
- Test visualization and reporting

---

## Research Notes
- Pest's `describe()` blocks are compiled into PHPUnit test classes — inspect `tests/.pest` to see the generated structure
- Higher-order tests use `__call` magic to forward method calls; IDE stubs are available for autocompletion
