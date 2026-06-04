# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Testing strategies for modular monolith
Knowledge Unit ID: MMD-16
Difficulty Level: Expert
Last Updated: 2026-06-02

---
## Rule Name
Unit test domain logic with pure PHP tests (no Laravel boot)
---
## Category
Testing
---
## Rule
Write unit tests for domain logic (entities, value objects, services, actions) as pure PHP tests without Laravel bootstrapping. These tests should be fast and runnable without a database.
---
## Reason
Domain logic tests are the most valuable and fastest tests. No Laravel boot needed - pure PHP tests run in milliseconds. Slow tests discourage frequent running, reducing their value.
---
## Bad Example
```php
class MoneyTest extends TestCase // boots Laravel
{
    public function test_addition(): void
    {
        $a = new Money(100, 'USD');
        $b = new Money(50, 'USD');
        $this->assertEquals(150, $a->add($b)->amount);
    }
}
```
---
## Good Example
```php
class MoneyTest extends \PHPUnit\Framework\TestCase
{
    public function test_addition(): void
    {
        $a = new Money(100, 'USD');
        $b = new Money(50, 'USD');
        $this->assertSame(150, $a->add($b)->amount);
    }
}
```
---
## Exceptions
No common exceptions. Domain logic should always be testable without framework bootstrapping.
---
## Consequences Of Violation
Slow test suite discourages frequent running; tests are slower than necessary; test-contamination from global state.

---
## Rule Name
Contract test every cross-module interface
---
## Category
Testing
---
## Rule
Write contract tests for every interface in each module's Contracts/ directory. The providing module's test suite verifies that the implementation satisfies the contract.
---
## Reason
Contracts are the integration points between modules. Contract tests catch boundary bugs (wrong return types, behavioral mismatch, missing error handling) faster and more reliably than end-to-end tests.
---
## Bad Example
```php
// No contract test - InvoiceContract returns InvoiceDTO
// InvoiceService actually returns array - runtime error
```
---
## Good Example
```php
trait InvoiceContractTests
{
    public function test_returns_invoice_dto(): void
    {
        $invoice = $this->contract->getInvoice(1);
        $this->assertInstanceOf(InvoiceDTO::class, $invoice);
    }

    public function test_throws_for_missing_invoice(): void
    {
        $this->expectException(InvoiceNotFoundException::class);
        $this->contract->getInvoice(99999);
    }
}

class InvoiceServiceTest extends TestCase
{
    use InvoiceContractTests;

    protected function setUp(): void
    {
        parent::setUp();
        $this->contract = $this->app->make(InvoiceContract::class);
    }
}
```
---
## Exceptions
Trivial contracts (single method returning a scalar) may not justify dedicated contract tests.
---
## Consequences Of Violation
Contract mismatches caught only at runtime; end-to-end tests duplicate coverage; integration bugs reach production.

---
## Rule Name
Use in-memory adapters for contract tests
---
## Category
Testing
---
## Rule
Provide in-memory implementations of module dependencies for contract tests. These replace real infrastructure (database, queue, HTTP) with in-memory versions that satisfy the same contract.
---
## Reason
In-memory adapters make contract tests fast (no database setup/teardown), deterministic (no infrastructure flakiness), and simple (no external dependencies).
---
## Bad Example
```php
class InvoiceServiceTest extends TestCase
{
    use RefreshDatabase; // 5 second database setup for every test

    public function test_creates_invoice(): void
    {
        // Test requires real DB queries
    }
}
```
---
## Good Example
```php
class InMemoryInvoiceRepository implements InvoiceRepositoryContract
{
    private array $invoices = [];

    public function save(InvoiceDTO $invoice): void
    {
        $this->invoices[$invoice->id] = $invoice;
    }

    public function find(int $id): ?InvoiceDTO
    {
        return $this->invoices[$id] ?? null;
    }
}

class InvoiceServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->app->instance(
            InvoiceRepositoryContract::class,
            new InMemoryInvoiceRepository,
        );
    }
}
```
---
## Exceptions
Tests that verify database-specific behavior (raw queries, constraints) need real database access. Keep these separate from contract tests.
---
## Consequences Of Violation
Slow test suite; flaky tests due to database state pollution; long feedback loop.

