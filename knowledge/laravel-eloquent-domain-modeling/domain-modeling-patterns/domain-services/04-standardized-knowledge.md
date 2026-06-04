# Domain Services

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Services |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Domain services encapsulate domain logic that doesn't naturally fit within a single entity or aggregate root. They are stateless operations coordinating multiple domain objects, enforcing cross-aggregate rules, or interacting with external systems through the domain lens. In Laravel, domain services sit between controllers and models, keeping business logic out of HTTP-centric classes.

## Core Concepts

- **Domain Service**: A stateless PHP class performing an operation that doesn't belong on a model or value object
- **Statelessness**: Services hold no state — they operate on domain objects passed to them
- **Coordination Role**: Services orchestrate multiple aggregates to complete a business operation
- **Domain Logic, Not Infrastructure**: Services contain business rules, not HTTP calls or database queries
- **Application Service vs Domain Service**: Application services handle infrastructure concerns; domain services handle pure logic

## When To Use

- A calculation or process involves multiple domain objects (pricing, shipping cost, fraud detection)
- A business rule spans multiple aggregate roots
- The operation doesn't have a natural home on any single entity
- The same domain logic would be duplicated across multiple models

## When NOT To Use

- The logic fits naturally on a single entity (use a model method)
- The operation is purely infrastructure (send email, write log)
- The service would have no domain logic — just delegating to repositories

## Best Practices

- **Name services as verbs**: `OrderFulfillmentService`, `PricingCalculator`, `FraudDetectionService`. The name describes the process, not the thing.
- **Inject domain interfaces, not concrete implementations**: A domain service depends on repository interfaces, not Eloquent models. This keeps the service testable and domain-pure.
- **One service per process**: A service should have a single responsibility. If you need to calculate pricing, it's `PricingCalculator`. If you also need to validate addresses, create a separate `AddressValidationService`.

## Architecture Guidelines

- Domain services are plain PHP classes — no base class or framework inheritance
- They are stateless — all state lives in the domain objects they receive
- They use constructor injection for domain interfaces (repositories, other services)
- They return domain objects or primitives, never HTTP responses

## Performance Considerations

- Domain services add one method call layer — negligible overhead
- Services that query multiple repositories may trigger N+1 — ensure eager loading
- Expensive services (fraud detection, complex calculations) should consider caching

## Examples

```php
class OrderFulfillmentService
{
    public function __construct(
        private InventoryService $inventory,
        private ShippingCostCalculator $shipping,
    ) {}

    public function fulfill(Order $order): Shipment
    {
        $this->inventory->reserve($order->items);
        $cost = $this->shipping->calculate($order);
        $order->applyShippingCost($cost);
        return Shipment::createFromOrder($order);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Aggregate Roots |
| Prerequisite | Domain Methods on Models |
| Closely Related | Aggregate Boundaries |
| Closely Related | Domain Repositories |
| Cross-Domain | Architectural Decisions |

## AI Agent Notes

- Name services as verbs describing the process
- Inject domain interfaces, not concrete implementations
- Keep services stateless and single-responsibility

## Verification

- [ ] Service name describes the process (verb)
- [ ] Service is stateless — no mutable properties
- [ ] Service depends on interfaces, not concrete implementations
- [ ] Service contains domain logic, not infrastructure concerns
