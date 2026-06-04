# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Testing strategies for modular monolith
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Testing a modular monolith requires testing both within-module behavior (module is self-contained) and cross-module contracts (module boundaries work correctly). The testing pyramid shifts: unit tests for module-internal logic, contract tests for cross-module interfaces, integration tests for module boundaries, and end-to-end tests for critical user journeys. The key insight is that modules reduce the need for end-to-end tests because cross-module boundaries are tested with contract tests, not full-stack tests.

---

# Core Concepts

**Within-module tests:** Unit tests for module-internal services, actions, and domain logic. These are fast and don't cross module boundaries.

**Contract tests:** Tests that verify a module's contracts (service interfaces) work correctly. The consumer creates a test that exercises the contract; the provider implements it.

**Integration tests at module boundaries:** Tests that verify Module A correctly calls Module B's contract and handles responses. These test the integration point without booting the full application.

**End-to-end tests:** Tests that exercise a complete user flow across multiple modules. These are slow and should be minimal—only for critical paths.

---

# Mental Models

**The "Module as System Under Test" model:** Each module is a mini-system. Test its internal logic independently. Test its boundaries (contracts) explicitly.

**The "Test Boundaries, Not Implementation" model:** Contract tests verify that Module A correctly communicates with Module B. They don't test Module B's internal logic.

**The "Reduced E2E Need" model:** Because modules have explicit contract tests, you need fewer end-to-end tests. Each boundary is verified independently, so the risk of integration failure is lower.

---

# Internal Mechanics

**Contract test for a module interface:**
```php
// Billing module's contract test (in Billing's test suite)
class InvoiceServiceContractTest extends TestCase {
    /** @test */
    public function it_creates_an_invoice(): void {
        $service = $this->app->make(InvoiceService::class);
        $result = $service->createForOrder(['order_id' => '123', 'amount' => 500]);

        $this->assertInstanceOf(InvoiceData::class, $result);
        $this->assertNotEmpty($result->id);
    }
}
```

**Isolated module unit test (no Laravel boot):**
```php
test('invoice can be paid', function () {
    $invoice = new Invoice(
        new InvoiceId('1'),
        new Money(1000, 'USD'),
        InvoiceStatus::PENDING,
    );
    $invoice->markAsPaid(new DateTimeImmutable('2024-01-01'));
    expect($invoice->status())->toBe(InvoiceStatus::PAID);
});
```

---

# Patterns

**In-memory adapter for contract testing:** Module's contract tests use an in-memory implementation of the module's dependencies, not real infrastructure:
```php
class InMemoryInvoiceRepository implements InvoiceRepository {
    private array $invoices = [];
    public function save(Invoice $invoice): void {
        $this->invoices[$invoice->id()->toString()] = $invoice;
    }
}
```

**Module test seeding:** Each module has its own test factories and seeders. Cross-module test data is created through contracts, not by inserting into another module's tables.

---

# Architectural Decisions

**Unit test domain logic thoroughly:** Domain logic (entities, value objects, services) is the most valuable code to unit test. No Laravel boot needed.

**Contract test every cross-module interface:** Every interface in `Contracts/` should have a contract test in the providing module's test suite.

**Limit end-to-end tests:** E2E tests should cover only critical user journeys. Most integration bugs are caught by contract tests.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Fast unit tests (no Laravel boot) | More total tests across modules | Module isolation increases test count |
| Contract tests catch boundary bugs early | Contract test maintenance | Interface changes require contract test updates |
| Reduced E2E test flakiness | More test infrastructure | In-memory adapters must be maintained |
| Module can be tested in isolation | Cross-module test setup is module-specific | Testing a feature that spans 3 modules requires significant setup |

---

# Performance Considerations

Module-isolated unit tests are the fastest tests. Contract tests require partial Laravel boot (providers registered). E2E tests are the slowest.

---

# Production Considerations

Run module tests in parallel CI jobs. Each module's test suite is independent and can run on separate CI runners.

---

# Common Mistakes

**Skipping contract tests:** Relying only on E2E tests to catch cross-module bugs. E2E tests are slow and flaky—contract tests catch these bugs faster and more reliably.

**Testing internal implementation across modules:** Module A's test suite directly tests Module B's models. This couples the test suites and makes module extraction harder.

**No in-memory adapters:** Every test requires the full Laravel stack (database, queue, etc.) because modules don't have test doubles for their contracts.

---

# Failure Modes

**Contract mismatch:** Module A tests against version 1 of a contract, but Module B implements version 2. Contract tests in both modules should catch this, but only if both are run in the same CI.

**Test suite too slow:** E2E tests for every cross-module flow create a slow, flaky test suite. The solution is more contract tests, not optimizing E2E tests.

---

# Ecosystem Usage

Pest for unit and feature tests. PHPUnit for contract tests. Modulate's test infrastructure provides per-module test setup. Spatie's testing conventions apply within modules.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-05 Module autonomy | AEG-01 Architecture testing | MMD-11 Module extraction |
| MMD-06 Sync inter-module comm | SLP-17 Service layer testing | AEG-02 CI enforcement |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
