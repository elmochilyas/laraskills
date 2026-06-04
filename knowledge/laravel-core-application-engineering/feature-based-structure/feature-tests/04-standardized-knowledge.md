# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Module Extractability |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Feature tests in a feature-based structure are organized by feature — each feature has its own test directory mirroring the source structure. Tests are co-located with the code they test, making it clear what each test suite validates. The engineering value is test discoverability and ownership: developers working on the Billing feature know exactly where to find (and add) tests. CI can run per-feature test suites, and test coverage can be measured per feature.

---

## Core Concepts

- **Mirror structure**: `tests/Features/Billing/` mirrors `app/Features/Billing/`
- **Feature test case**: Base test class per feature for shared setup (migrations, factories, helpers)
- **Per-feature PHPUnit suites**: XML configuration for running tests of a single feature
- **CI path filtering**: GitHub Actions runs only tests for changed features
- **Test database isolation**: `RefreshDatabase` or `DatabaseTransactions` per feature test

---

## When To Use

- Feature-based structure where tests should mirror source organization
- CI pipelines that run tests selectively based on changed code
- Teams with clear feature ownership and responsibility boundaries
- Projects with 50+ test files that benefit from directory-based organization

## When NOT To Use

- Small projects with <20 test files where flat structure is simpler
- Teams that prefer `@group` annotations over directory-based filtering
- Projects where feature isolation makes cross-feature integration testing difficult

---

## Best Practices

- **Mirror the source structure exactly** in tests — one-to-one mapping between source and test directories
- **Create a base test case per feature** for shared setup (migrations, factory states, helper methods)
- **Test the feature's public API** (controllers, services), not internal implementation details
- **Use phpunit XML suites** to run per-feature in CI with parallel jobs
- **Keep feature tests focused** on the feature's behavior; test cross-feature interactions in a separate integration suite
- **Measure coverage per feature** to identify untested areas

---

## Architecture Guidelines

- Test directory: `tests/Features/{Feature}/` mirroring source
- Subdirectories mirror source layers: `Controllers/`, `Services/`, `Exceptions/`
- Autoloading: `"Tests\\": "tests/"` in `composer.json` autoload-dev
- Feature test base class extends `Tests\TestCase` with feature-specific `setUp()`
- Per-feature phpunit config file for isolated test runs
- Database isolation via `RefreshDatabase` with feature-specific migrations

---

## Performance

PHPUnit performance is driven by test count and database setup, not directory structure. Per-feature test suites run faster in development (fewer tests) than the full suite. Use `phpunit tests/Features/Billing` for quick feedback during feature development.

---

## Security

Feature tests follow the same security considerations as any Laravel test. Authentication, authorization, and validation are tested via the same HTTP testing utilities. No special security concerns.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Testing implementation details | Testing internal service methods | Brittle tests that break on refactoring | Test behavior/output, not internals |
| Duplicate setup across features | Each feature re-creates same setup | Wasted effort, inconsistency | Extract shared setup into base test case |
| One giant test file | All scenarios in single file | Hard to navigate, maintain | Split by class or behavior |
| Tests pass in isolation but fail together | Shared database state | CI failures | Use `RefreshDatabase` per test |
| Stale test mirror | Feature renamed but test directory not | Disconnected source and tests | Rename test directory when feature is renamed |

---

## Anti-Patterns

- **2000-line `BillingTest.php`**: All billing scenarios in one file
- **Testing private methods**: Tests that break on internal refactoring
- **No feature base class**: Every test file repeats the same setup
- **Stale test directory**: Feature renamed from Billing to Invoicing but tests still in `tests/Features/Billing/`

---

## Examples

**Feature test directory structure:**
```
tests/Features/Billing/
  Feature/
    InvoiceTest.php
    SubscriptionTest.php
  Unit/
    InvoiceServiceTest.php
  fixtures/
    sample_invoice_data.php
```

**Feature test case base class:**
```php
namespace Tests\Features\Billing;

abstract class BillingTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh --path=app/Features/Billing/Database/Migrations');
        $this->seed(BillingTestSeeder::class);
    }

    protected function createPaidUser(): User
    {
        return User::factory()->hasSubscription()->create();
    }
}
```

**Per-feature PHPUnit config:**
```xml
<!-- phpunit.billing.xml -->
<phpunit>
    <testsuites>
        <testsuite name="Billing">
            <directory>tests/Features/Billing</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

**CI path filtering:**
```yaml
name: Financial Tests
on:
  pull_request:
    paths:
      - 'app/Features/Financial/**'
      - 'tests/Features/Financial/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit tests/Features/Financial
```

---

## Related Topics

- modular-monolith-basics — The overall structure tests mirror
- bounded-contexts — How test directories mirror source directories
- technical-vs-domain-grouping — Implications for test organization
- inter-module-communication — Testing cross-feature interactions
- vertical-slice-architecture — Testing at the domain group level

---

## AI Agent Notes

- PHPUnit discovers tests recursively in `tests/Features/` directory
- `@group` annotations provide cross-cutting test filtering independent of directory structure
- Feature-based test structure is supported by all CI platforms
- Coverage reports can be generated per-feature with `--testsuite=Billing`
- The mirror pattern is also used in Go, Rust, and Python testing conventions
- Parallel testing with `brianium/paratest` supports per-feature test execution

---

## Verification

- [ ] Test directory mirrors source structure exactly
- [ ] Base test case per feature for shared setup
- [ ] Per-feature phpunit XML configuration
- [ ] CI runs per-feature tests on path changes
- [ ] `RefreshDatabase` used for test isolation
- [ ] Feature tests focus on public API, not internals
- [ ] Test files split by class or behavior (not one giant file)
- [ ] Test directory renamed when feature is renamed
