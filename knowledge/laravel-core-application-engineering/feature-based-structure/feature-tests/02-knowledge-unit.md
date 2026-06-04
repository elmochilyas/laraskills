# Feature Tests

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Tests
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Feature tests in a feature-based structure are organized by feature — each feature has its own test directory mirroring the source structure. This creates a one-to-one mapping between `app/Features/Billing/` and `tests/Features/Billing/`. Tests are co-located with the code they test, making it clear what each test suite validates.

The engineering value is test discoverability and ownership: developers working on the `Billing` feature know exactly where to find (and add) tests. CI can run per-feature test suites, and test coverage can be measured per feature.

---

## Core Concepts

### Test Directory Structure

```
tests/
  Features/
    Billing/
      Feature/
        InvoiceTest.php
        SubscriptionTest.php
      Unit/
        InvoiceServiceTest.php
        PaymentGatewayTest.php
    Users/
      Feature/
        UserRegistrationTest.php
      Unit/
        UserServiceTest.php
  Feature/        # Cross-cutting feature tests
    AuthenticationTest.php
  Unit/           # Cross-cutting unit tests
    HelpersTest.php
```

### Mirroring Source Structure

```
app/
  Features/
    Billing/
      Controllers/
        InvoiceController.php
      Services/
        InvoiceService.php
      Exceptions/
        BillingException.php

tests/
  Features/
    Billing/
      Controllers/
        InvoiceControllerTest.php
      Services/
        InvoiceServiceTest.php
      Exceptions/
        BillingExceptionTest.php
```

### Autoloading Test Files

