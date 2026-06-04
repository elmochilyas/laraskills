# Rules for Hexagonal/Ports and Adapters architecture concept

## Ports Use Only Core-Defined Types
---
## Category
Architecture | Framework Usage
---
## Rule
Port interface method signatures MUST use only core-defined types (domain entities, value objects, primitives); NEVER use framework types like `Illuminate\Http\Request`.
---
## Reason
Ports define the boundary between core and external systems. Framework types in port signatures leak framework concerns into the core, coupling business logic to technology choices.
---
## Bad Example
```php
interface InvoiceRepository {
    public function find(int $id): ?Invoice; // OK
    public function exportToPdf(Invoice $invoice): \Illuminate\Http\Response; // Framework type leak
}
```
---
## Good Example
```php
interface InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice;
    public function exportToPdf(Invoice $invoice): PdfDocument; // Core-defined type
}
```
---
## Exceptions
No common exceptions. If a port needs framework types, the port is likely misplaced in the wrong layer.
---
## Consequences Of Violation
Core depends on framework; port is not technology-agnostic; swapping adapters requires changing port signatures.

## Test Adapters Against Contract Tests
---
## Category
Testing | Architecture
---
## Rule
Write contract (shared) tests for each outbound port interface; verify every adapter implementation against the same contract test suite.
---
## Reason
Contract tests ensure all adapter implementations of a port behave identically from the core's perspective. This enables swapping adapters (e.g., in-memory for testing, Eloquent for production) with confidence.
---
## Bad Example
Testing only the Eloquent implementation of `InvoiceRepository`. An in-memory test double behaves differently from the production adapter, masking bugs.
---
## Good Example
```php
interface InvoiceRepositoryContractTest {
    /** @test */
    public function it_saves_and_retrieves_an_invoice(): void {
        $repo = $this->createRepository();
        $invoice = Invoice::create(/* ... */);
        $repo->save($invoice);
        $this->assertTrue($repo->find($invoice->id())->equals($invoice));
    }
}
// Both EloquentInvoiceRepositoryTest and InMemoryInvoiceRepositoryTest implement this
```
---
## Exceptions
Adapters with only a single implementation that will never have a test double may skip contract tests — but the port should be questioned if only one implementation exists.
---
## Consequences Of Violation
Adapter inconsistencies; swapping infrastructure risky; test doubles diverge from production behavior.

## Validate Adapter Symmetry
---
## Category
Architecture | Testing
---
## Rule
Verify that a use case works identically when triggered through different inbound adapters (HTTP, CLI, queue); test through multiple adapter configurations.
---
## Reason
The hexagonal promise is that the core is symmetric — any inbound adapter can drive the same use case. Without verification, adapters may accidentally add behavior or enforce different constraints.
---
## Bad Example
A `RegisterUser` use case works via HTTP controller, but a CLI command for bulk registration misses an authorization check that the HTTP adapter has.
---
## Good Example
Testing the same `RegisterUserUseCase` through an HTTP controller test and a console command test, asserting identical outcomes and validation constraints.
---
## Exceptions
Adapters that intentionally add adapter-specific behavior (e.g., CLI progress bar, HTTP rate limiting) — these are adapter concerns, not core concerns.
---
## Consequences Of Violation
Inconsistent behavior across delivery mechanisms; adapter-specific bugs; trust in hexagonal symmetry erodes.

## Separate Ports by Concern
---
## Category
Architecture | Design
---
## Rule
Define separate port interfaces for separate concerns (read vs write, specific use cases); do not create fat monolithic port interfaces.
---
## Reason
A single port interface with 20 methods for all invoice operations violates Interface Segregation Principle. Every adapter must implement all methods, even those irrelevant. Separate ports allow leaner adapters and clearer contracts.
---
## Bad Example
```php
interface InvoiceRepository {
    public function save(Invoice $invoice): void;
    public function find(InvoiceId $id): ?Invoice;
    public function search(Criteria $criteria): InvoiceCollection;
    public function delete(InvoiceId $id): void;
    public function generateReport(ReportCriteria $c): Report;
    // 15 more methods...
}
```
---
## Good Example
```php
interface InvoiceWriteRepository {
    public function save(Invoice $invoice): void;
    public function delete(InvoiceId $id): void;
}
interface InvoiceReadRepository {
    public function find(InvoiceId $id): ?Invoice;
    public function search(Criteria $criteria): InvoiceCollection;
}
```
---
## Exceptions
Simple aggregates with 3-5 methods that naturally belong together may share a single port — avoid over-splitting.
---
## Consequences Of Violation
Fat interfaces; adapter implementations with empty method bodies; hidden dependencies; Interface Segregation violation.

