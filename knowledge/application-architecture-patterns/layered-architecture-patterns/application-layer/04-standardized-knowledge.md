# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Application layer: use cases, DTOs, application services
Knowledge Unit ID: LAP-06
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Application layer is the orchestration layer of Clean Architecture. It receives input from the outside world (via ports), coordinates domain objects to fulfill use cases, and returns results. It contains Use Cases (Interactors), Data Transfer Objects (DTOs), and Application Services. This layer does not contain business rules — those belong in Domain. Its logic is about flow, transactions, and infrastructure coordination.

---

# Core Concepts

- **Use Case (Interactor):** A class representing a single user goal. `CreateInvoice`, `ProcessRefund`, `RegisterUser`. One public method (`execute()`/`handle()`) receiving a DTO, coordinating domain objects, returning a result.
- **DTO (Data Transfer Object):** Immutable object carrying data between layers. Input DTO carries request data; output DTO carries response data. Simple property bags with no behavior.
- **Application Service:** Thin coordination class for shared orchestration logic across use cases. Less common than individual use cases.
- **Command-Query Separation:** Commands (writes) return void or simple ID. Queries return data without side effects.

---

# When To Use

- Clean Architecture or Hexagonal Architecture implementations
- Each application operation has distinct orchestration logic
- System has 10+ operations needing uniform entry points
- Multiple delivery mechanisms (HTTP + CLI) need to trigger the same operations

---

# When NOT To Use

- Simple CRUD with minimal orchestration — traditional service layer is simpler
- Three-layer architecture where services handle both orchestration and business logic
- Small projects where use case classes create too much overhead

---

# Best Practices

- **One use case per user goal.** WHY: `CreateInvoice` is a use case. `ListInvoices` is a separate query. Each is independently testable and deployable.
- **Keep use cases free of business rules.** WHY: Business rules belong in Domain entities/services. Use cases coordinate, not decide. An `if` statement about business logic in a use case is likely misplaced.
- **Use specific DTOs per use case.** WHY: Each use case should have its own input DTO with only the fields it needs. Fat DTOs carrying all possible fields are a code smell.
- **Manage transaction boundaries in Application layer.** WHY: The use case owns the transaction — `DB::transaction()` wraps the coordination. Domain layer should not manage transactions.
- **Log use case entry and exit.** WHY: Provides built-in audit trail for business operations — log operation name, timing, and result.

---

# Architecture Guidelines

- Use cases depend on Domain interfaces (ports), not Infrastructure implementations.
- Input DTO represents validated, transformed request. Output DTO represents response.
- Use cases should not call other use cases — this creates opaque call chains. Extract shared logic into Application Services.
- Transaction boundaries should not span multiple use cases or aggregate roots — risk of long-lived transactions and deadlocks.

---

# Performance Considerations

- Use case dispatch and DTO construction add minimal overhead.
- For high-volume endpoints, avoid deep DTO copying — map directly from request to domain where possible.
- No significant performance impact.

---

# Security Considerations

- Authorization checks can be performed in use cases (via a port interface to authorization service).
- Input DTOs should carry already-authenticated user context when needed.

---

# Common Mistakes

1. **Business logic in use cases:** Use case contains `if` statements for business rules that belong in Domain. Cause: convenience or misunderstanding. Consequence: business rules duplicated across use cases. Better: delegate to domain entities: `$invoice->canBePaid()` instead of checking invoice status in use case.

2. **Fat DTOs:** DTO carrying all possible fields for multiple use cases. Cause: laziness or reuse desire. Consequence: unclear contracts, unused fields. Better: specific DTO per use case.

3. **Missing DTO validation:** DTOs accept invalid data that should have been caught by Form Requests. Cause: assuming validation in Presentation is sufficient, not defending Application layer. Consequence: Application layer receives invalid data. Better: validate at every layer boundary.

4. **Orchestration explosion:** Use cases calling other use cases. Cause: reusing orchestration logic. Consequence: deep call chains, opaque flows. Better: extract shared orchestration to Application Services.

---

# Anti-Patterns

- **Fat use case**: Use case with business logic, multiple responsibilities, and complex branching.
- **Use case calling use case**: Creates opaque dependency graph — harder to test, reason about, and maintain.
- **DTO as God object**: Single DTO used across all use cases.

---

# Examples

```php
class CreateInvoiceUseCase {
    public function __construct(
        private InvoiceRepository $invoices,
        private PricingService $pricing,
        private EventBus $events,
    ) {}
    public function execute(CreateInvoiceDto $dto): InvoiceCreatedDto {
        return DB::transaction(function () use ($dto) {
            $invoice = Invoice::create(new CustomerId($dto->customerId), ...);
            $total = $this->pricing->calculateTotal($invoice, $dto->discountCode);
            $invoice->setTotal($total);
            $this->invoices->save($invoice);
            $this->events->dispatch(new InvoiceCreated($invoice->id()));
            return new InvoiceCreatedDto($invoice->id(), $invoice->total());
        });
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-05 Domain layer | LAP-07 Infrastructure layer | SLP-06 Use Case classes |
| LAP-04 Dependency Rule | LAP-08 Presentation layer | CPC-08 CQRS pattern |

---

# AI Agent Notes

- Keep use case classes focused on orchestration — no business rule logic.
- Input DTOs should be specific to each use case.
- Use case methods should handle transactions but delegate business decisions to domain objects.
- Never generate use case code that imports Laravel facades or HTTP classes.

---

# Verification

- [ ] Each use case has a single public method
- [ ] No business rule `if` statements in use cases
- [ ] Input DTOs are specific per use case (not shared fat DTOs)
- [ ] Transaction boundaries are managed in use cases, not domain
- [ ] Use cases depend only on Domain interfaces (ports)
- [ ] Architecture tests prevent Application layer from importing Infrastructure or Presentation
