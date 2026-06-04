# Domain Services

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Domain services encapsulate domain logic that doesn't naturally fit within a single entity or aggregate root. They are stateless operations that coordinate multiple domain objects, enforce cross-aggregate rules, or interact with external systems through the domain lens. In Laravel, domain services sit between controllers/repositories and models, keeping business logic out of HTTP-centric classes. This KU covers when to use domain services, how to design them, and how they differ from other service patterns in Laravel.

## Core Concepts
- **Domain Service:** A stateless PHP class that performs an operation that doesn't belong on a model or value object.
- **Statelessness:** Domain services hold no state of their own; they operate on domain objects passed to them.
- **Coordination Role:** Domain services orchestrate multiple aggregates or entities to complete a business operation.
- **Domain Logic, Not Infrastructure:** A domain service contains business rules, not HTTP calls, database queries, or file I/O.
- **Application Service vs Domain Service:** Application services handle infrastructure concerns (transactions, authorization); domain services handle pure domain logic.

## Mental Models
- **"The Service Does What No Model Can":** If a natural-language description of an operation involves multiple objects working together, it belongs in a service.
- **"Service as Process, Model as Thing":** Models are things (Order, Invoice, User). Services are processes (PlaceOrder, TransferFunds, CalculateShipping).
- **"The Verb Category":** If you're trying to name something and it's a verb phrase, it's likely a service. "Refund order" is a service; "Order" is a model.

## Internal Mechanics
A domain service is a plain PHP class — no base class required:

```php
class OrderFulfillmentService
{
    public function __construct(
        private InventoryService $inventory,
        private ShipmentService $shipping
    ) {}

    public function fulfill(Order $order): void
    {
        foreach ($order->items as $item) {
            $this->inventory->reserve($item->product, $item->quantity);
        }
        $order->markAsFulfilled();
        $this->shipping->createShipment($order);
    }
}
```

Services are typically:
- Registered in the container for dependency injection
- Injected into controllers, commands, or other services
- Tested with mocked dependencies

## Patterns
- **Single Action Services:** A service class with one public method (e.g., `handle()`, `execute()`). Inspired by command pattern.
- **Service Interface:** Define a contract interface for the service, allowing multiple implementations or easy mocking.
- **Factory Services:** Services that create complex aggregates with proper initialization.
- **Domain Service + Application Service Split:** Thin application service handles auth/transactions, delegates to domain service for business logic.
- **Service Result Object:** Return a value object from the service with success status, messages, and modified objects, rather than throwing exceptions for business rule violations.

## Architectural Decisions
- Service boundaries: one large service vs many single-action services
- Whether services can call repositories directly or receive prepared models
- How services handle transactions — internal management or caller responsibility
- Whether to use interfaces for every service or concrete classes directly
- Error handling: exceptions vs result objects vs event-driven failure

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Keeps models focused on data and behavior | Additional classes per domain operation | Balanced by clarity and testability |
| Encapsulates complex orchestration logic | Services can become dumping grounds | Keep services focused; one purpose per method |
| Easy to test in isolation | May duplicate model logic if boundaries are unclear | Review: is this logic better on a model? |
| Supports dependency injection naturally | Services can grow large | Extract related operations into separate services |
| Clear separation of infrastructure vs domain | Over-service-ization of simple operations | Don't create services for single-model CRUD |

## Performance Considerations
- Domain services are stateless; no overhead from state management.
- Each service method call adds one PHP method call to the stack; negligible.
- Services that call multiple repositories should use eager-loaded models to avoid N+1.
- Service orchestration across aggregates introduces transactional considerations; be mindful of lock duration.

## Production Considerations
- Monitor service method execution times separately from request times.
- Log service method entries and exits with input parameters (sanitized) for debugging.
- Write integration tests for domain services that cover real database interactions.
- Services should throw domain-specific exceptions that controllers can catch and render.
- Ensure idempotency in service methods that could be retried (e.g., due to queue job failures).

## Common Mistakes
- Making services that are just `public function __invoke($data) { Model::create($data); }` — this is a CRUD wrapper, not a domain service
- Mixing infrastructure concerns (HTTP requests, file storage) into domain services
- Creating a single `OrderService` with 20 methods instead of focused single-purpose services
- Passing request objects or DTOs from controllers into domain services (domain services should receive domain objects)
- Using services as an escape hatch from thinking about model design (logic that should be on a model ends up in a service)

## Failure Modes
- **Anemic Service:** A service that does nothing but call model methods. Remove it; put the logic on the model or in the controller.
- **God Service:** A service with too many responsibilities. Split by domain operation or aggregate.
- **Service Chain Overload:** A service calls another service that calls another service, creating deep call chains. Services should coordinate domain objects, not other services.
- **Lost Transaction Context:** A service that creates a transaction but then calls another service that also creates a transaction, causing nested transaction complexity. Manage transactions at the application service level.

## Ecosystem Usage
- `lorisleiva/laravel-actions` formalizes single-action services as action classes
- `spatie/laravel-beyond-crud` uses job/action pattern (services in all but name)
- `app/Actions/` directory is common in modern Laravel apps for single-action services
- Service pattern is intrinsic to Laravel: `MailService`, `NotificationService`, etc.
- Domain services are less common in Laravel than in Java/.NET DDD; community adoption growing

## Related Knowledge Units

### Prerequisites
- active-record-domain-layer — domain entities as Eloquent models
- domain-methods-on-models — behavior encapsulation on models
- Laravel Service Container & Dependency Injection — resolving and injecting dependencies

### Related Topics
- domain-repositories
- aggregate-roots
- domain-methods-on-models

### Advanced Follow-up Topics
- aggregate-boundaries
- bounded-contexts

## Research Notes
- Evans: *Domain-Driven Design* (2003), Chapter 5 — "Services" as pure domain concepts
- Fowler: *Patterns of Enterprise Application Architecture* (2002) — Service Layer pattern
- Laravel docs: Service Container and Service Providers (infrastructure focus)
- Community: Domain services vs action classes — same concept, different naming conventions
- Emerging pattern: single-action classes (`Invokable` classes) for domain services in Laravel
