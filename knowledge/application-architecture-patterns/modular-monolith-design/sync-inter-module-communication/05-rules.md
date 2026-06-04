# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Inter-module synchronous communication via contracts
Knowledge Unit ID: MMD-06
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Always use contracts (interfaces) for synchronous inter-module communication
---
## Category
Architecture
---
## Rule
Never import implementation classes from another module. Always define a contract interface in the providing module's `Contracts/` directory, implement it internally, and let the consumer depend on the interface via Laravel's service container.
---
## Reason
Contracts decouple modules at the code level. The consumer has no import dependency on the provider's implementation classes, enabling independent evolution of implementation details.
---
## Bad Example
```php
// Consumer imports implementation directly
use Modules\Billing\Services\InvoiceService;

class OrderService
{
    public function __construct(
        protected InvoiceService $invoiceService,
    ) {}
}
```
---
## Good Example
```php
// Consumer depends on contract only
use Modules\Billing\Contracts\InvoiceServiceContract;

class OrderService
{
    public function __construct(
        protected InvoiceServiceContract $invoiceService,
    ) {}
}
```
---
## Exceptions
Within the same module, use direct implementation imports. Contracts are only for cross-module communication.
---
## Consequences Of Violation
Tight coupling prevents independent refactoring; extraction requires untangling implementation dependencies.

---
## Rule Name
Use DTOs, not Eloquent models, in contract method signatures
---
## Category
Architecture
---
## Rule
Contract methods must accept and return Data Transfer Objects (plain PHP objects or readonly classes), never Eloquent models, domain entities, or framework-specific types.
---
## Reason
Eloquent models expose internal database schema and couple the consumer to the provider's ORM decisions. DTOs are stable, serializable, and framework-agnostic.
---
## Bad Example
```php
interface InvoiceContract
{
    // Returns Eloquent model — exposes internal schema
    public function getInvoice(int $id): Invoice;
    // Accepts Eloquent model — couples consumer to DB schema
    public function createInvoice(Order $order): Invoice;
}
```
---
## Good Example
```php
readonly class InvoiceDTO
{
    public function __construct(
        public int $id,
        public string $number,
        public MoneyDTO $total,
        public string $status,
    ) {}
}

interface InvoiceContract
{
    // Returns DTO — no schema coupling
    public function getInvoice(int $id): InvoiceDTO;
    // Accepts DTO — consumer provides only needed data
    public function createInvoice(CreateInvoiceDTO $dto): InvoiceDTO;
}
```
---
## Exceptions
When the contract is explicitly designed to return model-like objects for read-only queries, return ReadModel DTOs (not Eloquent models with mutators).
---
## Consequences Of Violation
Consumer is coupled to provider's database schema; schema changes break consumers; serialization issues in queue contexts; testing requires database setup.

---
## Rule Name
Define contracts in the providing module, not the consuming module
---
## Category
Architecture
---
## Rule
Place the contract interface in the providing module's `Contracts/` directory. The provider owns the contract definition and is responsible for backward compatibility.
---
## Reason
The provider knows what capabilities it offers and controls the contract's evolution. Defining contracts in the consumer creates an inverted dependency where the provider must adapt to consumer requirements.
---
## Bad Example
```php
// Contract defined in consumer module
Modules/Orders/Contracts/InvoiceContract.php
// Provider (Billing) must import a contract defined by the consumer
// Inverted ownership — provider doesn't control its own API
```
---
## Good Example
```php
// Contract defined in provider module
Modules/Billing/Contracts/InvoiceContract.php
// Consumer (Orders) imports the contract
// Provider controls evolution and versioning
```
---
## Exceptions
Contracts for shared infrastructure (logging, auditing) that have no single owning module may live in the Shared kernel with shared ownership.
---
## Consequences Of Violation
Provider cannot evolve its API independently; consumer-defined contracts don't match provider capabilities; ownership confusion.

---
## Rule Name
Bind contracts to implementations in the providing module's service provider
---
## Category
Code Organization
---
## Rule
Register the contract-to-implementation binding in the providing module's service provider using `$this->app->bind()` or `$this->app->singleton()`.
---
## Reason
The provider knows which implementation satisfies each contract. Centralizing bindings in the module's service provider makes the dependency graph explicit and debuggable.
---
## Bad Example
```php
// Binding scattered across providers or not bound at all
// Consumer manually instantiates the implementation
$service = new InvoiceService(new Dependency()); // defeats DI
```
---
## Good Example
```php
// Modules/Billing/Providers/BillingServiceProvider.php
public function register(): void
{
    $this->app->bind(
        InvoiceContract::class,
        InvoiceService::class,
    );
}

// Consumer — resolved automatically by container
public function __construct(
    protected InvoiceContract $invoiceService,
) {}
```
---
## Exceptions
No common exceptions. Container binding is the standard mechanism for contract resolution.
---
## Consequences Of Violation
Runtime resolution failures; manual instantiation couples consumer to implementation dependencies; testing requires complex mocking.

