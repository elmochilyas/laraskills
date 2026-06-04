## Mirror Source Structure Exactly In Tests

The test directory for each feature must be an exact structural mirror of the source feature directory.

---

## Category

Code Organization

---

## Rule

Create `tests/Features/{Feature}/` with subdirectories that mirror `app/Features/{Feature}/`. Every controller gets a corresponding `Controllers/` test, every service a `Services/` test, every request a `Requests/` test. One-to-one mapping between source and test files.

---

## Reason

Mirroring makes test ownership unambiguous. A developer working on `app/Features/Billing/Services/InvoiceService.php` immediately knows tests are in `tests/Features/Billing/Services/InvoiceServiceTest.php`. This eliminates the question "where does this test go?"

---

## Bad Example

```php
// Source
app/Features/Billing/
  Controllers/InvoiceController.php
  Services/InvoiceService.php

// Tests — flat, no mirror
tests/BillingTest.php
tests/InvoiceServiceTest.php
```

---

## Good Example

```php
// Source
app/Features/Billing/
  Controllers/InvoiceController.php
  Services/InvoiceService.php

// Tests — mirrored exactly
tests/Features/Billing/
  Controllers/InvoiceControllerTest.php
  Services/InvoiceServiceTest.php
```

---

## Exceptions

Integration tests that span multiple source files may live in a top-level `tests/Features/{Feature}/Feature/` directory separate from mirrored unit tests.

---

## Consequences Of Violation

Test file location ambiguity. Source files are renamed but test directories are not updated. Disconnected source and test structure.

---

## Create A Base Test Case Per Feature

Each feature must have an abstract base test case class for shared setup logic.

---

## Category

Testing

---

## Rule

Define an abstract `Tests\Features\{Feature}\{Feature}TestCase` class that extends `Tests\TestCase`. Include feature-specific `setUp()` logic, shared factory states, and helper methods. All test classes in the feature must extend this base class.

---

## Reason

Without a feature base class, every test file repeats the same setup: running specific migrations, creating common fixtures, seeding data. This duplication violates DRY and makes setup changes require editing every test file.

---

## Bad Example

```php
// Every test file repeats the same setup
class InvoiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh --path=app/Features/Billing/Database/Migrations');
        $this->seed(BillingSeeder::class);
    }
}
```

---

## Good Example

```php
abstract class BillingTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh --path=app/Features/Billing/Database/Migrations');
    }

    protected function createPaidUser(): User
    {
        return User::factory()->has(Invoice::factory()->paid())->create();
    }
}

class InvoiceTest extends BillingTestCase
{
    // Inherits setup — no duplication
}
```

---

## Exceptions

Features with no migrations or special setup needs may use the global `Tests\TestCase` directly.

---

## Consequences Of Violation

Duplicated setup across test files. Inconsistent setup between tests. Updating feature setup requires editing every test file.

---

## Test Public API, Not Internal Implementation

Feature tests must exercise the feature's public interface: HTTP endpoints, service method signatures, and event payloads. Do not test private or protected methods.

---

## Category

Testing

---

## Rule

Write tests that call controller endpoints (HTTP tests), invoke public service methods, or assert events are dispatched. Never test private/protected methods directly. Never assert on implementation details like SQL queries, internal method calls, or private property values.

---

## Reason

Tests on implementation details break when the feature is refactored internally. Tests on the public API survive refactoring as long as the external contract is preserved. Internal tests create a false sense of stability while increasing maintenance burden.

---

## Bad Example

```php
public function test_it_calculates_tax(): void
{
    $service = new InvoiceService();
    $reflection = new ReflectionMethod($service, 'calculateTax');
    $this->assertEquals(8.00, $reflection->invoke($service, 100.00));
    // Tests private method — breaks on refactoring
}
```

---

## Good Example

```php
public function test_invoice_total_includes_tax(): void
{
    $invoice = Invoice::factory()->create(['subtotal' => 10000]);
    $this->actingAs($invoice->user)
        ->get('/billing/invoices/' . $invoice->id)
        ->assertJson(['total' => 10800]);
    // Tests behavior, not implementation
}
```

