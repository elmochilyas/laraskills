# When to Use Actions

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | When to Use Actions |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Action classes (service/use-case classes) house cross-aggregate operations that span multiple models or external systems. They replace fat controller logic with a dedicated, testable, single-responsibility class. The decision to extract an action hinges on whether the operation coordinates multiple domain objects, manages a transaction boundary, or orchestrates infrastructure side-effects.

## Core Concepts

- **Action class**: A stateless, invocable PHP class encapsulating a single use-case operation
- **Cross-aggregate operation**: An operation touching more than one aggregate root (e.g., placing an order deducts inventory and creates a shipment)
- **Within-aggregate logic**: Pure model methods operating on one aggregate's own state
- **Transaction boundary**: The scope across which database transactions must be atomic
- **Orchestration vs. implementation**: Actions orchestrate; models implement domain logic

## When To Use

- The operation coordinates two or more aggregates
- The operation must succeed or fail atomically across multiple models
- You need to conditionally call different model methods based on business rules not belonging to any single model
- The operation involves external side-effects (email, queue, API call)
- You want a clear, named, testable entry point for a use case

## When NOT To Use

- The method only reads or mutates a single model's own state without coordination (use a model method)
- The operation is trivial CRUD (3 lines in a controller)
- The only purpose is to make the controller thin — abstraction without orchestration

## Best Practices

- **Actions orchestrate, models implement**: An action coordinates model methods; it does not contain raw query logic or domain rules. Push domain logic down to models. If an action contains `where()` or `save()` calls, that logic probably belongs on a model.
- **One action per use case**: Each action has exactly one reason to change. This prevents god classes and keeps actions testable. If an action grows beyond 100 lines, extract sub-operations into child actions or model methods.
- **Actions are stateless**: An action holds no mutable state between invocations. Storing state on `$this->property` between calls creates cross-request contamination and makes the action non-reusable.
- **Keep HTTP concerns out of actions**: Actions should never receive `Request` objects or return `Response`/`RedirectResponse`. They receive validated DTOs and return typed results or void.

## Architecture Guidelines

- Place actions in `App\Actions\{Domain}\{UseCase}Action.php`
- Actions receive validated data (DTO or model), never raw request input
- Actions do not extend a base class unless necessary
- Wrap cross-aggregate operations in `DB::transaction()`
- Queue slow actions instead of running synchronously

## Performance Considerations

- Action classes add negligible overhead — plain PHP objects resolved once from the container
- Chained model calls can cause N+1 queries if lazy-loading is triggered; eager-load before entering the action
- `DB::transaction()` wrapping is safe for moderate operations; very long-running actions should chunk or queue

## Security Considerations

- Authorization gates should be checked inside the action or as middleware before the action
- Actions should never receive raw request input — always validate with FormRequest first
- Log action entry/exit with correlation IDs for audit trail

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Raw query logic in actions | Convenience | Domain logic in wrong layer | Push queries to model methods/scopes |
| Actions too granular or too coarse | No clear sizing rule | Either file explosion or god actions | One action per use case, 100 line target |
| Mixing validation, auth, orchestration | Fat action syndrome | Multiple responsibilities | Validate in FormRequest, auth in middleware/gate |
| Returning `$this` for chaining | Query builder habit | Mutable return pattern | Return immutable result objects |
| Actions for simple CRUD | Over-engineering | File per 3-line operation | Use controller or model method |

## Anti-Patterns

- **Anemic Action Pattern**: Actions contain all logic; models become property bags. Enforce code review and static analysis to push logic to models.
- **Orchestration Sprawl**: Single action grows to 200+ lines. Extract sub-operations into child actions or private methods.
- **Action-as-Controller**: Actions contain HTTP concerns (response format, status codes). Keep HTTP in controllers; actions stay framework-agnostic.
- **Missing Transaction Scope**: Partial writes when action fails mid-way. Always wrap in `DB::transaction()`.

## Examples

```php
class PlaceOrderAction
{
    public function __construct(
        private GenerateShipmentAction $generateShipment,
    ) {}

    public function __invoke(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->markAsPlaced();
            $this->generateShipment->forOrder($order);
            Inventory::deductForOrder($order);
        });
    }
}

// Thin controller
class OrderController
{
    public function __construct(private PlaceOrderAction $placeOrder) {}

    public function place(PlaceOrderRequest $request, Order $order)
    {
        $this->placeOrder->__invoke($order);
        return redirect()->route('orders.show', $order);
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Design |
| Prerequisite | Domain Modeling Patterns |
| Closely Related | When Models Are Enough |
| Closely Related | Action Class Patterns |
| Closely Related | When Repositories Help |
| Closely Related | Write Model Separation |

## AI Agent Notes

- Action contains zero raw database queries (delegated to models)
- Action contains zero HTTP concerns (no Request, no Response)
- Action is testable with `$this->partialMock()` or real model factories
- Action has a single reason to change (the use-case rule itself)

## Verification

- [ ] Action contains zero raw database queries (delegated to models)
- [ ] Action contains zero HTTP concerns (no Request, no Response)
- [ ] Action is testable with `$this->partialMock()` or real model factories
- [ ] Action's public method signature accepts validated data (DTO or model)
- [ ] Action has a single reason to change (the use-case rule itself)
