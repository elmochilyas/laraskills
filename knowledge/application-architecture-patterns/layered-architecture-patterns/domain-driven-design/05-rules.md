# Rules for Domain-Driven Design Tactical Patterns in Laravel

## Define Ubiquitous Language Glossary
---
## Category
Architecture | Process
---
## Rule
Document and maintain a Ubiquitous Language glossary of business terms with precise definitions; use these terms directly in class names, method names, and variable names.
---
## Reason
A shared vocabulary between domain experts and developers eliminates translation errors and ensures the code expresses business concepts directly. Without Ubiquitous Language, code uses technical terms disconnected from business meaning.
---
## Bad Example
Class named `TransactionProcessor` instead of `PaymentHandler`. Developer translates between "transaction" (technical) and "payment" (business) constantly.
---
## Good Example
Class named `Invoice`, method `markAsPaid()`, event `InvoicePaid`. All terms directly from the business domain.
---
## Exceptions
Technical infrastructure components (HTTP clients, queue workers) may use technical naming.
---
## Consequences Of Violation
Translation errors between business and code; onboarding friction for new developers; business rules misunderstood or misimplemented.

## Implement Entities with Identity
---
## Category
Architecture | Domain Modeling
---
## Rule
Entity classes MUST implement identity comparison via `equals()` method comparing by unique identifier; identity is the only equality criterion for Entities.
---
## Reason
Entities have a thread of identity throughout their lifecycle. Two Entity instances with the same attribute values but different IDs are different. Identity comparison prevents treating distinct entities as interchangeable.
---
## Bad Example
```php
class Invoice {
    public function __construct(
        public string $id,
        public string $customerName,
    ) {}
    // No equals() method
}
```
---
## Good Example
```php
class Invoice {
    public function __construct(
        private readonly InvoiceId $id,
        private CustomerName $customerName,
    ) {}
    public function equals(self $other): bool {
        return $this->id->equals($other->id);
    }
}
```
---
## Exceptions
Value Objects (no identity) do not need identity comparison — they use value equality comparing all properties.
---
## Consequences Of Violation
Two different entities with the same data treated as equal; collection operations incorrect; identity semantics lost.

## Value Objects Are Readonly and Immutable
---
## Category
Architecture | Domain Modeling
---
## Rule
Value Object classes MUST be declared `readonly` (PHP 8.1+) and MUST validate all invariants in the constructor; no setters, no mutable properties.
---
## Reason
Value Objects are defined by their attributes, not identity. Immutability ensures a Value Object that is valid when created stays valid. Constructor validation guarantees the Value Object cannot exist in an invalid state.
---
## Bad Example
```php
class Email {
    public string $value;
    public function __construct(string $value) {
        $this->value = $value; // No validation
    }
}
```
---
## Good Example
```php
readonly class Email {
    public function __construct(private string $value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }
}
```
---
## Exceptions
No exceptions. Immutability and construction validation are defining characteristics of Value Objects.
---
## Consequences Of Violation
Invalid data can exist in Value Object form; defensive checks required everywhere; Value Object semantics lost.

## Aggregate Root Enforces Invariants
---
## Category
Architecture | Domain Modeling
---
## Rule
All business invariants within an Aggregate MUST be enforced through the Aggregate Root; external code MUST NOT modify Aggregate internal state directly.
---
## Reason
The Aggregate Root is the consistency boundary. If invariants can be bypassed by modifying internal entities directly, the Aggregate provides no protection. All modifications must go through the Root.
---
## Bad Example
```php
$invoice = $repo->find($id);
$invoice->items->add(new LineItem($product, 2)); // Bypasses Root
```
---
## Good Example
```php
$invoice = $repo->find($id);
$invoice->addItem($product, 2); // Goes through Root
```
---
## Exceptions
Read-only access to internal entities for query/reporting may bypass the Root.
---
## Consequences Of Violation
Invariants bypassable; Aggregate consistency boundaries meaningless; business rule enforcement gaps.

