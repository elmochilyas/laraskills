# ECC Standardized Knowledge — Action Composition

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Action Composition |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Action composition is the practice of building complex business workflows by composing multiple action classes together. A composed action (or coordinator) calls several sub-actions in sequence, each responsible for a single operation. This creates a hierarchy of testable, reusable units — the composed action coordinates, the sub-actions execute. The principle mirrors function composition in functional programming: complex behavior emerges from simple, composable parts.

## Core Concepts

- **Coordinator Action**: A composed action that calls sub-actions. Its responsibility is sequencing and error handling — not the individual operation logic.
- **Pipeline Composition**: Actions execute in sequence, passing results forward. Each action receives the output of the previous step as input.
- **Sequential Composition**: Steps execute in order. Failure at step 3 may require compensating actions for steps 1-2.
- **Conditional Composition**: Sub-actions execute only when conditions are met.
- **Loop Composition**: A sub-action is called iteratively over a collection, with results aggregated.

## When To Use

- Complex workflows composed of multiple discrete business operations
- When sub-actions are independently useful and reused across workflows
- When the coordination logic (sequencing, error handling) is separate from operation logic
- When the workflow needs to be tested at both the unit level (sub-actions) and integration level (coordinator)

## When NOT To Use

- Simple operations that fit in a single action class
- When sub-actions only exist for one coordinator and are never reused independently
- Workflows deeper than 3-4 levels (consider a service or state machine instead)
- When the composition relies on shared mutable state between actions

## Best Practices

- Limit composition depth to 3-4 levels maximum
- Pass context through method parameters, not through shared mutable state
- Add logging at the coordinator level to trace workflow execution
- Test coordinators by mocking sub-actions and verifying call sequence
- Use transactions at the coordinator level to roll back partial work on failure
- Each sub-action must be independently testable and callable

## Architecture Guidelines

- The coordinator's constructor declares all sub-actions it calls — the container resolves the entire dependency tree
- Sub-actions handle errors within their own scope (validation, business rule violations); the coordinator handles workflow-level errors
- A coordinator doing sub-action work (instead of delegating) violates the pattern — extract distinct operations to their own action classes
- Consider extracting to a service when composition exceeds 3-4 levels

## Performance Considerations

- Each composed sub-action adds a container resolution + method call overhead (~0.01ms)
- For a workflow with 5 sub-actions: ~0.05ms total overhead
- Database operations within each sub-action dominate performance — composition overhead is irrelevant
- The container resolves each leaf dependency once and shares instances where possible

## Security Considerations

- Ensure the coordinator passes the authenticated actor explicitly to sub-actions that need authorization
- Transaction rollback at the coordinator level prevents partial writes that could leave sensitive data in an inconsistent state
- Logging at the coordinator level must not leak sensitive DTO data in workflow traces

## Common Mistakes

- **Coordinator Doing Sub-Action Work**: The coordinator contains logic that belongs in a sub-action. Solution: Extract every distinct operation to its own action class.
- **Shared Mutable State Between Actions**: Using a shared context object or class property. Solution: Pass data explicitly through method parameters and return values.
- **Ignoring Error Handling at Composition Level**: Assuming sub-actions always succeed. Solution: Use transactions in the coordinator or add compensating actions.
- **Composition Without Reusability**: Sub-actions written specifically for one coordinator. Solution: Each sub-action should be independently testable and callable.

## Anti-Patterns

- **Deep Composition Without Error Recovery**: A 6-level composition where failure in step 5 leaves steps 1-4 committed with no rollback.
- **Coordinator as God Class**: The coordinator contains business logic, validation, and error handling instead of delegating to sub-actions.
- **Implicit Context Passing**: Using `$this->context` or properties to pass data between composed actions, creating hidden coupling.

## Examples

### Sequential Composition
```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        $cart = $this->validateCart->execute($dto->cartId);
        $reservation = $this->reserveInventory->execute($cart);
        $payment = $this->processPayment->execute($dto->payment, $cart->total);
        $order = $this->createOrder->execute($cart, $payment);
        $this->sendConfirmation->execute($order);
        return $order;
    }
}
```

### Conditional Composition
```php
class UpdateOrderAction
{
    public function execute(UpdateOrderDto $dto): Order
    {
        $order = $this->findOrder->execute($dto->orderId);
        $order = $this->updateOrder->execute($order, $dto);
        if ($dto->shouldNotify) {
            $this->notifyCustomer->execute($order);
        }
        return $order;
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Action Class Design | Single action class patterns | Prerequisite |
| Service Container | Dependency resolution for composed actions | Prerequisite |
| Transactional Actions | Transaction boundaries in composed workflows | Related |
| Service Orchestration | Service-level coordination alternative | Related |
| Saga Pattern | Long-running transaction composition | Follow-up |
| Pipeline Pattern | Middleware-style action processing | Follow-up |

## AI Agent Notes

- Action composition is the primary mechanism for building complex workflows from simple, testable units
- The key discipline is ensuring each sub-action is independently useful — if the only caller of a sub-action is the coordinator, reconsider whether the sub-action justifies its own class
- Composition depth beyond 3-4 levels is a strong signal to model the workflow as a service or state machine
- Coordinators should be tested with mocked sub-actions; sub-actions should be tested in isolation

## Verification

- [ ] Coordinator delegates to sub-actions, not inline business logic
- [ ] Each sub-action is independently testable without the coordinator
- [ ] Composition depth is 3-4 levels or fewer
- [ ] Context is passed through method parameters, not shared mutable state
- [ ] Error handling exists at the coordinator level for partial failure recovery
- [ ] Logging or tracing is present at coordinator level
- [ ] Sub-actions are reusable across multiple coordinators or entry points