## Core Imports Nothing External
---
## Category
Architecture | Framework Usage
---
## Rule
The Hexagon core (ports + domain) MUST have zero imports from `Illuminate\*` or any external package beyond PHP standard library.
---
## Reason
The core is the framework-independent business logic. Any external import creates coupling that prevents independent testing, evolution, and framework migration.
---
## Bad Example
```php
namespace App\Core\Domain;
use Illuminate\Support\Collection; // External dependency in core

class InvoiceCollection {
    public function __construct(private Collection $items) {}
}
```
---
## Good Example
```php
namespace App\Core\Domain;

class InvoiceCollection {
    public function __construct(private array $items) {}
    public function add(Invoice $invoice): void { $this->items[] = $invoice; }
    public function total(): Money { /* pure PHP domain logic */ }
}
```
---
## Exceptions
No common exceptions for the core hexagon. Laravel utilities belong in adapters, not the core.
---
## Consequences Of Violation
Core coupled to framework; framework migration requires core changes; core cannot be tested without Laravel bootstrap.

## Inbound Adapters Call Use Cases Only
---
## Category
Architecture | Code Organization
---
## Rule
Inbound adapters (controllers, commands, queue listeners) MUST call use case ports and MUST NOT contain business logic.
---
## Reason
Inbound adapters are technology-specific entry points. Business logic in adapters duplicates rules across delivery mechanisms and makes the logic untestable without the adapter.
---
## Bad Example
```php
class InvoiceController {
    public function pay($id) {
        $invoice = InvoiceModel::findOrFail($id);
        if ($invoice->status === 'paid') { abort(400); }
        $invoice->update(['status' => 'paid']);
    }
}
```
---
## Good Example
```php
class InvoiceController {
    public function __construct(private PayInvoiceUseCase $useCase) {}
    public function __invoke(PayInvoiceRequest $request): JsonResponse {
        $result = $this->useCase->execute($request->toDto());
        return response()->json($result);
    }
}
```
---
## Exceptions
Adapter-specific behavior (e.g., HTTP caching headers, CLI output formatting) belongs in the adapter — this is not business logic.
---
## Consequences Of Violation
Business logic duplicated across adapters; inconsistent behavior between HTTP, CLI, and queue paths; adapter-specific bugs in business rules.

## Outbound Adapters Implement Core Interfaces
---
## Category
Architecture | Code Organization
---
## Rule
Every outbound adapter MUST implement an interface (port) defined by the core; NEVER create outbound adapters that lack a corresponding port interface.
---
## Reason
The core defines what it needs via port interfaces. Adapters without a matching port are either not needed by the core or bypass the architectural boundary.
---
## Bad Example
```php
// Core has no InvoiceExporter port
class CsvInvoiceExporter {
    public function export(Invoice $invoice): string { /* ... */ }
}
// Use case instantiates CsvInvoiceExporter directly — no port boundary
```
---
## Good Example
```php
// Core defines the port
interface InvoiceExporter {
    public function export(Invoice $invoice): string;
}
// Infrastructure implements it
class CsvInvoiceExporter implements InvoiceExporter {
    public function export(Invoice $invoice): string { /* ... */ }
}
```
---
## Exceptions
Utility adapters that support other adapters (e.g., HTTP client factory) may exist without a core port — they are infrastructure internals.
---
## Consequences Of Violation
Bypassed architectural boundary; core depends on concrete implementations; swapping infrastructure requires code changes in core.