```json
// composer.json
{
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

---

## Mental Models

### The Mirror

Tests mirror the application source one-to-one. A bug in `app/Features/Billing/Services/InvoiceService.php` is fixed by looking at `tests/Features/Billing/Services/InvoiceServiceTest.php`. The test directory structure is a perfect mirror.

### The Feature Test Suite

Each feature's tests constitute a suite that can be run independently. When modifying the `Billing` feature, run only `tests/Features/Billing/` to get fast feedback. The full suite runs in CI.

---

## Internal Mechanics

### Test Discovery

PHPUnit discovers tests by recursively scanning directories for files matching `*Test.php`. The `tests/Features/Billing/` directory is automatically discovered because `tests/` is registered in `phpunit.xml` as a test directory.

### Autoloading Test Files

Test files in `tests/Features/` are autoloaded via PSR-4 in `composer.json`:

```json
{
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

This maps `Tests\Features\Billing\InvoiceTest` to `tests/Features/Billing/InvoiceTest.php` automatically.

### Database Isolation

Each feature test typically uses `RefreshDatabase` or `DatabaseTransactions` to isolate database state. When using per-feature migrations loaded from the feature's service provider, test databases must include those migrations:

```php
abstract class BillingTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate:fresh', [
            '--path' => 'app/Features/Billing/Database/Migrations',
        ]);
    }
}
```

---

## Patterns

### Feature Test Case Base Class

```php
namespace Tests\Features\Billing;

use Tests\TestCase;

abstract class BillingTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Feature-specific setup
        $this->artisan('migrate:fresh --path=app/Features/Billing/Database/Migrations');
        $this->seed(BillingTestSeeder::class);
    }

    protected function createPaidUser(): User
    {
        return User::factory()->hasSubscription()->create();
    }
}
```

### Per-Feature PHPUnit Config

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

```bash
phpunit --configuration phpunit.billing.xml
```

### Feature Test for Inertia Pages

```php
namespace Tests\Features\Billing\Feature;

use Tests\Features\Billing\BillingTestCase;

class InvoiceTest extends BillingTestCase
{
    public function test_can_view_invoices()
    {
        $user = $this->createPaidUser();

        $this->actingAs($user)
             ->get('/billing/invoices')
             ->assertInertia(fn ($page) => $page
                 ->component('Billing/Invoices')
                 ->has('invoices')
             );
    }
}
```

### Shared Fixtures Within a Feature

```
tests/Features/Billing/
  fixtures/
    invoice_template.blade.php
    sample_invoice_data.php
  Feature/
    InvoiceTest.php
    SubscriptionTest.php
```

```php
class InvoiceTest extends BillingTestCase
{
    protected function sampleInvoiceData(): array
    {
        return require __DIR__.'/../fixtures/sample_invoice_data.php';
    }
}
```

---

## Architectural Decisions

### Co-located vs Centralized Tests

| Approach | Structure | Pros | Cons |
|---|---|---|---|
| Co-located | `tests/Features/Billing/` | Clean mirror, team ownership | Separate from source |
| Inline | `Features/Billing/Tests/` | Next to source | Requires autoloading config |
| Centralized | `tests/Feature/` | Laravel default | No feature grouping |

Co-located in `tests/Features/` is the recommended balance — closer than default but separated from source.

### Test Database Per Feature

| Strategy | Isolation | Speed | Complexity |
|---|---|---|---|
| Single database | Low (shared state) | Fast | Simple |
| Per-feature database trait | High | Slower (create DB) | Medium |
| Transaction rollback | Medium | Fast | Simple |

Use a single test database with `RefreshDatabase` or `DatabaseTransactions` for most features. Use per-feature database only when features have conflicting migration requirements.

---

## Tradeoffs

| Concern | Per-Feature Tests | Flat Test Directory |
|---|---|---|
| Discoverability | High (browse by feature) | Low (scroll 100+ files) |
| CI filtering | Run per-feature suites | Run all or nothing |
| Refactoring confidence | All related tests visible | Need to search for tests |
| Setup duplication | Shared base class per feature | Single base class |
| File count | More directories | Fewer directories |

---

## Performance Considerations

PHPUnit performance is driven by test count and database setup, not directory structure. Per-feature test suites run faster in development (fewer tests) than the full suite. Use:

```bash
# Quick feedback loop — only billing tests
phpunit tests/Features/Billing

# Full CI suite
phpunit
```

---

## Production Considerations

- Mirror the source structure exactly in tests
- Create a base test case per feature for shared setup
- Use phpunit XML suites to run per-feature in CI (parallel jobs)
- Keep feature tests focused on the feature's public API (controllers, services)
- Test cross-feature interactions in a separate suite (Integration/)
- Use `@group billing` annotations as an alternative to directory-based filtering
- Measure coverage per feature to identify untested areas

---

## Common Mistakes

### Testing Implementation Details

Feature tests should test the feature's behavior, not its internals. A change to `InvoiceService`'s internal logic should not break a test that validates invoice display — unless the output changes.

### Duplicate Setup Across Features

Every feature shouldn't re-create the same user setup. Extract shared factory states into a base test case or trait:

```php
namespace Tests\Features;

abstract class FeatureTestCase extends TestCase
{
    protected function authenticatedUser(): User
    {
        return User::factory()->create();
    }
}
```

### One Giant Test File

A single `BillingTest.php` with 2000 lines covering all billing scenarios becomes as hard to navigate as the worst layer-based structure. Split by class or behavior.

---

## Failure Modes

### Feature Tests That Pass in Isolation but Fail Together

Feature A's tests pass alone. Feature B's tests pass alone. Together, they fail due to shared database state (e.g., both create a user with the same email). Use `RefreshDatabase` per test to ensure isolation, even in the full suite.

### Stale Test Mirror

A feature is renamed from `Billing` to `Invoicing` but the test directory stays as `tests/Features/Billing/`. Tests still pass but are now disconnected from the source. Rename the test directory whenever the feature is renamed.

---

## Ecosystem Usage

PHPUnit discovers tests recursively in the `tests/Features/` directory. Parallel testing with `brianium/paratest` supports per-feature test execution. Laravel's `RefreshDatabase` and `DatabaseTransactions` traits work within feature test base classes. GitHub Actions and other CI platforms can run per-feature test suites using path filters.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — the overall structure tests mirror
- **Module Organization** (this workspace) — how test directories mirror source directories
- **Feature vs Layer** (this workspace) — implications for test organization
- **Exception Testing** (this workspace) — testing feature-specific exception handling
- **API Resource Testing** (this workspace) — testing feature's API response layer

---

## Research Notes

- PHPUnit's test discovery is filesystem-based — it finds all `*Test.php` files recursively
- Symfony's PHPUnit bridge and `brianium/paratest` support parallel test execution
- `@group` annotations provide cross-cutting test filtering independent of directory structure
- Feature-based test structure is supported by all CI platforms (GitHub Actions, GitLab CI, Jenkins)
- Coverage reports can be generated per-feature with `phpunit --coverage-html --testsuite=Billing`
- The mirror pattern is also used in Go, Rust, and Python testing conventions
