# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Domain layer: entities, value objects, domain services
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Domain layer is the innermost layer of Clean/Hexagonal Architecture, containing pure business logic with zero framework dependencies. It consists of Entities (objects with identity that persist over time), Value Objects (immutable objects defined by their attributes), and Domain Services (stateless operations that don't naturally fit on an Entity). This layer represents the business's core concepts and rules, isolated from frameworks, databases, and external concerns. Its purity is what makes it independently testable and framework-agnostic.

---

# Core Concepts

**Entities:** Objects with a unique identity that remains constant through state changes. `Invoice` (identified by invoice number), `User` (identified by user ID), `Order` (identified by order ID). Entities have business methods that enforce invariants: `$invoice->markAsPaid()` checks that payment is valid before changing state.

**Value Objects:** Immutable objects defined entirely by their attributes. Two value objects with the same attributes are interchangeable. `Money(amount: 100, currency: 'USD')`, `Email('user@example.com')`, `Address(street, city, zip)`. Value objects enforce their own validation: `new Money(-5, 'USD')` throws.

**Domain Services:** Stateless classes that coordinate operations across multiple entities or value objects. `PricingService.calculateTotal(invoice, discountCode)`, `FraudDetectionService.analyzeTransaction().` Named after a business concept, not a technical one.

---

# Mental Models

**The "Ubiquitous Language" model:** Domain layer classes use the language of the business. If the business says "Invoice," there's an `Invoice` entity. If the business says "Mark as paid," there's a `markAsPaid()` method.

**The "Guardian of Invariants" model:** Domain objects enforce business rules that must always be true. An `Invoice` should never allow negative totals. An `Order` should never allow more items than inventory. These rules live in the Domain, not in Services or Controllers.

**The "Framework Agnostic" model:** Domain classes cannot import Laravel, Symfony, or any framework class. They use only PHP primitives and domain-defined types. This is verified by import checks.

---

# Internal Mechanics

**Entity example:**
```php
class Invoice {
    public function __construct(
        private InvoiceId $id,
        private Money $total,
        private InvoiceStatus $status = InvoiceStatus::DRAFT
    ) {}

    public function markAsPaid(\DateTimeImmutable $paidAt): void {
        if ($this->status !== InvoiceStatus::PENDING) {
            throw new InvoiceNotPendingException();
        }
        $this->status = InvoiceStatus::PAID;
        $this->paidAt = $paidAt;
        $this->recordEvent(new InvoicePaid($this->id));
    }
}
```

**Value Object example:**
```php
class Money {
    public function __construct(
        private readonly int $amount,
        private readonly string $currency
    ) {
        if ($amount < 0) throw new \InvalidArgumentException('Negative amounts not allowed');
        if (strlen($currency) !== 3) throw new \InvalidArgumentException('Invalid currency code');
    }

    public function add(Money $other): self {
        if ($this->currency !== $other->currency) throw new CurrencyMismatchException();
        return new self($this->amount + $other->amount, $this->currency);
    }
}
```

---

# Patterns

**Aggregate root:** A cluster of domain objects treated as a single unit. The root entity ensures consistency of the entire aggregate. `Order` is the aggregate root containing `OrderItem` value objects.

**Domain events:** Events that represent something meaningful to the business. Defined in the Domain layer as plain PHP objects: `class InvoicePaid { ... }`.

**Repository interfaces:** Defined in the Domain layer without implementation: `interface InvoiceRepository { public function find(InvoiceId $id): Invoice; ... }`

---

# Architectural Decisions

**Put behavior in domain entities when:** The business rule involves the entity's state. `invoice.markAsPaid()` belongs on Invoice.

**Put behavior in domain services when:** The operation involves multiple entities or external calculations. `PricingService.calculateTax()` involves Product, Customer, and Location.

**Use value objects when:** A concept has validation rules and no identity. Email validation, Money arithmetic, Date range logic.

**Use entities when:** Identity matters and state changes over time. Invoice, Order, Customer, Subscription.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Business rules are explicit and centralized | High initial modeling effort | Must discover domain invariants before coding |
| Rules are testable without infrastructure | Domain objects may duplicate database schema | Money in domain, decimal in database, mapping layer needed |
| Ubiquitous language aligns code with business | Business stakeholders must participate in modeling | Without domain experts, domain layer may be wrong |
| Framework independence enables flexibility | Domain purity requires enforcement | Architecture tests must prevent framework imports |

---

# Performance Considerations

Domain objects are PHP objects in memoryâ€”fast. The performance cost is not in the Domain layer but in the mapping between Domain entities and Infrastructure/Eloquent models.

---

# Production Considerations

Domain layer code is the most valuable code in the application. It represents business rules that would be expensive to rediscover. Write thorough unit tests for every domain class. Document invariants explicitly.

---

# Common Mistakes

**Anemic domain model:** Entities are property bags with getters/setters and no behavior. All business logic leaks into Application/Infrastructure layer. This is the most common Clean Architecture failure (see SLP-18).

**Framework imports in domain:** Domain classes that extend `Model`, use `Facades`, or import `Carbon`. Caught by architecture tests.

**Giant entities:** Entities with 50+ methods that handle every possible operation. Extract domain services for operations that don't naturally belong on the entity.

---

# Failure Modes

**Missing domain invariants:** Business rules that should be enforced in the Domain are checked only in the Application or Presentation layer. Eventually, a new code path bypasses the check and corrupts state.

**Inconsistent domain language:** Different entities using different terms for the same business concept. Product/Catalog confusion, Customer/User conflation.

---

# Ecosystem Usage

Spatie's `laravel-event-sourcing` package expects domain events to be plain PHP objects. The `laravel-ddd-toolkit` scaffolds domain layer entities and value objects. The `mghrby/modular-ddd` package includes domain layer scaffolding for Laravel.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DDD tactical patterns | LAP-06 Application layer | LAP-09 Framework independence |
| LAP-04 Dependency Rule | LAP-07 Infrastructure layer | LAP-10 Domain entity mapping |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche—most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