---
## Rule Name
Version contracts when breaking changes are required
---
## Category
Maintainability
---
## Rule
When a breaking change to a contract interface is unavoidable, create a new version of the contract (e.g., `InvoiceContractV2`) and maintain both versions during a transition period.
---
## Reason
Breaking contract changes break all consumers simultaneously. Versioning enables gradual migration — consumers upgrade independently.
---
## Bad Example
```php
// Breaking change without versioning
interface InvoiceContract
{
    // Changed parameters — all consumers break at once
    public function getInvoice(string $uuid): InvoiceDTO;
    // Previously: public function getInvoice(int $id): InvoiceDTO;
}
```
---
## Good Example
```php
// Old contract — maintained during transition
interface InvoiceContract
{
    public function getInvoice(int $id): InvoiceDTO;
}

// New contract — consumers migrate gradually
interface InvoiceContractV2
{
    public function getInvoice(string $uuid): InvoiceDTO;
}

// Service provider binds both
$this->app->bind(InvoiceContract::class, InvoiceService::class);
$this->app->bind(InvoiceContractV2::class, InvoiceServiceV2::class);
```
---
## Exceptions
In a single-deployment monolith (all modules deployed together), versioning may be skipped if all consumers are updated in the same deployment. Document this decision.
---
## Consequences Of Violation
All consumers break simultaneously; coordination nightmare; consumers cannot migrate at their own pace.

---
## Rule Name
Test contract implementations against the contract interface
---
## Category
Testing
---
## Rule
Write tests that verify a contract implementation satisfies the contract interface. These contract tests should be run against every implementation of the interface.
---
## Reason
Contract tests catch interface/implementation drift before runtime. If the implementation doesn't satisfy the contract (wrong return types, missing methods, behavioral mismatch), the contract test fails immediately.
---
## Bad Example
```php
// No contract test — implementation changes silently diverge
// Implementation returns array instead of InvoiceDTO
// Runtime: "Expected InvoiceDTO, got array"
```
---
## Good Example
```php
trait InvoiceContractTests
{
    /** @test */
    public function it_returns_invoice_dto()
    {
        $invoice = $this->contract->getInvoice(1);
        expect($invoice)->toBeInstanceOf(InvoiceDTO::class);
    }
}

class InvoiceServiceTest extends TestCase
{
    use InvoiceContractTests;

    protected function setUp(): void
    {
        parent::setUp();
        $this->contract = app(InvoiceContract::class);
    }
}
```
---
## Exceptions
Contract tests may be omitted for trivial interfaces (single method, no behavior) where the implementation is obviously correct.
---
## Consequences Of Violation
Interface/implementation drift caught only at runtime; production errors from contract mismatches.

---
## Rule Name
Avoid circular contract dependencies
---
## Category
Architecture
---
## Rule
Never allow Module A's contract to depend on Module B's contract if Module B's contract depends on Module A's contract. The dependency graph between contracts must be acyclic.
---
## Reason
Circular contract dependencies prevent module independence — neither module can be extracted or tested without the other. They are the primary symptom of wrong module boundaries.
---
## Bad Example
```php
// Modules/Billing/Contracts/InvoiceContract.php
public function getInvoice(Modules\Orders\Contracts\OrderDTO $order): InvoiceDTO;
// Module Billing depends on Module Orders' DTO

// Modules/Orders/Contracts/OrderContract.php
public function getOrder(Modules\Billing\Contracts\InvoiceDTO $invoice): OrderDTO;
// Module Orders depends on Module Billing's DTO — circular!
```
---
## Good Example
```php
// Extract shared types or use scalar IDs
interface InvoiceContract
{
    public function getInvoice(int $orderId): InvoiceDTO;
}

interface OrderContract
{
    public function getOrder(int $orderId): OrderDTO;
}

// No circular dependency — each contract uses only its own types
```
---
## Exceptions
Extract shared DTO types into the Shared kernel if both modules genuinely need the same types. Do not use this as an excuse to couple modules.
---
## Consequences Of Violation
Modules cannot be extracted independently; contract changes require synchronized updates; testing modules in isolation is impossible.