---
## Rule Name
Limit end-to-end tests to only critical user journeys
---
## Category
Testing
---
## Rule
Write end-to-end tests only for critical user journeys that span multiple modules. Use contract tests for boundary verification instead of E2E tests for every cross-module flow.
---
## Reason
E2E tests are slow (seconds per test), flaky (network, database, queue state), and expensive to maintain. Contract tests catch boundary bugs faster and more reliably.
---
## Bad Example
```php
// 50 E2E tests, each taking 5-15 seconds
// Full suite takes 10+ minutes
// "The build is always red" - team ignores failures
```
---
## Good Example
```php
// 3 E2E tests for critical user journeys
// 40 contract tests (fast, milliseconds each)
// Full suite runs in 30 seconds
// "The build is green" - team trusts tests
```
---
## Exceptions
Compliance or regulatory requirements may mandate specific E2E coverage. Document the requirement and keep E2E tests separate.
---
## Consequences Of Violation
Slow, flaky test suite; team ignores test failures; false confidence from slow build.

---
## Rule Name
Run module tests in parallel CI jobs
---
## Category
Testing
---
## Rule
Configure CI to run each module's test suite as a separate parallel job. Modules are independent - their tests should not need to run sequentially.
---
## Reason
Parallel module test execution reduces CI feedback time. If each module suite takes 3 minutes and there are 6 modules, sequential is 18 minutes; parallel is 3 minutes.
---
## Bad Example
```php
// Single CI job runs all tests sequentially
// Billing (3min) + Catalog (2min) + Orders (4min) = 9 min wait
```
---
## Good Example
```php
// CI matrix - parallel per-module execution
// jobs:
//   tests:
//     strategy:
//       matrix:
//         module: [Billing, Catalog, Orders, Inventory]
// All modules tested in parallel = 4 minutes total
```
---
## Exceptions
Cross-module integration tests (testing contracts with real infrastructure) may require a sequential step after parallel module tests pass.
---
## Consequences Of Violation
Long CI feedback times; developer context-switching while waiting; slower iteration cycles.

---
## Rule Name
Create test data through contracts, not by inserting into other modules' tables
---
## Category
Testing
---
## Rule
When a test in Module A needs data from Module B, create it through Module B's contract interface, not by inserting rows directly into Module B's database tables.
---
## Reason
Direct database insertion in tests creates coupling between test suites. The test knows about Module B's internal schema. If Module B's schema changes, Module A's tests break.
---
## Bad Example
```php
// Module A test inserts directly into Module B table
DB::table('billing_invoices')->insert([
    'id' => 1, 'amount' => 100, 'status' => 'paid',
]);
// If Billing schema changes, this test breaks
```
---
## Good Example
```php
// Module A test uses Module B contract
$invoice = $this->billingContract->createInvoice(
    new CreateInvoiceDTO(amount: 100, status: 'paid')
);
// Contract abstracts schema changes
```
---
## Exceptions
Existing legacy codebases may need cross-module data insertion during migration. Document as technical debt.
---
## Consequences Of Violation
Test suite coupling between modules; schema changes in one module break other modules' tests.

---
## Rule Name
Architecturally test module isolation
---
## Category
Testing
---
## Rule
Write architecture tests (Pest) that verify module isolation rules: no cross-module imports from internal namespaces, no cross-module Eloquent model usage, no cross-module database table references.
---
## Reason
Architecture tests codify the rules as executable specifications. They break the build when a violation is introduced, providing immediate feedback during development.
---
## Bad Example
```php
// No architecture tests - rely on code review to catch violations
// Reviewers miss violations in large PRs
```
---
## Good Example
```php
// Pest architecture test
test('modules only import contracts from other modules')
    ->expect('Modules\Billing\Models')
    ->not->toBeUsedIn('Modules\Catalog')
    ->expect('Modules\Catalog\Models')
    ->not->toBeUsedIn('Modules\Billing');

test('no cross-module database table access')
    ->expect('Modules\Billing')
    ->not->toUse('DB::table', 'catalog_')
    ->expect('Modules\Catalog')
    ->not->toUse('DB::table', 'billing_');
```
---
## Exceptions
No common exceptions. Architecture tests are the primary mechanism for enforcing module boundaries.
---
## Consequences Of Violation
Module isolation violations go undetected; architecture degrades silently; extraction becomes impossible.
