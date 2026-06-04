# Write Model Separation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Write Model Separation |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Write model separation isolates persistence logic for mutations from the rest of the application. While read models focus on query optimization, write models focus on consistency, validation, and business rule enforcement. In Laravel, this means creating dedicated classes (command handlers, write-only repositories, or write-only models) that handle state changes. This prevents accidental reads through write paths and keeps the write side optimized for transactional integrity.

## Core Concepts

- **Write Model**: The part of the domain model that handles state changes, enforcing invariants and business rules
- **Command Handler**: An action-like class that receives a command DTO and executes a write operation
- **Write-Optimized Persistence**: Storage strategy optimized for writes (normalized tables, minimal indexes, no denormalization)
- **Transactional Consistency**: Ensuring the write model's state transitions are atomic and consistent
- **Command Bus**: A dispatcher that routes commands to their handlers (Laravel's Bus is the natural fit)

## When To Use

- Write operations have complex transactional requirements
- You want explicit, named operations for every state change
- The write model uses event sourcing but reads need traditional queries
- Write performance and read performance have conflicting optimization strategies
- You need command auditing and replay capabilities

## When NOT To Use

- The application is CRUD-dominant with minimal business rules
- The write path is simple (single model save) with no complex invariants
- The overhead of command/handler pairs is not justified by the complexity

## Best Practices

- **Push invariants to the model, not the handler**: A command handler should orchestrate, not implement business rules. If the handler contains `if` statements about domain state, that logic probably belongs in the model.
- **Use optimistic concurrency for write models**: Add a version column and use `Model::where('version', $expectedVersion)` for updates. This prevents lost updates when two requests modify the same aggregate concurrently.
- **Design command handlers to be idempotent**: The same command executed twice should produce the same result. Use idempotency keys (stored in a separate table) to detect and skip duplicates.
- **Never read from the write model in the same request that writes**: Use the returned model or refresh. Reading immediately after writing can return stale data if the transaction hasn't committed.
- **Wrap handlers in transactions**: Partial writes when a handler fails mid-way leave data in an inconsistent state. `DB::transaction()` ensures atomicity.

## Architecture Guidelines

- Command DTOs in `App\Commands\{Domain}\*Command.php`
- Handlers in `App\Handlers\{Domain}\*Handler.php`
- Write models should not have public query methods (finders, scopes) — those belong on read models
- Command handlers return `void` or a simple success signal — not data designed for display
- Use Laravel's Bus for command dispatch: `$this->bus->dispatch(new CancelOrderCommand(...))`

## Performance Considerations

- Write models should avoid expensive JOINs and denormalized queries (those belong in reads)
- Command handlers are ideal for queue dispatch — write-heavy operations can be async
- Optimistic concurrency adds a version-check query per write — negligible for most applications
- Event-sourced write models append only — significantly faster than UPDATE-heavy workloads

## Security Considerations

- Log every command with its input, timestamp, and user for audit trail
- Command validation happens in the handler or a dedicated validator; never trust the client
- Use `Model::lockForUpdate()` for pessimistic locking on high-value transactions (financial operations)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Reading from write model after write | Convenience | Stale data if uncommitted | Use returned model or refresh |
| Query logic in write models | Misunderstanding separation | Write path handles read concerns | Put queries on read models |
| Anemic write models | All validation in handler | Models are property bags | Push invariants to the model |
| Write model for reporting | Simplicity | Report queries slow on normalized tables | Hit read models or reporting DB |
| No command rejection handling | Oversight | Unclear error paths | Return typed result or throw domain exception |

## Anti-Patterns

- **Write Model Anemia**: All logic in the handler, model is just a property bag. Push invariants to the model.
- **Command Explosion**: 100+ command classes for simple CRUD. Use model methods for simple mutations; commands for complex transactions.
- **Stale Write Model**: Handler loads model, another request modifies it, first handler overwrites. Use optimistic concurrency with version column.
- **Partial Command**: Handler saves some state but fails before completing. Always wrap command handlers in transactions.

## Examples

```php
// Command DTO
class CancelOrderCommand
{
    public function __construct(
        public readonly int $orderId,
        public readonly string $reason,
        public readonly bool $refundImmediately = false,
    ) {}
}

// Command Handler
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        DB::transaction(function () use ($command) {
            $order = Order::lockForUpdate()->findOrFail($command->orderId);

            if (! $order->canBeCancelled()) {
                throw new OrderCannotBeCancelled($order);
            }

            $order->cancel($command->reason);
            $order->save();

            if ($command->refundImmediately) {
                $this->processRefund->handle(new ProcessRefundCommand($order->id));
            }
        });
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | Read Model Separation |
| Closely Related | Action Class Patterns |
| Closely Related | Ports and Adapters |
| Closely Related | Eloquent as Adapter |

## AI Agent Notes

- Every state mutation should go through a command handler
- Command handlers are transactional (all-or-nothing writes)
- Command handlers return `void` or a simple success signal
- Write models do not have public query methods (finders, scopes)
- Command handlers are testable with known initial state → asserted final state

## Verification

- [ ] Every state mutation goes through a command handler
- [ ] Command handlers are transactional (all-or-nothing writes)
- [ ] Command handlers do not return data designed for display (return `void` or simple success signal)
- [ ] Write models do not have public query methods (finders, scopes)
- [ ] Command handlers are testable with known initial state and asserted final state