---

## Exceptions

Complex algorithmic logic (e.g., tax calculation formulas, discount rules) may justify testing private methods indirectly through a dedicated public service method.

---

## Consequences Of Violation

Brittle tests that fail on refactoring. High maintenance overhead discourages refactoring. False confidence from tests that exercise internals.

---

## Use Per-Feature PHPUnit Suites For CI

Define separate PHPUnit testsuite entries for each feature to enable parallel CI execution.

---

## Category

Scalability

---

## Rule

Add a `<testsuite>` entry in `phpunit.xml` for every feature. Use these suite names in CI to run tests for only the features that changed. Enable parallel suite execution for faster CI feedback.

---

## Reason

Running the full test suite on every commit becomes slow as the project grows (10+ minutes for 100+ features). Per-feature suites let CI run only the tests relevant to a change, providing feedback in seconds instead of minutes.

---

## Bad Example

```xml
<testsuite name="Application">
    <directory>tests/</directory>
</testsuite>
<!-- CI runs all tests for every change -->
```

---

## Good Example

```xml
<testsuite name="Billing">
    <directory>tests/Features/Billing</directory>
</testsuite>
<testsuite name="Users">
    <directory>tests/Features/Users</directory>
</testsuite>
```

```yaml
# CI — run only changed feature
- run: phpunit --testsuite=Billing
```

---

## Exceptions

Projects with <20 tests or single-team projects may use a single suite. Per-feature suites add value when CI time exceeds 2 minutes.

---

## Consequences Of Violation

Full test suite runs on every commit. Slow CI feedback (10+ minutes). Developers skip tests waiting for CI.

---

## Isolate Feature Tests With Database Transactions

Use `RefreshDatabase` or `DatabaseTransactions` trait in every feature test to prevent state leakage between tests.

---

## Category

Reliability

---

## Rule

Apply `RefreshDatabase` or `DatabaseTransactions` to every feature test class. Never rely on test ordering to maintain database state.

---

## Reason

Tests that share database state produce false positives and false negatives. Test A creates a record that Test B depends on. Test B fails when run alone. CI runs tests in random order, making these failures intermittent and hard to debug.

---

## Bad Example

```php
class InvoiceTest extends TestCase
{
    // No database isolation trait
    public function test_index()
    {
        // Depends on previous test's data
        $this->get('/billing/invoices')->assertCount(2);
    }
}
```

---

## Good Example

```php
class InvoiceTest extends BillingTestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_lists_invoices(): void
    {
        Invoice::factory()->count(2)->create();
        $this->get('/billing/invoices')->assertCount(2);
    }
}
```

---

## Exceptions

Tests that explicitly test database transaction behavior may use `DatabaseTransactions` instead of `RefreshDatabase` for speed. Do not omit both.

---

## Consequences Of Violation

Intermittent test failures. False positives from shared state. Tests that pass in CI but fail locally (and vice versa).

---

## Use CI Path Filtering For Targeted Test Execution

CI must run only the test suites for features whose source files changed.

---

## Category

Scalability

---

## Rule

Configure CI (GitHub Actions, GitLab CI, etc.) to detect which feature files changed in a pull request and run only the corresponding test suites. Use path-based triggers or change detection tools.

---

## Reason

Running 100% of tests for a change that affects one feature wastes CI resources and slows feedback. Targeted test execution keeps CI under 2 minutes even for large projects.

---

## Bad Example

```yaml
# CI runs all tests for every change
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit
```

---

## Good Example

```yaml
name: Billing Tests
on:
  pull_request:
    paths:
      - 'app/Features/Billing/**'
      - 'tests/Features/Billing/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit --testsuite=Billing
```

---

## Exceptions

A full test suite run should be scheduled nightly or on merges to the main branch to catch cross-feature interaction bugs.

---

## Consequences Of Violation

CI times grow linearly with feature count. Developers wait 10+ minutes for feedback. CI resource waste.

---

## Split Tests By Class Or Behavior

