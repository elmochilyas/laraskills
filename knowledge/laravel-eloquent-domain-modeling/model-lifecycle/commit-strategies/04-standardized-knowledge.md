# Commit Strategies

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Commit Strategies |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Commit strategies control when events and broadcasts are dispatched in relation to database transactions. Laravel provides `afterCommit()` for dispatches and `BroadcastsEventsAfterCommit` for broadcasts. These ensure side effects only occur if the transaction succeeds, preventing inconsistent state.

## Core Concepts

- **afterCommit()**: Defers event/job dispatch until after the database transaction commits
- **dispatchAfterCommit()**: `dispatch(new Job())->afterCommit()` — queues after commit
- **BroadcastsEventsAfterCommit**: Model broadcast trait that only broadcasts on successful commit
- **Transactional consistency**: Side effects that depend on data should only fire if the data is persisted

## When To Use

- Dispatching events that trigger side effects depending on the persisted data
- Broadcasting model state to clients after the data is committed
- Sending notifications that reference the saved model

## When NOT To Use

- The side effect should happen regardless of the transaction outcome
- The operation doesn't use transactions (single query)
- The event listener can handle missing data gracefully

## Best Practices

- **Default to after-commit for domain events**: If a domain event triggers projections, notifications, or external API calls, dispatch it after the transaction commits. This prevents the side effect from firing when the transaction rolls back.
- **Use `afterCommit()` on job dispatch**: `dispatch((new ProcessOrder($order))->afterCommit())` ensures the job only runs if the data is persisted.
- **Use `BroadcastsEventsAfterCommit` over `BroadcastsEvents`**: The "after commit" variant prevents broadcasting stale or rolled-back data.

## Architecture Guidelines

- Domain events dispatched from model methods should use `dispatch()->afterCommit()`
- Model broadcast trait should be `BroadcastsEventsAfterCommit`
- Listeners that read the persisted model should use after-commit dispatch

## Examples

```php
class Order extends Model
{
    public function place(): void
    {
        DB::transaction(function () {
            $this->status = 'placed';
            $this->save();

            // Dispatch after transaction commits
            dispatch(new ProcessOrder($this->id))->afterCommit();
        });
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Control / Quiet Operations |
| Closely Related | Model Broadcasting |
| Closely Related | Dispatching Domain Events |
| Cross-Domain | Async & Distributed Systems |

## AI Agent Notes

- Use `afterCommit()` for event/job dispatch dependent on persisted data
- Use `BroadcastsEventsAfterCommit` for model broadcasts
- Prevents side effects from firing on rolled-back transactions

## Verification

- [ ] Domain events use `afterCommit()` or are dispatched after transaction
- [ ] Model broadcasts use `BroadcastsEventsAfterCommit`
- [ ] Side effects don't fire on failed/rolled-back transactions
