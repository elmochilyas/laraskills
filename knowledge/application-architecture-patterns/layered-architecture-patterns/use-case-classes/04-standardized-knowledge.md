# Use Case Classes

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-11-use-case-classes
**Difficulty:** Advanced
**Category:** Architectural Pattern
**Last Updated:** 2026-06-04

## Overview

Use Case classes encapsulate each distinct application operation into a single-purpose class with exactly one public method. They sit between the presentation layer (controllers) and the domain layer, serving as the orchestration boundary for business operations.

Use Cases exist to enforce the separation between what the application does (orchestration) and how business rules are implemented. In Clean Architecture and Hexagonal Architecture, Use Cases are the application layer — they receive input from adapters (HTTP, CLI, queue), coordinate domain objects, manage transaction boundaries, and return results without containing any business logic themselves.

Engineers should care because Use Case classes provide the highest form of controller thinning. Instead of controllers calling domain objects directly or services containing orchestration logic, each business operation gets a dedicated class that makes the application's capabilities explicit. A new developer reading `app/UseCases/CancelSubscription.php` instantly understands what the application can do.

## Core Concepts

**Single Public Method Contract:** Every Use Case exposes exactly one public method — `__invoke()`, `handle()`, or `execute()`. The class name describes the business operation; the method name is generic. This creates a predictable interface where all use cases follow the same pattern regardless of complexity.

**Orchestration vs Implementation:** Use Cases orchestrate — they create domain objects, call their methods, and use port interfaces for persistence and side effects. Business rules, validation, and calculations stay inside domain objects. A Use Case never contains `if` statements about business logic; it only contains flow control for the orchestration steps.

**Port Dependency Injection:** Use Cases depend on abstractions (interfaces/ports), not concretions. Repository interfaces, queue dispatchers, gateways — all injected through the constructor. This makes every dependency explicit and every use case testable without infrastructure.

**Transaction Boundaries:** The Use Case controls the transaction scope. It opens a transaction, performs the orchestration steps, and commits or rolls back. Transaction management is explicit in the Use Case, not buried in a repository or domain object.

**DTO Input/Output:** Use Cases accept Data Transfer Objects (DTOs) or primitives as input and return DTOs or void. Use Cases should accept domain objects as method arguments and return domain result objects. HTTP Request objects and raw input arrays are not passed directly to Use Cases. Prefer DTOs or domain primitives as input/output; returning domain objects is acceptable when the use case is thin. This keeps the application layer decoupled from both HTTP and domain concerns.

**Framework Independence:** A properly designed Use Case contains zero Laravel-specific imports. No `Request`, `Response`, `Redirect`, `Facade` imports. The Use Case is pure PHP that can be tested without Laravel's HTTP kernel.

## When To Use

- Applications following Clean Architecture, Hexagonal Architecture, or Ports & Adapters
- Any system where each endpoint represents a distinct business operation with orchestration logic
- Projects with multiple delivery mechanisms (HTTP API, CLI commands, queue jobs) that share the same business operations
- Teams that need explicit documentation of every business operation the system supports
- Enterprise applications where audit trails, per-operation monitoring, and operation-level metrics are required
- Codebases where controllers have grown fat and need systematic thinning

## When NOT To Use

- Simple CRUD applications where a controller method calling Eloquent directly is sufficient
- Three-layer architecture where Service classes handle orchestration (Services and Use Cases overlap in responsibility)
- Operations that consist of a single repository call with no orchestration (Use Case adds no value)
- Prototypes or small applications where architectural overhead outweighs benefits
- Teams that are not committed to maintaining the pattern across the entire codebase — partial adoption creates confusion

## Best Practices

**Name Use Cases for Business Operations, Not Technical Actions:** `CreateInvoice`, `CancelSubscription`, `ProcessRefund` — not `SaveInvoice`, `DeleteUser`, `UpdateRecord`. Business names communicate intent; technical names describe implementation.

**One Use Case Per File:** Never put multiple Use Cases in the same file. The file name should match the class name. This makes autoloading predictable and search trivial.

**Inject All Dependencies Through Constructor:** Use Case methods should only receive operation-specific data (DTOs, primitives). All services, repositories, and infrastructure dependencies go in the constructor. This makes testing straightforward — constructor injection reveals all dependencies.

**Keep Constructor Parameters Under 4:** If a Use Case needs 5+ dependencies, it is doing too much. Extract coordinating logic into a Service or split the Use Case.

