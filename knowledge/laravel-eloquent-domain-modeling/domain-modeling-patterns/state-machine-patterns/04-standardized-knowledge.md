# State Machine Patterns — Standardized Knowledge

## Overview

State machine patterns model an entity's lifecycle by defining all possible states, allowed transitions between them, and the business rules (guards) that govern each transition. This replaces scattered if/else state checks with a declarative transition map that is testable and self-documenting.

## Key Concepts

- **States** — enumerated list of all possible statuses (constants or backed enum)
- **Transitions** — defined pairs of (from → to) that are allowed
- **Guards** — business rules that must pass before a transition is allowed
- **Transition method** — central `transitionTo()` that checks the transition map
- **Shorthand methods** — expressive methods like `confirm()`, `ship()` for common transitions
- **Domain events** — dispatched on each meaningful transition for side effects

## Implementation Details

```php
class Order extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    private const ALLOWED_TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
        self::STATUS_CONFIRMED => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
        self::STATUS_SHIPPED => [self::STATUS_DELIVERED],
        self::STATUS_DELIVERED => [],
        self::STATUS_CANCELLED => [],
    ];

    public function transitionTo(string $newStatus): void
    {
        if (!in_array($newStatus, self::ALLOWED_TRANSITIONS[$this->status] ?? [])) {
            throw new \DomainException("Cannot transition from {$this->status} to $newStatus");
        }
        $this->status = $newStatus;
    }

    public function confirm(): void { $this->transitionTo(self::STATUS_CONFIRMED); }
    public function ship(): void { $this->transitionTo(self::STATUS_SHIPPED); }
}
```

## Best Practices

- Define all states as constants or a backed enum on the model
- Define allowed transitions in a central, readable map
- Throw domain exceptions for invalid transitions
- Add shorthand methods for the most common transitions
- Test every allowed and invalid transition
