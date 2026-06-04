# Architectural Decision Rules: Ports and Adapters

---

## Rule 1: Design port interfaces around domain concepts, not adapter capabilities
---
## Category
Architecture
---
## Rule
Name and structure port methods using domain language, not SQL or storage terminology. Never name methods `findWhere(array $criteria)` or `getByFields()`. Use business-language names like `findAllActiveContracts()` or `getAccountsOverdueSince()`.
---
## Reason
Ports express what the domain needs. If a port method name leaks SQL concepts (`where`, `orderBy`, `join`), the abstraction provides no hiding — it's a leaky abstraction that couples the domain to data-store thinking.
---
## Bad Example
```php
interface InvoiceRepository
{
    public function findWhere(array $criteria, array $orderBy = []): array; // SQL leak
}
```
---
## Good Example
```php
interface InvoiceRepository
{
    public function findAllOverdueSince(\DateTimeImmutable $since): array;
    public function findByCustomerId(int $customerId): array;
}
```
---
## Exceptions
When the port is intentionally generic (e.g., a generic `Cache` interface) and the criteria concept is genuinely domain-agnostic.
---
## Consequences Of Violation
Leaky abstraction that provides no benefit over direct Eloquent; domain depends on SQL-like thinking; adapter swap requires changing domain concepts.

---

## Rule 2: Limit ports to aggregate root boundaries — one port per aggregate root
---
## Category
Architecture
---
## Rule
Create one port (repository interface) per aggregate root, not per database table or entity. Child entities are accessed through their aggregate root's port.
---
## Reason
Aggregate roots are the natural transactional boundary. Creating ports for every entity leads to interface explosion and obscures which objects are the entry points for consistency. Child entities have no independent repository because they should never be persisted independently of their root.
---
## Bad Example
```php
interface OrderRepository { /* ... */ }
interface OrderLineRepository { /* ... */ } // Child entity — no independent repo needed
interface OrderPaymentRepository { /* ... */ } // Child entity
```
---
## Good Example
```php
interface OrderRepository
{
    public function findById(int $id): ?Order; // OrderLine loaded through Order
    public function store(Order $order): void;
}
```
---
## Exceptions
When a child entity is so heavily queried in isolation that loading through the aggregate root causes performance issues. In such cases, create a read-only query object, not a write repository.
---
## Consequences Of Violation
Interface proliferation (50+ ports); unclear aggregate boundaries; child entities persisted independently, bypassing aggregate invariants; transaction consistency cannot be enforced.

---

## Rule 3: Write contract tests that run against every adapter of a port
---
## Category
Testing
---
## Rule
Create a base test suite (contract test) that defines the behavioral contract of a port interface and run it against every adapter implementation, including the production adapter and any in-memory test adapters.
---
## Reason
Without contract tests, in-memory adapters can drift from the real implementation, passing tests in CI but failing in production. Contract tests enforce that all adapters satisfy the same behavioral contract.
---
## Bad Example
```php
// No contract test — Eloquent adapter may diverge from in-memory adapter
class InMemoryInvoiceRepositoryTest extends TestCase
{
    // Tests only the in-memory version, not the Eloquent one
}
```
---
## Good Example
```php
abstract class InvoiceRepositoryContractTest extends TestCase
{
    abstract protected function createRepository(): InvoiceRepository;

    /** @test */
    public function it_stores_and_retrieves_an_invoice(): void
    {
        $repo = $this->createRepository();
        $repo->store($invoice);
        $this->assertEquals($invoice->id, $repo->findById($invoice->id)->id);
    }
}

class EloquentInvoiceRepositoryTest extends InvoiceRepositoryContractTest
{
    protected function createRepository(): InvoiceRepository
    {
        return app(EloquentInvoiceRepository::class);
    }
}
```
---
## Exceptions
When an adapter is a simple wrapper with no risk of behavioral divergence (e.g., a log adapter that has no state to test).
---
## Consequences Of Violation
In-memory adapters pass tests but Eloquent adapters have SQL errors; production bugs found only after deployment; adapter swap confidence is low.

---

## Rule 4: Wire all port-to-adapter bindings in a single service provider
---
## Category
Code Organization
---
## Rule
Register all port-to-adapter bindings in exactly one service provider class per bounded context. Never scatter bindings across multiple providers or inline in controllers.
---
## Reason
A single wiring point makes the architecture's dependency graph visible and auditable. Scattered bindings hide the active implementation for any port and make it hard to verify that all ports are correctly wired before deployment.
---
## Bad Example
```php
// Binding in controller constructor
class InvoiceController
{
    public function __construct()
    {
        app()->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
    }
}
```
---
## Good Example
```php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
        $this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
        $this->app->bind(Clock::class, SystemClock::class);
    }
}
```
---
## Exceptions
Contextual bindings (using `when()->needs()->give()`) can remain in the same provider but should be documented with a comment explaining the special case.
---
## Consequences Of Violation
Cannot determine which adapter implements a given port without searching the entire codebase; duplicate bindings cause runtime resolution errors; architecture drift goes unnoticed.