## Domain Events Are Past Tense Facts
---
## Category
Architecture | Domain Events
---
## Rule
Name Domain Events in past tense using the Ubiquitous Language; events represent facts that HAVE occurred, not commands to do something.
---
## Reason
Domain Events are records of past occurrences. Past tense naming (`InvoicePaid`, `OrderShipped`) communicates that the event is a fact. Commands (`PayInvoice`, `ShipOrder`) are intentions, not facts. Confusing the two leads to event-driven architectures where listeners expect state to change, not react to changes.
---
## Bad Example
```php
class PayInvoice { /* This is a command, not an event */ }
```
---
## Good Example
```php
class InvoicePaid { /* This is an event — fact that invoice was paid */ }
```
---
## Exceptions
No exceptions. Past tense is the defining naming convention for Domain Events.
---
## Consequences Of Violation
Event-driven confusion; listeners that modify state instead of reacting; inability to replay events faithfully.

## Domain Classes Have No Framework Dependencies
---
## Category
Architecture | Domain Modeling
---
## Rule
Domain classes MUST NOT import or depend on Laravel framework classes, facades, helpers, or contracts.
---
## Reason
Domain layer framework dependencies couple business logic to Laravel, making Domain classes untestable without Laravel bootstrap and impossible to extract to separate packages. The Domain layer should be pure PHP with only standard library imports.
---
## Bad Example
```php
use Illuminate\Support\Facades\Log;
class Invoice {
    public function pay(): void {
        Log::info('Invoice paid'); // Framework dependency in Domain
    }
}
```
---
## Good Example
```php
class Invoice {
    public function pay(PaymentLogger $logger): void {
        $logger->log('Invoice paid'); // Port interface, not framework
    }
}
```
---
## Exceptions
No common exceptions. Framework dependency in Domain is always a design smell.
---
## Consequences Of Violation
Domain testable only with Laravel bootstrap; framework extraction impossible; accidental framework coupling proliferates.

## One Repository Per Aggregate Root
---
## Category
Architecture | Persistence
---
## Rule
Define exactly one Repository interface per Aggregate Root in the Domain layer; do NOT create Repositories for non-Aggregate tables or entities.
---
## Reason
The Repository pattern exists to manage Aggregate persistence and consistency boundaries. Non-Aggregate tables do not need Repository abstractions — they are accessed through the Root's Repository. One-per-Aggregate keeps the design focused.
---
## Bad Example
```php
interface InvoiceRepository {}
interface LineItemRepository {} // LineItem is not an Aggregate Root
interface CustomerRepository {} // Customer may not be an Aggregate Root
```
---
## Good Example
```php
interface InvoiceRepository {} // Invoice is the Aggregate Root
```
---
## Exceptions
Read-only query repositories for reporting or CQRS queries are separate concerns.
---
## Consequences Of Violation
Repository proliferation; confusion about persistence boundaries; Repository pattern applied where not needed.

## Keep Aggregates Small
---
## Category
Architecture | Domain Modeling
---
## Rule
Aggregates SHOULD contain 3-7 entities maximum; if an Aggregate exceeds this size, evaluate whether it should be split into multiple smaller Aggregates.
---
## Reason
Large Aggregates increase transaction contention, reduce performance, and create cognitive overhead. Small Aggregates with clear consistency boundaries scale better and are easier to understand and maintain.
---
## Bad Example
An `Order` Aggregate containing `OrderItems`, `Payments`, `Shipments`, `Returns`, `Notes`, `Discounts`, `Taxes`, `Coupons` — every order-related entity in one Aggregate.
---
## Good Example
`Order` Aggregate with `OrderItems` and `Payments` as internal entities. `Shipments` is a separate Aggregate with its own Root. `Returns` is separate.
---
## Exceptions
Business invariants that genuinely span many entities require a larger Aggregate — the invariant determines the boundary.
---
## Consequences Of Violation
Transaction contention; performance degradation; cognitive overload; difficult to modify without breaking invariants.
