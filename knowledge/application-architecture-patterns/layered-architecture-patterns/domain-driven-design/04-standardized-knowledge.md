# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Domain-Driven Design Tactical Patterns in Laravel
Knowledge Unit ID: LAP-06-domain-driven-design
Difficulty Level: Advanced
Category: Architecture | Domain Modeling
Last Updated: 2026-06-04

---

# Overview

Domain-Driven Design (DDD) tactical patterns provide a vocabulary and structural guidance for modeling complex business domains in code. The key patterns — Entities, Value Objects, Aggregates, Domain Events, and Repositories — give developers a toolkit for encapsulating business rules, protecting invariants, and expressing domain concepts directly in the codebase.

In Laravel, DDD tactical patterns sit on top of architectural layering (Clean Architecture or Hexagonal). The Domain layer contains pure business objects with no framework dependencies. Laravel's infrastructure (Eloquent, queues, mail) serves the Domain, not the other way around. This separation enables business logic to be tested without database or HTTP bootstrapping, and allows the domain model to evolve independently of infrastructure concerns.

This KU focuses on the tactical patterns themselves — how to implement Aggregates, Entities, Value Objects, Domain Events, and Repositories within a Laravel project using Clean/Hexagonal Architecture.

---

# Core Concepts

**Entity**: An object with a distinct identity that persists over time and through changes to its properties. Two Entities with the same attribute values but different IDs are different. Implemented with an `equals()` method comparing by identity.

**Value Object**: An immutable object defined by its attribute values, not by an identity. Two Value Objects with the same values are interchangeable. Implemented as PHP 8.1+ `readonly` classes with constructor validation.

**Aggregate**: A cluster of Entities and Value Objects treated as a single unit for data changes. One Entity is the Aggregate Root, the only entry point for modifying the Aggregate. All business invariants are enforced through the Root.

**Domain Event**: A record of a significant business occurrence. Past tense name (`InvoicePaid`), immutable data, dispatched inside Aggregate methods. Infrastructure handles side effects in listeners.

**Repository**: A persistence abstraction that loads and saves Aggregates. Defined as an interface in the Domain layer, implemented in Infrastructure. Returns Domain objects, never Eloquent models.

**Ubiquitous Language**: A shared vocabulary between domain experts and developers, used in code, tests, and documentation. Every term has a precise definition. No translation layer between business and code.

---

# When To Use

- Business logic is complex with many interacting rules, state transitions, and invariants
- Domain experts are available for collaboration to define Ubiquitous Language
- Codebase has a long expected lifespan with evolving business rules
- Multiple delivery mechanisms (HTTP, CLI, queue) need to share business logic
- Business invariants must be enforced regardless of how data enters the system
- Testing business logic requires avoiding database and HTTP bootstrap overhead

---

# When NOT To Use

- Simple CRUD with minimal business rules — DDD adds ceremony disproportionate to value
- No domain expert collaboration available — Ubiquitous Language cannot be established
- Team unfamiliar with DDD concepts and unable to invest in learning
- Prototypes or short-lived projects where speed is the primary concern
- Projects where Eloquent Active Record is sufficient for business logic

---

# Best Practices

**Define Ubiquitous Language before writing code.** Document business terms with precise definitions. Use these terms directly in class names, method names, and variable names. Review with domain experts for accuracy. The glossary is a living document that evolves with the codebase.

**Keep Aggregates small.** An Aggregate should protect a single consistency boundary, not the entire database. Small Aggregates reduce transaction contention, improve performance, and are easier to reason about. If an Aggregate has more than 5-7 entities, question whether it should be split.

**Enforce invariants through the Aggregate Root only.** No external code should modify Aggregate internals directly. All state changes go through the Root's public methods. This makes invariants enforceable and testable.

**Dispatch Domain Events inside Aggregate methods.** When an Aggregate method changes state, it records what happened. Events are facts about the past. Dispatch them before persistence so listeners receive reliable state.

**Repository returns Domain objects.** The Repository interface is a Domain concept. Its implementation in Infrastructure maps between Eloquent models and Domain objects. Callers never see Eloquent models.

**No Laravel framework dependencies in Domain classes.** Domain classes are pure PHP. No facades, no helpers, no Eloquent, no contracts. This ensures testability without Laravel bootstrap and enables framework extraction.

---

# Architecture Guidelines

- Domain layer has zero dependencies on other layers. It imports only PHP standard library and custom Domain code.
- Application layer depends on Domain layer. Use Cases orchestrate Domain objects through port interfaces.
- Infrastructure layer implements Domain ports (Repository interfaces, domain event listeners).
- Presentation layer depends on Application and Infrastructure. Controllers never directly access Domain objects.
- One Repository interface per Aggregate Root. No generic repositories.
- Domain Events are defined in the Domain layer (or Domain/Application boundary). Listeners are Infrastructure.

