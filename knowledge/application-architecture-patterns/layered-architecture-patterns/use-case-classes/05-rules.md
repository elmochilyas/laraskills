# Rules: Use Case Classes

## Rule 1 — Use Case Has Single Public Method

**Rule Name:** use-case-single-public-method
**Category:** Always
**Rule:** Every Use Case class must have exactly one public method: `__invoke()`, `handle()`, or `execute()`.
**Reason:** Multiple public methods indicate multiple responsibilities. A Use Case represents a single business operation.
**Bad Example:**
```php
class OrderUseCase
{
    public function create(array $data): Order { /* ... */ }
    public function cancel(int $id): void { /* ... */ }
    public function refund(int $id): void { /* ... */ }
}
```
**Good Example:**
```php
class CancelOrder
{
    public function execute(CancelOrderInput $input): CancelOrderResult { /* ... */ }
}
```
**Exceptions:** None — a class with multiple public methods is a Service, not a Use Case.

## Rule 2 — Use Case Orchestrates, Domain Implements

**Rule Name:** use-case-orchestrates-domain-implements
**Category:** Always
**Rule:** Use Cases must orchestrate domain objects without containing business rules or calculations.
**Reason:** Business rules in Use Cases cannot be reused across operations and violate layer separation.
**Bad Example:**
```php
public function execute(Input $input): Result
{
    $total = 0;
    foreach ($input->items as $item) {
        $total += $item->price * 1.2; // Tax calculation — business rule
    }
}
```
**Good Example:**
```php
public function execute(Input $input): Result
{
    $invoice = Invoice::create($input->items);
    $this->invoices->save($invoice);
    return new Result($invoice->id());
}
```
**Exceptions:** Simple data transformation (formatting, type casting) that is purely mechanical.

## Rule 3 — No HTTP Imports in Use Case

**Rule Name:** no-http-imports-in-use-case
**Category:** Always
**Rule:** Use Case classes must not import or reference any HTTP-related classes (`Illuminate\Http\Request`, `Response`, `Redirect`).
**Reason:** HTTP imports couple the Use Case to the web layer, preventing reuse in CLI, queue, and test contexts.
**Bad Example:**
```php
use Illuminate\Http\Request;

class CreateInvoice
{
    public function execute(Request $request): JsonResponse { /* ... */ }
}
```
**Good Example:**
```php
class CreateInvoice
{
    public function execute(CreateInvoiceInput $input): CreateInvoiceResult { /* ... */ }
}
```
**Exceptions:** None — this is a hard architectural boundary.

## Rule 4 — Inject Ports via Constructor

**Rule Name:** inject-ports-via-constructor
**Category:** Always
**Rule:** All dependencies must be injected through the constructor, not passed as method arguments.
**Reason:** Constructor injection makes dependencies explicit, discoverable, and testable via mocking.
**Bad Example:**
```php
public function execute(Input $input, InvoiceRepository $repo): Result { /* ... */ }
```
**Good Example:**
```php
public function __construct(private InvoiceRepository $invoices) {}
public function execute(Input $input): Result { /* ... */ }
```
**Exceptions:** Variadic or optional infrastructure dependencies that are truly method-specific.

## Rule 5 — Transaction Management in Use Case

**Rule Name:** transaction-management-in-use-case
**Category:** Always
**Rule:** Transaction boundaries must be managed at the Use Case level, not in domain objects or repositories.
**Reason:** The Use Case orchestrates the operation and knows the full scope of the transaction.
**Bad Example:**
```php
// Transaction buried in a repository method
class InvoiceRepository
{
    public function save(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) { /* ... */ });
    }
}
```
**Good Example:**
```php
public function execute(Input $input): Result
{
    DB::beginTransaction();
    try {
        // orchestration steps
        DB::commit();
    } catch (\Throwable $e) {
        DB::rollBack();
        throw $e;
    }
}
```
**Exceptions:** When using a Unit of Work pattern, the Unit of Work handles the transaction.

## Rule 6 — Return DTO or Void

**Rule Name:** return-dto-or-void
**Category:** Always
**Rule:** Use Case methods must return a result DTO or void, never a Domain object, Eloquent model, or HTTP response.
**Reason:** Returning Domain objects leaks internal structure and couples callers to domain changes.
**Bad Example:**
```php
public function execute(Input $input): Invoice { /* ... */ }
```
**Good Example:**
```php
public function execute(Input $input): InvoiceCreatedResult { /* ... */ }
```
**Exceptions:** None — this is a hard architectural boundary.

## Rule 7 — Validate at Entry Point

**Rule Name:** validate-at-entry-point
**Category:** Always
**Rule:** Input validation must be completed before data reaches the Use Case.
**Reason:** Use Cases should not contain validation logic — they assume valid input from the entry point (Form Request, CLI command).
**Bad Example:**
```php
public function execute(array $input): Result
{
    $validator = Validator::make($input, ['email' => 'required|email']);
    // ...
}
```
**Good Example:**
```php
// Input validated in Form Request before reaching Use Case
public function execute(CreateInvoiceInput $input): Result
{
    // Assume $input is valid
}
```
**Exceptions:** Domain invariant validation belongs in domain objects, not Use Cases.

## Rule 8 — Use Case Testable Without HTTP

**Rule Name:** use-case-testable-without-http
**Category:** Always
**Rule:** Use Cases must be testable without bootstrapping Laravel's HTTP kernel.
**Reason:** HTTP-independent testing enables fast unit tests and reuse across delivery mechanisms.
**Bad Example:**
```php
// Test requires HTTP kernel bootstrap
public function test_create_invoice(): void
{
    $response = $this->post('/api/invoices', [...]); // HTTP test
}
```
**Good Example:**
```php
// Pure unit test
public function test_create_invoice(): void
{
    $useCase = new CreateInvoice(
        $this->mock(InvoiceRepository::class),
        $this->mock(CustomerRepository::class),
    );
    $result = $useCase->execute($input);
    expect($result->invoiceId)->toBe(42);
}
```
**Exceptions:** Integration tests that verify the full stack may bootstrap Laravel, but unit tests must not.
