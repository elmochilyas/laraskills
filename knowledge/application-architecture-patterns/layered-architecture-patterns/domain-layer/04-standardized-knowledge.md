# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Domain layer: entities, value objects, domain services
Knowledge Unit ID: LAP-05
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Domain layer is the innermost layer of Clean/Hexagonal Architecture, containing pure business logic with zero framework dependencies. It consists of Entities (objects with identity persisting over time), Value Objects (immutable objects defined by attributes), and Domain Services (stateless operations not naturally fitting on an Entity). This layer represents business core concepts, isolated from frameworks, databases, and external concerns.

---

# Core Concepts

- **Entities:** Objects with unique identity through state changes. `Invoice` (identified by invoice number), `User` (by user ID). Entities have business methods enforcing invariants: `$invoice->markAsPaid()`.
- **Value Objects:** Immutable objects defined by attributes — same attributes = interchangeable. `Money(100, 'USD')`, `Email('user@example.com')`. Enforce own validation.
- **Domain Services:** Stateless classes coordinating operations across multiple entities/value objects. `PricingService.calculateTotal()`, `FraudDetectionService.analyzeTransaction()`. Named after business concepts.
- **Ubiquitous Language:** Domain classes use business terminology. "Invoice," "Mark as paid," "Credit check."

---

# When To Use

- Clean Architecture or Hexagonal Architecture implementations
- Complex business domains with non-trivial rules
- Business logic that must be independently testable
- Long-lived applications where business rules are the primary asset

---

# When NOT To Use

- Simple CRUD with no business invariants
- Three-layer architecture with service-oriented business logic
- When maintaining domain purity cost exceeds the benefit

---

# Best Practices

- **Entities enforce their own invariants.** WHY: `$invoice->markAsPaid()` checks validity before changing state. Business rules in entities prevent inconsistent states regardless of which code path triggers them.
- **Value objects validate on construction.** WHY: `new Money(-5, 'USD')` throws. This guarantees invalid values never exist in the system.
- **Use domain services for multi-entity operations.** WHY: If an operation involves Product, Customer, and Location, it doesn't naturally belong on any single entity — a Domain Service is appropriate.
- **Keep domain events as pure PHP objects** in the Domain layer. WHY: Domain events represent business occurrences; they are not framework artifacts.
- **Define repository interfaces in Domain** (without implementation). WHY: Application layer depends on these interfaces (ports), Infrastructure implements them. This satisfies the Dependency Rule.

---

# Architecture Guidelines

- Zero framework imports in Domain layer. No `use Illuminate\*`, no `extends Model`, no facades.
- Domain classes use only PHP primitives and domain-defined types.
- Business rules that must always be true (invariants) live in Domain, not in Services or Controllers.
- Put behavior on entities when it involves the entity's own state. Put behavior in Domain Services when it involves multiple entities.

---

# Performance Considerations

- Domain objects are PHP objects in memory — fast.
- Performance cost is in mapping between Domain entities and Infrastructure/Eloquent models, not in the Domain layer itself.

---

# Security Considerations

- Domain layer should not handle authentication or authorization.
- Security rules that are business invariants (e.g., "only managers can approve invoices") belong in Domain.

---

# Common Mistakes

1. **Anemic domain model:** Entities are property bags with getters/setters and no behavior. Cause: treating entities like data containers. Consequence: business logic leaks to Application/Infrastructure. Better: put business methods on entities.

2. **Framework imports in domain:** Domain classes extending `Model`, using `Facades`, or importing `Carbon`. Cause: habit. Consequence: Domain coupled to framework. Better: architecture tests prevent this.

3. **Giant entities:** Entities with 50+ methods. Cause: putting all operations on one class. Consequence: violation of Single Responsibility. Better: extract Domain Services for operations spanning multiple concerns.

4. **Missing domain invariants:** Business rules checked only in Application/Presentation. Cause: rushing or not discovering invariants. Consequence: new code paths can bypass checks, corrupting state.

---

# Anti-Patterns

- **Framework-infected domain**: Domain classes that extend Laravel's `Model` or import facades.
- **Inconsistent domain language**: Different terms for same concept across entities (Product vs Catalog, Customer vs User).
- **Domain as data layer**: Entities that mirror database schema instead of modeling business concepts.

---

# Examples

```php
// Entity
class Invoice {
    public function __construct(
        private InvoiceId $id,
        private Money $total,
        private InvoiceStatus $status = InvoiceStatus::DRAFT
    ) {}
    public function markAsPaid(\DateTimeImmutable $paidAt): void {
        if ($this->status !== InvoiceStatus::PENDING) throw new InvoiceNotPendingException();
        $this->status = InvoiceStatus::PAID;
    }
}
// Value Object
class Money {
    public function __construct(private readonly int $amount, private readonly string $currency) {
        if ($amount < 0) throw new \InvalidArgumentException();
        if (strlen($currency) !== 3) throw new \InvalidArgumentException();
    }
    public function add(Money $other): self { /* ... */ }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DDD tactical patterns | LAP-06 Application layer | LAP-09 Framework independence |
| LAP-04 Dependency Rule | LAP-07 Infrastructure layer | LAP-10 Domain entity mapping |

---

# AI Agent Notes

- Domain layer classes must never import Laravel or any framework code.
- Use constructor injection for dependencies that cross domain boundaries (via interfaces).
- Domain services should be stateless and named after business operations.

---

# Verification

- [ ] No `use Illuminate\*` imports in Domain layer
- [ ] Entities have behavior methods (not just getters/setters)
- [ ] Value objects are immutable and validate on construction
- [ ] Domain services are stateless
- [ ] Business invariants are enforced in Domain, not Application/Presentation
- [ ] Architecture tests verify Domain layer purity