---

# Performance Considerations

- Mapping between Domain objects and Eloquent models adds overhead. Profile real aggregates, not micro-benchmarks. For most domains, this overhead is negligible (<5ms per request).
- Aggregate size directly affects database transaction contention. Smaller Aggregates reduce locking and improve throughput.
- Domain Events dispatched synchronously add latency proportional to listener execution. Queue non-critical listeners.
- Value Object allocation cost is negligible for typical request volumes (<0.1ms per hundred objects).

---

# Security Considerations

- Domain objects enforce authorization rules through domain methods. `Invoice::cancel()` checks if the caller can cancel. This is domain-level security, not a replacement for presentation-layer gates.
- Never expose Domain internals through API responses. Use DTOs or Transformers in the Application/Presentation layer.
- Domain Events may contain sensitive business data. Avoid including secrets, passwords, or tokens in event payloads.
- Input validation happens at the entry point (Form Request), but Domain objects validate their own invariants — this is defense in depth.

---

# Common Mistakes

1. **Anemic Domain Model.** Domain objects with only getters and setters, with all business logic in services. This is the most common DDD mistake. Business logic must live IN the Domain objects, not in services. Services orchestrate; Domain objects implement.

2. **Giant Aggregates.** Modeling the entire database as a single Aggregate. This creates performance problems (contention, transaction size) and cognitive overhead. Split into small, focused Aggregates.

3. **Eloquent in Domain.** Using Eloquent models as Domain objects. Eloquent models inherit framework concerns, coupling Domain to Laravel. Create pure Domain classes and map to/from Eloquent in Infrastructure.

4. **Value Objects with identity.** Using Value Objects where identity tracking is needed. If two objects with the same values should be treated as different, use Entity. If they are interchangeable, use Value Object.

5. **Commands disguised as events.** Naming what should be a command as a Domain Event. `PayInvoice` is a command (intention). `InvoicePaid` is an event (fact). Events are past tense.

---

# Anti-Patterns

- **Anemic Domain Model**: Entities and Value Objects with no behavior, only data. All logic in services.
- **Giant Aggregate Root**: Single Aggregate that encompasses the entire domain model, causing performance and contention issues.
- **Framework-Coupled Domain**: Domain classes depending on Eloquent, facades, or Laravel contracts, making the Domain untestable without Laravel.
- **Repository per Table**: Creating Repository interfaces for every database table, even when the table is not an Aggregate Root. One Repository per Aggregate Root only.
- **Event Flood**: Dispatching Domain Events for every minor property change. Only significant business occurrences warrant events.

---

# Examples

**Value Object:**
```php
readonly class Email
{
    public function __construct(private string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException("Invalid email: $value");
        }
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
```

**Aggregate Root with Event:**
```php
class Invoice
{
    private array $events = [];

    public function __construct(
        private readonly InvoiceId $id,
        private InvoiceStatus $status,
        private readonly Money $total,
    ) {}

    public function markAsPaid(\DateTimeImmutable $paidAt): void
    {
        if ($this->status !== InvoiceStatus::Pending) {
            throw new \DomainException('Only pending invoices can be paid');
        }
        $this->status = InvoiceStatus::Paid;
        $this->events[] = new InvoicePaid($this->id, $paidAt);
    }

    public function releaseEvents(): array
    {
        $events = $this->events;
        $this->events = [];
        return $events;
    }
}
```

**Repository Interface:**
```php
interface InvoiceRepository
{
    public function find(InvoiceId $id): ?Invoice;
    public function save(Invoice $invoice): void;
    public function nextIdentity(): InvoiceId;
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-02 Clean Architecture | LAP-07 Value Objects | Event Sourcing and CQRS |
| LAP-03 Hexagonal Architecture | LAP-08 Domain Events | MMD-15 Event Sourcing/CQRS |
| LAP-04 Dependency Rule | LAP-10 Domain-Entity Mapping | DBC-01 Context Identification |

---

# AI Agent Notes

- Generate Domain classes as pure PHP with no framework dependencies.
- Default to small Aggregates (3-5 entities max). Large Aggregates are a design smell.
- Always generate Repository interfaces in the Domain layer, implementations in Infrastructure.
- Domain Events are past tense facts, not commands. Names like `InvoicePaid`, `OrderShipped`.
- Value Objects are readonly and validate on construction — this is the most important DDD rule for data integrity.
- When generating code for a complex domain, start with Ubiquitous Language documentation.