**Use `__invoke` for Single-Method Classes:** `__invoke` enables direct route-to-class binding: `Route::post('/invoice', CreateInvoiceUseCase::class)`. This eliminates controllers entirely for Use Case–backed endpoints.

**Validate Before the Transaction:** Run input validation before entering the Use Case. Form Requests or DTO validation happens at the controller boundary. The Use Case assumes valid input.

**Return Result DTOs, Not Primitives:** Return a typed result object rather than a bare array or boolean. `InvoiceCreatedResult` with `invoiceId`, `status`, and `message` properties is self-documenting.

## Architecture Guidelines

**Layer Placement:** Use Case classes belong in the Application layer, not the Domain layer and not the Presentation layer. In a layered Laravel architecture, place them in `app/UseCases/` or `app/Application/UseCases/`.

**Dependency Direction:** Use Cases depend on Domain interfaces (ports) and DTOs. Prefer them not to depend on infrastructure implementations (databases, HTTP clients, file systems). Infrastructure dependencies are injected via their interfaces.

**Relationship to Controllers:** Controllers extract HTTP input, pass it to a Use Case via a DTO, and return the Use Case result as an HTTP response. Controllers should be thin wrappers around Use Case calls.

**Relationship to Domain Objects:** Use Cases create domain objects, call methods on them, and pass them to repository interfaces for persistence. Use Cases never access the database directly — they use repository interfaces injected through the constructor.

**Transaction Scope:** The Use Case owns the transaction. Use `DB::transaction()` or a Unit of Work within the Use Case method. Keep transaction scope as narrow as possible to avoid lock contention.

**Testing Architecture:** Use Cases should be testable without Laravel's HTTP kernel. A unit test creates the Use Case with mocked dependencies, calls the public method, and asserts on the returned DTO.

## Performance Considerations

- Use Case class instantiation and method dispatch add negligible overhead — approximately 0.01ms per call
- Transaction scope within Use Cases directly impacts database lock contention; keep transactions short
- DTO construction and copying has negligible cost compared to database or API operations
- No performance penalty from Use Case encapsulation; the overhead is primarily organizational
- In Octane, Use Cases must remain stateless (no mutable properties) to prevent memory leaks across requests
- For high-throughput endpoints, consider caching Use Case instances in the container (singleton binding) since they are stateless by design

## Security Considerations

- Authorization must occur before the Use Case runs — typically in the Form Request's `authorize()` method or controller middleware
- Use Cases should not re-authorize; they assume the caller is authorized
- Input validation must complete before the Use Case receives data; Use Cases should not validate input
- Use Cases should not log sensitive data from input DTOs
- Use Cases should verify domain invariants through domain objects — domain objects validate their own state when methods are called
- Failed Use Cases should throw domain-specific exceptions, not HTTP exceptions, to keep the layer pure

## Common Mistakes

**Fat Use Cases:** The most common mistake — Use Cases that contain business logic alongside orchestration. When a Use Case has `if` statements about business rules, domain calculations, or validation logic, those belong in domain objects. A fat Use Case is harder to test, harder to reuse, and violates single responsibility.

**Why developers make it:** It is faster to put logic in the Use Case than to extract it into domain objects. Teams without strong domain modeling discipline default to putting everything in one class.

**Consequences:** Business rules are duplicated across Use Cases. Testing requires mocking infrastructure even for business rule tests. Domain objects become anemic data bags.

**Better approach:** Every time you write a conditional or calculation in a Use Case, ask: "Does this belong in a domain object?" Extract business logic into domain objects, value objects, or domain services.

**Request Object in Signature:** Accepting `Illuminate\Http\Request` as a Use Case parameter. This couples the Use Case to HTTP, making it unusable from CLI commands, queue jobs, or API routes.

**Why developers make it:** Convenience — the Request is already available in the controller. Passing it directly seems faster than creating a DTO.

**Consequences:** The Use Case cannot be tested without bootstrapping Laravel's HTTP kernel. It cannot be called from a CLI command without faking a Request. The layer boundary is violated.

**Better approach:** Always create an input DTO. The controller extracts data from the Request and passes it to the Use Case via the DTO.

**Returning Domain Objects:** Returning Eloquent models, entities, or aggregates from Use Case methods.

**Why developers make it:** It seems natural to return the object that was created or modified. The caller "might need" the full object.

**Consequences:** Domain objects expose more data than the caller needs. Serialization logic leaks into the presentation layer. Changes to domain objects affect API responses.

**Better approach:** Return a result DTO with only the data the caller needs. If the caller needs an ID, return `['id' => $invoice->id()]`.

