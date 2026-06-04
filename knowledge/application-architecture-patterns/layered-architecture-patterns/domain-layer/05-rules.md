# Rules for Domain layer: entities, value objects, domain services

## Entities Enforce Their Own Invariants
---
## Category
Architecture | Design
---
## Rule
Entities MUST enforce all business invariants through behavior methods; do not allow external code to set entity state directly via setters or public properties.
---
## Reason
Business rules that protect entity consistency must be enforced everywhere the entity is used. Putting invariants in use cases or services means new code paths can bypass them. Entities should prevent invalid state regardless of caller.
---
## Bad Example
```php
class Invoice {
    public string $status = 'draft'; // Public property — anyone can set it
}
// In a service:
$invoice->status = 'paid'; // Bypasses business rules
```
---
## Good Example
```php
class Invoice {
    private InvoiceStatus $status = InvoiceStatus::DRAFT;
    public function markAsPaid(): void {
        if ($this->status !== InvoiceStatus::PENDING) {
            throw new InvoiceNotPendingException();
        }
        $this->status = InvoiceStatus::PAID;
    }
}
```
---
## Exceptions
Simple value objects or DTOs that merely carry data without invariants need not enforce business rules.
---
## Consequences Of Violation
Business rules scattered across codebase; paths to inconsistent entity state; bugs in new features that don't know about scattered rules.

## Value Objects Validate on Construction
---
## Category
Design | Reliability
---
## Rule
Value Objects MUST validate their state in the constructor and throw on invalid input; NEVER allow invalid value objects to exist.
---
## Reason
Value objects represent domain concepts with intrinsic validation rules (email format, positive money, 3-letter currency codes). Allowing invalid instances means every consumer must re-validate, leading to scattered checks and missed edge cases.
---
## Bad Example
```php
class Money {
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
    ) {}
}
// Invalid: new Money(-50, 'XYZ') passes without error
```
---
## Good Example
```php
class Money {
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
    ) {
        if ($amount < 0) throw new \InvalidArgumentException('Amount must be positive');
        if (strlen($currency) !== 3) throw new \InvalidArgumentException('Currency must be 3-letter ISO code');
    }
}
```
---
## Exceptions
Performance-critical code paths where validation overhead is significant may use factory methods with deferred validation — but this is rare.
---
## Consequences Of Violation
Invalid domain state propagates; validation logic duplicated; consumers must handle invalid values defensively.

## Domain Services for Multi-Entity Operations
---
## Category
Architecture | Design
---
## Rule
Use Domain Services for stateless operations that involve multiple entities or value objects; do not force operations onto an entity that doesn't naturally own them.
---
## Reason
Not all domain operations belong on a single entity. Operations spanning multiple entities (e.g., `calculateShipping` involving `Product`, `Customer`, `Address`) placed on any single entity create awkward dependencies and violate Single Responsibility.
---
## Bad Example
```php
class Product {
    public function calculateShipping(Customer $customer, Address $address): Money {
        // Product is now coupled to Customer and Address — wrong abstraction
    }
}
```
---
## Good Example
```php
class ShippingService { // Domain Service
    public function calculateShipping(Product $product, Customer $customer, Address $address): Money {
        // Coordinates domain logic across multiple entities
    }
}
```
---
## Exceptions
Operations that primarily involve one entity's state with minor input from others may still belong on the primary entity — use judgment.
---
## Consequences Of Violation
Entities with too many responsibilities; awkward method signatures; domain logic placed in Application layer instead.

## Domain Events as Pure PHP Objects
---
## Category
Architecture | Framework Usage
---
## Rule
Define Domain Events as pure PHP objects in the Domain layer; do not extend Laravel's event classes or use framework traits.
---
## Reason
Domain events represent business occurrences and must be framework-independent to preserve the Domain layer's purity. Framework-specific event mechanisms belong in the Infrastructure adapter.
---
## Bad Example
```php
use Illuminate\Foundation\Events\Dispatchable;

class InvoicePaid {
    use Dispatchable; // Framework trait in Domain
    public function __construct(public string $invoiceId) {}
}
```
---
## Good Example
```php
class InvoicePaid {
    public function __construct(public readonly InvoiceId $invoiceId) {}
}
// Infrastructure adapter dispatches through Laravel event system
class LaravelEventBus implements EventBus {
    public function dispatch(object $event): void {
        Event::dispatch($event);
    }
}
```
---
## Exceptions
No common exceptions. Framework event coupling in Domain is always a violation.
---
## Consequences Of Violation
Domain coupled to Laravel events; event replay across different frameworks requires rewriting domain events; Domain layer compromised.

