# ECC Standardized Knowledge — Domain vs Application Services

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Domain vs Application Services |
| **Difficulty** | Expert |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

The domain vs application service distinction comes from Domain-Driven Design (DDD). **Domain services** contain business logic that doesn't naturally fit on an entity or value object — they operate on domain concepts and encapsulate domain rules. **Application services** orchestrate the flow of data between the HTTP layer and the domain layer — they are the "use cases" that coordinate domain objects and infrastructure.

In Laravel, most "services" are application services: they receive DTOs, call repositories/actions, manage transactions, and return results. Domain services are rarer — they model domain concepts like `PricingService`, `TaxCalculator`, or `FraudDetector` that encapsulate business rules independent of infrastructure.

---

## Core Concepts

### Application Services
- Orchestrate workflow (controller → app service → domain)
- Manage transactions and infrastructure coordination
- Know about DTOs, repositories, and external services
- Contains NO domain logic — only coordination

### Domain Services
- Encapsulate domain logic that doesn't fit on an entity
- Operate on domain objects (entities, value objects)
- Are stateless and side-effect-free
- Know nothing about HTTP, persistence, or infrastructure

---

## When To Use

### Application Services
- Most service classes in a Laravel application
- Orchestrating use cases (place order, register user)
- Coordinating domain services and infrastructure

### Domain Services
- Complex business rules that span multiple entities
- Calculations involving multiple domain objects
- Domain operations that don't naturally belong on an entity

---

## When NOT To Use

- Don't create domain services for simple validation (use Form Requests)
- Don't create application services for CRUD pass-through (use controllers directly)
- Don't force domain services if the logic fits naturally on an entity method

---

## Best Practices

### Keep Application Services Thin
Application services should orchestrate, not implement domain logic.

**Why:** Application services are the "glue" between HTTP and domain. Adding domain logic to them couples infrastructure concerns to business rules.

### Keep Domain Services Pure
Domain services should not depend on infrastructure (repositories, HTTP, cache, queues).

**Why:** Domain services represent business rules. Infrastructure dependencies make them untestable without bootstrapping and violate the domain layer's independence.

### Test Domain Services Without Framework
Domain services should be testable with `new` keyword — no Laravel container needed.

**Why:** Pure domain logic can be tested in microseconds without framework boot. This enables rapid test feedback and true unit testing.

---

## Architecture Guidelines

### Application Service
```php
class PlaceOrderService  // Application service
{
    public function __construct(
        private PricingService $pricing,       // Domain service
        private OrderRepository $orders,       // Infrastructure
        private InventoryService $inventory,   // Application service
    ) {}

    public function execute(Cart $cart): Order
    {
        DB::beginTransaction();
        $total = $this->pricing->calculateTotal($cart);   // Domain logic
        $order = $this->orders->create($cart, $total);    // Persistence
        $this->inventory->reserve($cart->items);          // Coordination
        DB::commit();
        return $order;
    }
}
```

### Domain Service
```php
class PricingService  // Domain service — pure business logic
{
    public function calculateTotal(Cart $cart): Money
    {
        $subtotal = $cart->items->reduce(fn($sum, $item) =>
            $sum + $item->product->price->multiply($item->quantity)
        );

        $discount = $this->calculateBulkDiscount($cart);
        $tax = $this->calculateTax($subtotal);

        return $subtotal->subtract($discount)->add($tax);
    }

    private function calculateBulkDiscount(Cart $cart): Money { /* ... */ }
    private function calculateTax(Money $subtotal): Money { /* ... */ }
}
```

---

## Common Mistakes

### Mixing Responsibilities
Desc: Application service that also implements domain rules.
Cause: Convenience — putting everything in one class.
Consequence: Domain logic is coupled to infrastructure; cannot be tested without framework.
Better: Separate domain services from application services.

### Domain Service Reaching for Infrastructure
Desc: Domain service calling repositories or external APIs.
Cause: Not recognizing that the logic belongs in application layer.
Consequence: Domain layer has infrastructure dependencies; violates DDD layering.
Better: Application service calls repository, passes result to domain service.

### No Domain Services (All Logic in App Services)
Desc: Every service is an application service; domain logic is embedded.
Cause: Not understanding the DDD distinction.
Consequence: Business rules are coupled to framework and infrastructure.
Better: Extract pure business logic to domain services.

---

## Anti-Patterns

### Infrastructure in Domain
Domain services that depend on Eloquent, cache, or HTTP clients. This couples business rules to framework specifics and makes testing slow.

### CRUD Domain Services
Creating domain services that just delegate to repositories. If the service has no business logic, it's not a domain service — it's unnecessary abstraction.

---

## Examples

### Domain Service (Pure Logic)
```php
class ShippingCostCalculator
{
    public function calculate(Package $package, Address $destination): Money
    {
        $baseRate = $this->getBaseRate($destination->zone);
        $weightSurcharge = $package->weight->multiply(0.5);
        return $baseRate->add($weightSurcharge);
    }
}
```

### Application Service (Orchestration)
```php
class CheckoutService
{
    public function __construct(
        private ShippingCostCalculator $shipping,  // domain
        private OrderRepository $orders,            // infrastructure
        private PaymentGateway $gateway,            // infrastructure
    ) {}

    public function checkout(Cart $cart, Address $shippingAddress): Order
    {
        $shippingCost = $this->shipping->calculate($cart->package, $shippingAddress);
        $payment = $this->gateway->charge($cart->total->add($shippingCost));
        return $this->orders->create($cart, $shippingCost, $payment);
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Foundation for both types
- **Service Orchestration** — Application service coordination

### Closely Related
- **Service vs Action Decision** — Choosing the right pattern
- **DTOs** — Application service data contracts

### Cross-Domain
- **Eloquent & Domain Modeling** — Domain entity and value object design

---

## AI Agent Notes

### Important Decisions
- Application services orchestrate; domain services compute
- Domain services are pure business logic (no infrastructure)
- Application services coordinate infrastructure (repositories, gateways)
- In most Laravel apps, 80%+ of services are application services

### Important Constraints
- Domain services must NOT depend on Laravel framework
- Application services SHOULD use Laravel (container, DB, cache)
- Domain services can be tested with `new` keyword
- Application services need framework boot or mocked dependencies

---

## Verification

This document has been validated against:
- Domain-Driven Design (Eric Evans) service definitions
- Laravel DDD implementation patterns
- Production service architecture patterns
