# Anti-Patterns: Module Extractability

## 1. One Giant Test File Per Feature

A single `BillingTest.php` with 2000+ lines containing all billing scenarios — invoice CRUD, subscriptions, payments, reporting.

Large test files are hard to navigate, slow to run individually, and prone to merge conflicts. Create one test file per source class (mirroring the source structure) or per behavior group. A feature with 10 source classes should have approximately 10 test files. Small, focused test files allow developers to run a single test file during development for quick feedback.

## 2. Testing Private Methods

Using `ReflectionMethod` to test private or protected methods of service classes.

```php
public function test_it_calculates_tax(): void
{
    $service = new InvoiceService();
    $reflection = new ReflectionMethod($service, 'calculateTax');
    $this->assertEquals(8.00, $reflection->invoke($service, 100.00));
    // Tests private method — breaks on refactoring
}
```

Tests on implementation details break when the feature is refactored internally. Write tests that call controller endpoints (HTTP tests), invoke public service methods, or assert events are dispatched. Test behavior, not implementation. Internal tests create a false sense of stability while increasing maintenance burden.

## 3. No Feature Base Test Class

Every test file repeating the same `setUp()` logic: running migrations, creating factories, seeding data.

Without a feature base class, every test file repeats the same setup. Define an abstract base test case per feature that includes feature-specific `setUp()` logic, shared factory states, and helper methods. All test classes in the feature must extend this base class. This eliminates duplication and makes setup changes require editing only one file.

## 4. Stale Test Mirror

Feature renamed from Billing to Invoicing but tests still in `tests/Features/Billing/`, disconnected from the source.

When a feature is renamed, the test directory must also be renamed. A disconnected test directory causes confusion — developers look for tests in the new location and may create duplicates. Mirror the source structure exactly and keep it synchronized. Rename the test directory when the feature is renamed.

## 5. Cross-Feature Integration in Feature Tests

A Billing feature test that sets up both Billing and Reporting migrations to test cross-feature interactions.

Feature tests should be runnable in isolation. Cross-feature integration tests require multiple features to be set up, making them slow and unsuitable for per-feature CI. Create a `tests/Integration/` directory for tests that span multiple features. Keep feature tests focused on the feature's boundary.

## 6. No Stale Cache Handling

Running `phpunit` against stale routes or config because the developer forgot to clear caches after changes.

Stale caches cause false test failures or false passes. Always clear relevant caches before running tests when routes or config have changed. Add cache clearing to the test bootstrap or use `RefreshDatabase` which includes migration reruns.

## 7. No Per-Feature CI Path Filtering

CI runs the full test suite (20+ minutes) for every commit, even when only one feature's code changed.

Running 100% of tests for a change in one feature wastes CI resources and slows feedback. Configure CI path triggers to detect which feature files changed and run only the corresponding test suites. Per-feature CI keeps feedback under 2 minutes even for large projects. Run the full suite on merges to main or on a nightly schedule.
