# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Application layer: use cases, DTOs, application services
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The Application layer is the orchestration layer of Clean Architecture. It defines how the system is used: it receives input from the outside world (via ports), coordinates domain objects to fulfill the use case, and returns results. It contains Use Cases (also called Interactors), Data Transfer Objects (DTOs), and Application Services. This layer does not contain business rules—those belong in the Domain layer. Instead, it contains operation-specific logic: transaction management, domain event dispatching, and infrastructure coordination.

---

# Core Concepts

**Use Case (Interactor):** A class that represents a single user goal. `CreateInvoice`, `ProcessRefund`, `RegisterUser`. Each has one public method (typically `execute()` or `handle()`) that receives a DTO, coordinates domain objects, and returns a DTO or void.

**DTO (Data Transfer Object):** An immutable object carrying data between layers. Input DTO carries request data into the use case. Output DTO carries response data out. DTOs are simple property bags with no behavior.

**Application Service:** A thin coordination class used when multiple use cases share orchestration logic. Less common than use cases; typically used for cross-cutting concerns (transaction management, event dispatching composition).

---

# Mental Models

**The "Single Goal" model:** Each use case answers one business question or performs one business action. "Register a new user" is a use case. "Create invoice" is a use case. "List invoices" is a use case (query).

**The "No Business Rules" model:** Application layer code does not contain business logic. It delegates to Domain entities and Domain services for business rules. Its logic is about flow, not rules.

**The "Port of Entry" model:** Use cases are inbound ports in Hexagonal Architecture. They define the contract between the outside world and the application core. Any adapter (HTTP, CLI, queue) can trigger them.

---

# Internal Mechanics

```php
class CreateInvoiceUseCase {
    public function __construct(
        private InvoiceRepository $invoices,  // Port (interface)
        private PricingService $pricing,      // Domain service
        private EventBus $events,             // Port (interface)
    ) {}

    public function execute(CreateInvoiceDto $dto): InvoiceCreatedDto {
        $productIds = array_map(fn($item) => new ProductId($item->productId), $dto->items);
        $customerId = new CustomerId($dto->customerId);

        // Domain logic delegated to domain objects
        $invoice = Invoice::create($customerId, $productIds);
        $total = $this->pricing->calculateTotal($invoice, $dto->discountCode);
        $invoice->setTotal($total);

        // Persistence via port
        $this->invoices->save($invoice);

        // Event via port
        $this->events->dispatch(new InvoiceCreated($invoice->id()));

        return new InvoiceCreatedDto($invoice->id(), $invoice->total());
    }
}
```

---

# Patterns

**Command-Query Separation:** Commands (write operations) return void or a simple ID. Queries return data without side effects. This keeps use cases predictable:
```php
// Command
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceCreatedDto;
}
// Query
class GetInvoiceQuery {
    public function execute(InvoiceId $id): InvoiceDto;
}
```

**DTO as contract:** Input DTO represents the validated, transformed request. Output DTO represents the response. DTOs are immutable and serializable:
```php
class CreateInvoiceDto {
    public function __construct(
        public readonly string $customerId,
        public readonly array $items,
        public readonly ?string $discountCode = null,
    ) {}
}
```

**Transaction boundary:** The application layer manages database transactions, not the domain:
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceCreatedDto {
        return DB::transaction(function () use ($dto) {
            // ... use case logic ...
        });
    }
}
```

---

# Architectural Decisions

**Use Use Case classes when:** Each application operation has distinct orchestration logic, the system has more than ~10 operations, or you need uniform access for multiple adapters (HTTP + CLI).

**Use Application Services (instead of separate Use Cases) when:** Operations are simple CRUD with little orchestration, or you prefer grouping related operations in one class (traditional service layer pattern).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Each operation is explicit and testable | High class-per-operation ratio | Simple CRUD features create many files |
| Uniform entry point for all adapters | DTO mapping adds boilerplate | Request → DTO mapping code for each use case |
| Transaction boundaries are clear | Use case chaining requires composition | Cross-cutting operations need wrapper use cases |
| Easy to add new delivery mechanism | Use case names proliferate | naming conventions needed to manage 50+ use cases |

---

# Performance Considerations

Use case dispatch and DTO construction add minimal overhead. For high-volume endpoints, avoid deep DTO copying and map directly from request to domain where possible.

---

# Production Considerations

Use case logging is valuable—log `execute` entry and exit with operation name and timing. This provides built-in audit trail for business operations.

---

# Common Mistakes

**Business logic in use cases:** The use case contains `if` statements for business rules that should be in domain entities. Example: checking invoice payment validity in the use case instead of `$invoice->canBePaid()`.

**Fat DTOs:** DTOs that carry all possible fields for multiple use cases. Each use case should have a specific input DTO with only the fields it needs.

**Missing DTO validation:** DTOs accept invalid data that should have been validated earlier (in Presentation layer's Form Request).

---

# Failure Modes

**Orchestration explosion:** Use cases that call other use cases, creating deep call chains. Use cases should coordinate domain objects, not other use cases.

**Transaction boundary too wide:** A transaction spanning multiple use cases or aggregate roots, leading to long-lived database transactions and deadlock risk.

---

# Ecosystem Usage

The `laravel-clean-architecture` package generates use case scaffolding. The `backslashphp/backslash` package provides CQRS with command/query objects. Spatie's packages use application services rather than strict use cases.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| LAP-05 Domain layer | LAP-07 Infrastructure layer | SLP-06 Use Case classes |
| LAP-04 Dependency Rule | LAP-08 Presentation layer | CPC-08 CQRS pattern |

---

## Research Notes

The layered architecture debate in the Laravel community continues to evolve. Three-layer architecture remains the dominant pattern, with most production Laravel applications implementing a Controller ? Service ? Model stack. Clean Architecture and Hexagonal Architecture adoption is growing but remains niche�most Laravel teams find the overhead of port-adapter separation unnecessary until team sizes exceed 8-10 engineers. The Archidux tool and pestphp/pest-plugin-arch make architectural rule enforcement practical at CI time. Key community voices (Benjamin Crozat, Spatie team, Taylor Otwell) consistently recommend starting with three layers and adding indirection only when specific coupling pain emerges. Laravel 12's continuing minimalism trend makes the framework even more agnostic to architectural choices.
