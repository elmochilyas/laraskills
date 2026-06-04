# Architectural Decision Rules: Framework Decoupling

---

## Rule 1: Define domain ports in the domain layer, not infrastructure
---
## Category
Architecture
---
## Rule
Define all interfaces (ports) that express domain needs inside the `Domain\` namespace. Never define interfaces in the infrastructure layer for the domain to implement.
---
## Reason
Ports express what the domain needs from the outside world. If infrastructure owns the port, the domain must import infrastructure concepts to depend on it, violating Dependency Inversion. Domain-owned ports keep abstractions aligned with business language.
---
## Bad Example
```php
// Infrastructure owns the port — wrong direction
namespace Infrastructure\Contracts;

interface InvoiceRepository
{
    public function findById(int $id): ?Invoice;
}
```
---
## Good Example
```php
// Domain owns the port
namespace Domain\Contracts;

interface InvoiceRepository
{
    public function findById(int $id): ?Invoice;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Domain depends on infrastructure; interface language reflects database concerns not domain concepts; architecture boundary is inverted; swapping infrastructure becomes harder.

---

## Rule 2: Use `DateTimeImmutable` not `Carbon` in domain models and services
---
## Category
Architecture
---
## Rule
Use native PHP `DateTimeImmutable` for all time values in domain code. Never use `Carbon` or `CarbonImmutable` in domain models, services, or interfaces.
---
## Reason
Carbon is a Laravel dependency that mutates state by default, enabling subtle time-based bugs. `DateTimeImmutable` is a standard PHP class with zero framework coupling and guarantees immutability, making domain time logic predictable and testable.
---
## Bad Example
```php
namespace Domain\Billing;

use Carbon\Carbon;

class Invoice
{
    public function __construct(
        public Carbon $dueDate, // Framework dependency in domain
    ) {}
}
```
---
## Good Example
```php
namespace Domain\Billing;

class Invoice
{
    public function __construct(
        public \DateTimeImmutable $dueDate,
    ) {}
}
```
---
## Exceptions
When converting to Carbon inside an adapter for Laravel-specific features (e.g., diffForHumans in a Blade view). Carbon should never appear in domain logic.
---
## Consequences Of Violation
Domain is coupled to Laravel's time library; mutability bugs from Carbon's fluent API; domain tests require Carbon package; portability to non-Laravel projects is broken.

---

## Rule 3: Enforce domain purity with static analysis rules
---
## Category
Maintainability
---
## Rule
Configure PHPStan or Psalm with path-based rules that reject `use Illuminate\*` and `use App\Models\*` statements in the `Domain/` namespace. Fail CI on any violation.
---
## Reason
Code review alone cannot catch every framework import, especially as the codebase grows. Automated enforcement catches violations at commit time, preventing gradual erosion of the domain boundary.
---
## Bad Example
```php
// PHPStan allows files in Domain/ to import Illuminate\* — no enforcement
namespace Domain\Billing;

use Illuminate\Support\Collection; // No CI failure
```
---
## Good Example
```php
// phpstan.neon:
// parameters:
//   scanFiles:
//     paths:
//       - 'Domain/*'
//   excludePaths:
//     - '*.php'
// Better: use a custom rule:
// - checkPath: Domain/
//   disallowNamed: use Illuminate\
```
---
## Exceptions
When the domain intentionally uses a Symfony component that Laravel also depends on (e.g., Symfony Uuid). Document each exception explicitly in a baseline file.
---
## Consequences Of Violation
Gradual framework coupling goes undetected; domain purity erodes over time; architectural decisions are silently reversed; refactoring costs increase.

---

## Rule 4: Keep domain services using only domain-defined interfaces and native PHP types
---
## Category
Architecture
---
## Rule
Inject only domain-owned interfaces and native PHP types into domain service constructors. Never inject Eloquent models, Laravel facades, or framework-specific contracts.
---
## Reason
Domain services must operate without knowledge of the framework. Injecting Laravel contracts (e.g., `Illuminate\Contracts\Cache\Repository`) still couples the domain to Laravel's interface namespace, even if it is a contract. Domain services should define their own abstractions.
---
## Bad Example
```php
namespace Domain\Billing;

use Illuminate\Contracts\Cache\Repository; // Laravel contract in domain

class PricingService
{
    public function __construct(
        private Repository $cache, // Still framework-coupled
    ) {}
}
```
---
## Good Example
```php
namespace Domain\Billing;

class PricingService
{
    public function __construct(
        private PricingCache $cache, // Domain-owned interface
    ) {}
}

// Domain-owned port
interface PricingCache
{
    public function get(string $key): ?array;
    public function set(string $key, array $value, int $ttl): void;
}
```
---
## Exceptions
When the domain and framework are intentionally coupled (simple CRUD app, single-team project, no plan to reuse domain). Make this a conscious trade-off decision.
---
## Consequences Of Violation
Domain cannot be tested without Laravel container; swapping cache backend requires changing domain code; domain modules cannot be extracted as independent packages.

---

## Rule 5: Wire framework adapters to domain ports in service providers
---
## Category
Code Organization
---
## Rule
Bind all domain port interfaces to their framework adapter implementations in a single service provider, one binding per port. Place the binding registration where the architecture's wiring is visible at a glance.
---
## Reason
Centralized wiring makes the architecture's dependency graph explicit and auditable. Scattered bindings across multiple providers make it difficult to understand what implementations are active and whether ports are correctly wired.
---
## Bad Example
```php
// Binding hidden in a controller constructor
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
class DomainServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class);
        $this->app->bind(Clock::class, SystemClock::class);
        $this->app->bind(MailSender::class, LaravelMailSender::class);
    }
}
```
---
## Exceptions
When using contextual binding based on the consuming class. Use `when()->needs()->give()` in the same service provider for these cases.
---
## Consequences Of Violation
Wiring is scattered across the codebase; hard to audit which adapter implements which port; multiple bindings for the same interface in different providers cause runtime confusion.

---

## Rule 6: Question every domain interface — only abstract when variation exists
---
## Category
Maintainability
---
## Rule
For every domain interface, ask whether the application has or realistically expects multiple implementations. If the answer is no, consider removing the interface and using the concrete class directly.
---
## Reason
Every abstraction carries a cognitive cost: readers must find the implementation, understand the binding, and trace the call. When only one implementation exists and no variation is anticipated, the interface adds ceremony without benefit.
---
## Bad Example
```php
// Single-implementation interface — YAGNI violation
interface MathCalculator
{
    public function add(int $a, int $b): int;
}

class StandardMathCalculator implements MathCalculator
{
    public function add(int $a, int $b): int { return $a + $b; }
}
```
---
## Good Example
```php
// No interface — concrete class is sufficient
class InvoiceTotalsCalculator
{
    public function calculate(Invoice $invoice): Money { /* ... */ }
}
```
---
## Exceptions
When the interface serves as a test seam (in-memory implementation for tests) or when the domain requires the interface for conceptual clarity even without multiple implementations.
---
## Consequences Of Violation
Interface proliferation; wasted maintenance on abstractions without benefit; developers ignore the architecture due to perceived overhead.

---

## Rule 7: Never access `Request`, `Input`, or `$_GET/$_POST` in domain code
---
## Category
Security
---
## Rule
Domain models, services, and actions must never reference Laravel's `Request` class, the `Input` facade, or raw superglobals. All input reaches the domain only after validation and transformation in the framework layer.
---
## Reason
Raw input access in domain code bypasses validation, enables injection attacks, and couples domain logic to HTTP, making it impossible to reuse from CLI, queues, or tests without simulating HTTP requests.
---
## Bad Example
```php
namespace Domain\Billing;

use Illuminate\Http\Request;

class PaymentService
{
    public function processPayment(): void
    {
        $amount = request('amount'); // HTTP coupling in domain
    }
}
```
---
## Good Example
```php
namespace Domain\Billing;

class PaymentService
{
    public function processPayment(PaymentData $data): void
    {
        $amount = $data->amount; // Validated data only
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Domain code only testable with HTTP fixtures; CSRF/validation bypass in domain logic; security vulnerabilities when raw user input reaches business rules.

---

## Rule 8: Use native PHP arrays over Eloquent `Collection` in domain returns
---
## Category
Architecture
---
## Rule
Return native PHP arrays (`array<int, T>` or typed arrays) from domain services and methods. Never return `Illuminate\Support\Collection` or other Eloquent collection types from domain code.
---
## Reason
`Collection` is a Laravel type that provides dozens of helper methods, coupling callers to a framework class and making the domain's API surface dependent on Laravel. Native arrays are universally understood, serializable, and framework-agnostic.
---
## Bad Example
```php
namespace Domain\Billing;

use Illuminate\Support\Collection;

class InvoiceService
{
    /** @return Collection<int, Invoice> */
    public function getOverdue(): Collection
    {
        // Returns Laravel Collection from domain
    }
}
```
---
## Good Example
```php
namespace Domain\Billing;

class InvoiceService
{
    /** @return array<int, Invoice> */
    public function getOverdue(): array
    {
        // Returns native array from domain
    }
}
```
---
## Exceptions
When the return value is used purely for internal iteration within an adapter before mapping. The domain's public API must still use native types.
---
## Consequences Of Violation
Domain returns are coupled to Laravel; callers cannot use the result without a framework dependency; serialization to JSON/arrays requires extra conversion; static analysis is less precise.