## Repository Interfaces in Domain
---
## Category
Architecture | Code Organization
---
## Rule
Define repository interfaces in the Domain layer; place implementations in the Infrastructure layer; do not define repository interfaces in Application or Infrastructure.
---
## Reason
The Domain entity needs to be persisted and retrieved, but should not depend on persistence technology. Defining the interface in Domain means the Domain defines what it needs without worrying about how it's fulfilled.
---
## Bad Example
```php
// Interface defined in Infrastructure — Domain can't reference it without coupling
namespace App\Infrastructure\Persistence;
interface InvoiceRepository { /* ... */ }
```
---
## Good Example
```php
namespace App\Domain\Repositories;
interface InvoiceRepository {
    public function save(Invoice $invoice): void;
    public function find(InvoiceId $id): ?Invoice;
}
// Implementation in Infrastructure
namespace App\Infrastructure\Persistence;
class EloquentInvoiceRepository implements \App\Domain\Repositories\InvoiceRepository { /* ... */ }
```
---
## Exceptions
Query-only repositories that return DTOs or projections may be defined in the Application layer since they are read-model concerns, not domain persistence.
---
## Consequences Of Violation
Domain cannot declare persistence needs; Application layer must define interfaces; Domain-to-Infrastructure coupling through Application intermediaries.

## No Framework Imports in Domain
---
## Category
Architecture | Framework Usage
---
## Rule
Domain classes MUST have zero imports from `Illuminate\*` or any framework namespace; use only PHP primitives and domain-defined types.
---
## Reason
The Domain layer is the crown jewel of the architecture — it contains the business rules that are the application's primary asset. Any framework import couples this asset to a specific technology, making it untestable without the framework and unmigratable.
---
## Bad Example
```php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Invoice extends Model {
    public function isOverdue(): bool {
        return $this->due_date->lt(Carbon::now()); // Framework coupling
    }
}
```
---
## Good Example
```php
class Invoice {
    public function __construct(
        private InvoiceId $id,
        private \DateTimeImmutable $dueDate,
    ) {}
    public function isOverdue(\DateTimeImmutable $now): bool {
        return $this->dueDate < $now;
    }
}
```
---
## Exceptions
No common exceptions. Any framework import in Domain is a violation.
---
## Consequences Of Violation
Domain coupled to framework; cannot test without Laravel bootstrap; framework migration requires rewriting business rules.

## Business Behavior on Entities
---
## Category
Design | Architecture
---
## Rule
Entities MUST contain behavior methods that operate on their own state; do not create entities that are only property bags with getters and setters.
---
## Reason
Anemic domain models push business logic into services and use cases, where it becomes procedural code that is duplicated across operations. Behavior on entities keeps business rules co-located with the state they govern.
---
## Bad Example
```php
class Invoice {
    public function __construct(
        public string $id,
        public string $status,
        public float $total,
        public ?\DateTimeInterface $paidAt,
    ) {}
}
// Business logic lives in services:
class PaymentService {
    public function pay(Invoice $invoice): void {
        if ($invoice->status !== 'pending') throw new \Exception();
        $invoice->status = 'paid';
        $invoice->paidAt = new \DateTime();
    }
}
```
---
## Good Example
```php
class Invoice {
    public function __construct(
        private InvoiceId $id,
        private InvoiceStatus $status,
        private Money $total,
        private ?\DateTimeImmutable $paidAt = null,
    ) {}
    public function markAsPaid(\DateTimeImmutable $paidAt): void {
        if ($this->status !== InvoiceStatus::PENDING) throw new InvoiceNotPendingException();
        $this->status = InvoiceStatus::PAID;
        $this->paidAt = $paidAt;
    }
}
```
---
## Exceptions
Read models or projections that exist solely for query purposes may be simple data holders — they are not entities in the DDD sense.
---
## Consequences Of Violation
Business logic scattered across Application layer; duplicated rules across use cases; entity state can be manipulated without business rule enforcement; anemic domain model anti-pattern.
