# Domain Methods on Models

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Methods on Models |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Domain methods transform anemic Eloquent models into expressive domain objects by naming behavior in the ubiquitous language. Instead of `$order->update(['status' => 'paid'])`, domain methods enable `$order->markAsPaid()`. This captures domain intent, centralizes business rules, and provides a single point for invariant enforcement.

## Core Concepts

- **Behavior Method**: A public method encapsulating a domain operation (e.g., `publish()`, `archive()`, `refund()`)
- **Ubiquitous Language**: Domain terminology used consistently in code and conversations
- **Command-Query Separation**: Methods either return data (queries) or mutate state (commands), rarely both
- **Self-Encapsulation**: Methods access own state through accessors/mutators, preserving invariants

## When To Use

- The operation expresses a domain concept (markAsPaid, cancel, approve)
- The method only accesses `$this` attributes and owned relationships
- The same domain logic would be duplicated across controllers/actions

## When NOT To Use

- The operation spans multiple aggregates (use an action class)
- The method requires external side effects (email, API calls)
- The method would exceed reasonable complexity for a single model

## Best Practices

- **Use ubiquitous language**: Name methods using terms stakeholders understand. `$invoice->send()` not `$invoice->updateStatus('sent')`. The name tells the business story.
- **Guard at the gate**: Check preconditions at the method entry. If the invoice is already paid, `markAsPaid()` should throw or no-op. This prevents invalid state transitions.
- **One method, one responsibility**: Each domain method does one thing. `markAsPaid()` sets the status and timestamp; it doesn't send receipts or log activity (those belong in events or actions).

## Architecture Guidelines

- Domain methods are public, named in ubiquitous language
- They call `$this->save()` internally after state changes
- They throw domain-specific exceptions on invariant violation
- They do not call external services, dispatch jobs, or send emails

## Performance Considerations

- Domain methods add no overhead — they are standard PHP method calls
- Each method typically calls `save()` once — batch when updating multiple attributes
- Avoid expensive operations inside domain methods (defer to events or actions)

## Examples

```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        if ($this->status === 'paid') {
            throw new \DomainException('Invoice is already paid.');
        }
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }

    public function isOverdue(): bool
    {
        return $this->status === 'sent' && $this->due_at->isPast();
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Closely Related | Active Record as Domain Layer |
| Closely Related | Aggregate Boundaries |
| Closely Related | When Models Are Enough |

## AI Agent Notes

- Name methods in ubiquitous language (business terms)
- Guard preconditions at method entry
- No external side effects in domain methods

## Verification

- [ ] Domain method is named in ubiquitous language
- [ ] Method checks preconditions and throws on violation
- [ ] Method does not call external services or dispatch jobs
- [ ] Method has single responsibility
