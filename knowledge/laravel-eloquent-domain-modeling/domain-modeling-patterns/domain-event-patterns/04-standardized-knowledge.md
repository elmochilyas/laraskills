# Domain Event Patterns — Standardized Knowledge

## Overview

Domain events capture meaningful business occurrences that have already happened (e.g., OrderPlaced, PaymentReceived). They are dispatched from domain methods when a state change occurs, enabling decoupled side effects (notifications, logging, projections) without inline coupling in the model.

## Key Concepts

- **Past tense naming** — events describe something that already happened (OrderPlaced, not PlaceOrder)
- **Dispatch from domain methods** — events fire from the model method, not the controller
- **Minimal payloads** — prefer IDs over full model instances for queued listeners
- **Decoupled listeners** — each side effect is a separate listener, easily added/removed
- **Queued listeners** — expensive side effects should be queued for performance

## Implementation Details

```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly Carbon $occurredAt = new Carbon(),
    ) {}
}

class Order extends Model
{
    public function place(): void
    {
        if ($this->status !== 'pending') {
            throw new \DomainException('Only pending orders can be placed.');
        }
        $this->status = 'placed';
        $this->save();
        event(new OrderPlaced($this->id));
    }
}
```

## Best Practices

- Dispatch events from domain methods, not from controllers
- Name events in past tense reflecting business terminology
- Keep event payloads minimal — use IDs for queued listeners
- Queue expensive listeners (email, API calls, projections)
- Test that events are dispatched on the correct state changes