Do not create a single test file with all scenarios for a feature. Split by class or behavior group.

---

## Category

Maintainability

---

## Rule

Create one test file per source class (mirroring the source structure) or per behavior group. A feature with 10 source classes should have approximately 10 test files. Never create a single 2000-line test file.

---

## Reason

Large test files are hard to navigate, slow to run individually, and prone to merge conflicts. Small, focused test files allow developers to run a single test file during development for quick feedback.

---

## Bad Example

```php
// 2000-line BillingTest.php
class BillingTest extends TestCase
{
    public function test_invoice_index() {}
    public function test_invoice_store() {}
    public function test_invoice_show() {}
    public function test_invoice_update() {}
    public function test_invoice_delete() {}
    public function test_subscription_create() {}
    // ... 60 more tests
}
```

---

## Good Example

```php
// tests/Features/Billing/Controllers/InvoiceControllerTest.php
class InvoiceControllerTest extends BillingTestCase
{
    public function test_it_lists_invoices() {}
    public function test_it_creates_invoice() {}
    // ~10 tests per file
}

// tests/Features/Billing/Services/InvoiceServiceTest.php
class InvoiceServiceTest extends BillingTestCase
{
    public function test_it_calculates_total() {}
    // ~5 tests per file
}
```

---

## Exceptions

A feature with a single class (e.g., an action class) may have a single test file. The rule scales with source complexity.

---

## Consequences Of Violation

Merge conflicts on the shared test file. Slow test runs (cannot target a single class). Poor test discoverability.

---

## Measure Coverage Per Feature

Track test coverage at the feature level to identify untested areas.

---

## Category

Testing

---

## Rule

Generate code coverage reports per feature using PHPUnit's `--testsuite` flag with path coverage. Track coverage by feature in CI. Flag features below the team's coverage threshold.

---

## Reason

Global coverage metrics hide untested features. A 90% coverage score might include a Billing feature at 50% and a Users feature at 130%. Per-feature coverage reveals where testing effort is needed.

---

## Bad Example

```bash
phpunit --coverage-html=coverage
# Shows 85% globally but hides which feature is under-tested
```

---

## Good Example

```bash
phpunit --testsuite=Billing --coverage-html=coverage/billing
phpunit --testsuite=Users --coverage-html=coverage/users
# Per-feature coverage: Billing 95%, Users 72%
```

---

## Exceptions

Small projects (<5 features) may use global coverage. The complexity of per-feature coverage setup is justified only when individual features need attention.

---

## Consequences Of Violation

Untested features hidden behind aggregate coverage numbers. Team unaware of low-coverage areas. Quality gaps in specific features.

---

## Keep Integration Tests Separate From Feature Tests

Cross-feature interactions must be tested in a dedicated integration test suite, not in individual feature tests.

---

## Category

Testing

---

## Rule

Create a `tests/Integration/` directory for tests that span multiple features. Feature tests must only test behavior within the feature's boundary. Integration tests cover contracts between features.

---

## Reason

Feature tests should be runnable in isolation (per-feature CI). Cross-feature integration tests require multiple features to be set up, making them slow and unsuitable for per-feature CI. Separating them keeps feature tests fast and focused.

---

## Bad Example

```php
// BillingTest.php tests Billing + Reporting interaction
class BillingTest extends TestCase
{
    public function test_billing_report_integration(): void
    {
        // Requires Billing + Reporting migrations
        // Cannot run as part of Billing-only suite
    }
}
```

---

## Good Example

```php
// tests/Features/Billing/Controllers/InvoiceControllerTest.php
class InvoiceControllerTest extends BillingTestCase
{
    // Only Billing feature setup
}

// tests/Integration/BillingAndReportingTest.php
class BillingAndReportingTest extends TestCase
{
    // Both features set up
}
```

---

## Exceptions

Simple cross-feature interactions through an event with one listener may be tested in the consuming feature's tests, as long as the listener is simple.

---

## Consequences Of Violation

Feature tests have hidden dependencies on other features. Per-feature CI suites fail because of cross-feature setup requirements. Test isolation is compromised.