**Use Case as CRUD Wrapper:** Creating a `CreateUser` Use Case that simply calls `User::create($data)`. This adds architectural overhead without business value.

**Why developers make it:** Strict adherence to the pattern without considering whether the operation warrants a Use Case.

**Consequences:** Proliferation of trivial Use Cases that obscure the meaningful ones. Developers resent the pattern as unnecessary ceremony.

**Better approach:** Reserve Use Cases for operations that involve orchestration, business rules, or multiple domain objects. Simple CRUD operations can stay in controllers.

## Anti-Patterns

**Fat Use Case:** Use Case accumulating orchestration logic, business rules, validation, and infrastructure calls. Symptoms: Use Case exceeds 100 lines, has multiple private helper methods, mixes repository calls with business calculations, and imports many infrastructure classes. Refactor by extracting business rules to domain objects and infrastructure calls to service interfaces.

**Request in Use Case:** Use Case importing `Illuminate\Http\Request`, accessing session data, or calling `redirect()`. This couples application logic to HTTP. Refactor by creating input DTOs and moving HTTP-specific logic to controllers.

**Anemic Use Case:** Use Case that does nothing except call a single repository method with no orchestration. This is ceremony without benefit. Refactor by removing the Use Case and calling the repository directly from the controller.

**Stateful Use Case:** Use Case with mutable properties that accumulate state across method calls. This breaks in Octane where the same instance handles multiple requests. Refactor by making all state local to the public method.

**God Use Case:** A single `ProcessOrder` Use Case that handles every order-related operation — creation, updates, cancellations, refunds. This violates single responsibility. Refactor into separate Use Cases per business operation.

## Examples

### Folder Structure
```
app/
├── UseCases/
│   ├── CreateInvoice.php
│   ├── CancelSubscription.php
│   ├── ProcessRefund.php
│   └── GenerateReport.php
├── DTOs/
│   ├── CreateInvoiceInput.php
│   ├── CreateInvoiceResult.php
│   └── CancelSubscriptionInput.php
└── Domain/
    ├── Invoice.php
    └── Subscription.php
```

### Use Case Implementation
```php
final readonly class CreateInvoice
{
    public function __construct(
        private InvoiceRepository $invoices,
        private CustomerRepository $customers,
        private PricingService $pricing,
    ) {}

    public function execute(CreateInvoiceInput $input): CreateInvoiceResult
    {
        $customer = $this->customers->findOrFail($input->customerId);
        $amount = $this->pricing->calculate($customer, $input->items);

        DB::beginTransaction();
        try {
            $invoice = Invoice::create($customer, $input->items, $amount);
            $this->invoices->save($invoice);
            DB::commit();

            return new CreateInvoiceResult(
                invoiceId: $invoice->id(),
                total: $amount,
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```

### Request Flow
```
HTTP Request → Controller → Input DTO → Use Case → Domain Objects → Repository → Result DTO → Controller → Response
```

## Related Topics

**Prerequisites:**
- Three-Layer Architecture (LAP-01)
- Dependency Rule (LAP-04)
- Domain Layer Design (LAP-05)

**Closely Related:**
- Action Classes (LAP-15) — lighter alternative for single operations
- Service Classes (SLP-01) — alternative orchestration pattern
- DTO Design (LAP-14) — input/output contracts for Use Cases
- Form Request Validation (LAP-12) — validation boundary before Use Cases

**Advanced Follow-Up:**
- Hexagonal Architecture Ports & Adapters (LAP-03)
- CQRS Pattern (CPC-08)
- Event Sourcing (CPC-09)
- Transaction Boundaries (LAP-11)

**Cross-Domain Connections:**
- Domain-Driven Design — Use Cases as Application Services
- Testing — Use Case unit testing without Laravel bootstrap
- Octane Compatibility — stateless Use Case design requirements

## AI Agent Notes

- When asked about controller thinning, recommend Use Case classes as the primary pattern for business operation encapsulation
- Use Cases are the application layer in Clean Architecture — they orchestrate, not implement
- Key decision point: Use Case vs Action class — Use Cases for multi-step orchestration with multiple dependencies; Actions for single isolated operations with few dependencies
- Always suggest creating input/output DTOs before implementing a Use Case — the DTO contract defines the Use Case boundary
- Use Cases naturally become the unit of deployment monitoring — each Use Case can be tracked for success/failure rates
- In team discussions, Use Case classes serve as excellent discussion anchors for "what does the application do?"