---

## Rule 5: Never return Eloquent models from adapter methods that implement domain ports
---
## Category
Architecture
---
## Rule
Adapter methods implementing a domain port must only return domain models, primitives, or other domain-owned types. Never return Eloquent models, Collections, or any `Illuminate\*` types.
---
## Reason
The port's return types are part of the domain contract. Returning Eloquent types from an adapter leaks infrastructure into the caller's scope, coupling consuming code to Laravel even if the consuming code thinks it is domain code.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id) // Returns Eloquent model
    {
        return \App\Models\Invoice::find($id);
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?DomainInvoice
    {
        $eloquent = \App\Models\Invoice::with('lines')->find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Lazy loading leaks to callers; Carbon types appear in consuming code; the domain port contract is violated; swapping the adapter requires changing all consumers.

---

## Rule 6: Keep all input validation and sanitization in driver adapters, not the domain
---
## Category
Security
---
## Rule
Validate and sanitize all input in driver adapters (controllers, CLI commands, queue jobs) before passing data to domain services. Domain code must never receive untrusted input.
---
## Reason
Driver adapters are the system's entry points. Validation at this layer ensures no invalid data reaches the domain, regardless of which entry point is used. Domain code focuses on business rules, not input format checking.
---
## Bad Example
```php
// Domain service doing its own validation
class BillingService
{
    public function charge(int $amount, string $cardToken): void
    {
        if ($amount <= 0) { Validate in driver }
        if (strlen($cardToken) < 10) { Validate in driver }
    }
}
```
---
## Good Example
```php
// Controller (driver adapter) validates
class ChargeController
{
    public function __invoke(ChargeRequest $request, BillingService $billing): void
    {
        $billing->charge($request->toData());
    }
}

// Domain service expects only valid data
class BillingService
{
    public function charge(ChargeData $data): void
    {
        // Business rules only, not format validation
    }
}
```
---
## Exceptions
When validation rules ARE domain business rules (e.g., an order cannot exceed a customer's credit limit). These belong in domain services, not adapters.
---
## Consequences Of Violation
Domain services are coupled to input format; security vulnerabilities from untrusted data reaching business logic; domain cannot be reused across different entry points without duplicating validation.

---

## Rule 7: Ensure every port has at least two implementations (one production, one test)
---
## Category
Testing
---
## Rule
For every domain port, provide at least two adapter implementations: one production adapter using real infrastructure and one in-memory/fake adapter for testing. If a port cannot have a test implementation, reconsider whether the abstraction is justified.
---
## Reason
The primary value of a port is the ability to substitute implementations. A port with only one implementation offers no testability benefit (Laravel's SQLite testing already handles that) and should be removed per YAGNI.
---
## Bad Example
```php
interface InvoiceRepository { /* ... */ }

// Only one implementation, no test fake — abstraction provides no value
class EloquentInvoiceRepository implements InvoiceRepository { /* ... */ }
```
---
## Good Example
```php
interface InvoiceRepository { /* ... */ }

class EloquentInvoiceRepository implements InvoiceRepository { /* ... */ }
class InMemoryInvoiceRepository implements InvoiceRepository { /* ... */ }
```
---
## Exceptions
When the port abstracts an external service (e.g., `PaymentGateway`) that has no meaningful in-memory implementation. In that case, use a mock in tests but still define the port in the domain.
---
## Consequences Of Violation
Port abstraction provides no testability benefit; developers question the value of the architecture; port exists only for hypothetical future needs (YAGNI violation).

---

## Rule 8: Separate driver adapters (inbound) from driven adapters (outbound) in directory structure
---
## Category
Code Organization
---
## Rule
Organize adapter classes into separate directories for inbound adapters (controllers, commands, jobs) and outbound adapters (repositories, mailers, API clients). Never mix them in a single `Adapters` directory.
---
## Reason
Driver adapters initiate calls into the domain; driven adapters are called by the domain. Mixing them obscures the direction of dependency and makes architectural reviews harder. Clear separation documents the dependency flow at the filesystem level.
---
## Bad Example
```
Infrastructure/
  Adapters/
    InvoiceController.php     # Driver — initiates calls
    EloquentInvoiceRepo.php   # Driven — called by domain
    PaymentGateway.php        # Driven
    ConsoleNotifyCommand.php  # Driver
```
---
## Good Example
```
Infrastructure/
  Drivers/
    Http/
      InvoiceController.php
      OrderController.php
    Console/
      NotifyOverdueCommand.php
  Driven/
    Persistence/
      EloquentInvoiceRepository.php
      EloquentOrderRepository.php
    Payment/
      StripePaymentGateway.php
    Mail/
      LaravelMailSender.php
```
---
## Exceptions
Small projects with fewer than five adapters total. In such cases, a single `Infrastructure` directory with clear naming conventions is acceptable.
---
## Consequences Of Violation
Unclear dependency direction during code review; new adapters placed in wrong directory; architecture drift as the project grows; difficulty enforcing architectural rules with static analysis.
