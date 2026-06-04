# Domain Service Patterns — Standardized Knowledge

## Overview

Domain services encapsulate business logic that spans multiple unrelated models or involves external domain computations that don't naturally belong to any single entity. They are stateless, receive all data as parameters, and operate at the domain layer.

## Key Concepts

- **Stateless** — no mutable properties, all state is passed as parameters
- **Cross-model logic** — coordinates multiple unrelated models
- **Domain interfaces** — depend on abstractions, not infrastructure
- **Receive, don't fetch** — models are passed in, not fetched internally
- **Pure domain** — no Eloquent queries, HTTP calls, or infrastructure concerns
- **Testable** — easily unit-tested with mocked dependencies

## Implementation Details

```php
interface PricingService
{
    public function calculateTotal(Order $order, Customer $customer): Money;
}

class StandardPricingService implements PricingService
{
    public function __construct(
        private readonly TaxRateProvider $taxRates,
    ) {}

    public function calculateTotal(Order $order, Customer $customer): Money
    {
        $subtotal = $order->items->reduce(fn ($carry, $item) => $carry->add($item->subtotal()), Money::zero());
        $tax = $this->taxRates->rateFor($customer)->applyTo($subtotal);
        return $subtotal->add($tax);
    }
}
```

## Best Practices

- Extract to a domain service only when logic spans multiple models
- Define interfaces for domain services to enable testing and swapping
- Receive models as parameters, do not fetch them internally
- Keep domain services free of Eloquent queries and infrastructure concern
- Inject services via constructor, do not instantiate internally
