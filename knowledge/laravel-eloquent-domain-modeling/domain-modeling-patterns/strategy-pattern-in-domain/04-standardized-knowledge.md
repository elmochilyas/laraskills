# Strategy Pattern in Domain — Standardized Knowledge

## Overview

The strategy pattern encapsulates interchangeable domain algorithms (pricing, discount, shipping) behind a common interface, selected at runtime based on context. This allows adding new variants without modifying existing code (Open/Closed principle) and keeps each strategy independently testable.

## Key Concepts

- **Strategy interface** — defines the contract with a single method
- **Concrete strategies** — each variant implements the interface independently
- **Selection logic** — determines which strategy to use based on context
- **Open/Closed principle** — add new strategies without changing existing ones
- **Dependency injection** — strategies are injected, not instantiated inline
- **Single responsibility** — each strategy encapsulates one algorithm variant

## Implementation Details

```php
interface ShippingCostStrategy
{
    public function calculate(Order $order): Money;
}

class StandardShippingStrategy implements ShippingCostStrategy { ... }
class ExpressShippingStrategy implements ShippingCostStrategy { ... }
class FreeShippingStrategy implements ShippingCostStrategy { ... }

class ShippingCostCalculator
{
    public function __construct(
        private readonly StandardShippingStrategy $standard,
        private readonly ExpressShippingStrategy $express,
        private readonly FreeShippingStrategy $free,
    ) {}

    public function forOrder(Order $order): ShippingCostStrategy
    {
        return match (true) {
            $order->total->greaterThan(new Money(10000)) => $this->free,
            $order->isExpress() => $this->express,
            default => $this->standard,
        };
    }
}
```

## Best Practices

- Define strategy interfaces with a single, clearly-named method
- Decouple strategy selection from strategy execution
- Inject strategies via DI container, don't instantiate inline
- Test each strategy independently from the selection logic
- Add new strategies by implementing the interface — no existing code changes
