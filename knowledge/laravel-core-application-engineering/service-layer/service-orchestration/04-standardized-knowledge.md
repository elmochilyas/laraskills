# ECC Standardized Knowledge — Service Orchestration

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Service Orchestration |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Service orchestration is the coordination of multiple business operations into a single workflow. The service method acts as the conductor — calling multiple actions, managing transaction boundaries handling errors, and aggregating results. Orchestration is the primary reason services exist: they group related operations and coordinate complex workflows.

The key design decision is what level of orchestration belongs in the service vs what belongs in individual actions. The rule: services orchestrate, actions execute. Services know about the workflow; actions know about the individual operation.

---

## Core Concepts

### Orchestration vs Execution
Services orchestrate the workflow (call order, transaction boundary, error recovery). Actions execute individual operations.

### Action Composition via Services
Services call multiple actions in sequence, passing results from one to the next.

### Error Handling
Services handle workflow-level errors: rolling back transactions, logging failures, sending notifications.

### Result Aggregation
Services collect results from multiple operations and return a cohesive response.

---

## When To Use

- Multi-step workflows (place order → reserve inventory → charge payment)
- Operations that need coordination across multiple actions
- Workflows requiring transaction management
- Processes with conditional branching

---

## When NOT To Use

- Single-step operations (use an action directly)
- Operations that don't need coordination
- Simple CRUD pass-through

---

## Best Practices

### Services Orchestrate, Actions Execute
Services compose actions; actions do not compose services.

**Why:** Action → service creates circular dependencies and violates the layering. The service layer is the orchestrator, not the executed.

### Keep Orchestration Methods Focused
Each orchestration method should coordinate one workflow — not multiple unrelated workflows in a single method.

**Why:** Focused orchestration methods are testable, readable, and maintainable. Multi-workflow methods violate single responsibility.

### Handle Transactions at the Orchestration Level
Wrap orchestration in `DB::transaction()` at the service level.

**Why:** The service knows the workflow boundary. Individual actions should not manage transactions — they should be composed within a transaction by the service.

### Return Aggregated Results
Return a result object or DTO containing all relevant output from the orchestrated operations.

**Why:** Aggregated results provide a single response contract for the caller. Callers don't need to call multiple methods to get the full result.

---

## Architecture Guidelines

### Orchestration Flow
```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->chargePayment->handle($data->payment);
            $order = $this->createOrder->handle($data, $payment);

            return new OrderResult($order, $payment, $inventory);
        });
    }
}
```

### Orchestration vs Execution
```
Service method (orchestrates)
  → calls Action A (executes)
  → calls Action B (executes)
  → calls Action C (executes)
  → returns aggregated result
```

---

## Common Mistakes

### Orchestration in Controllers
Desc: Controller calling multiple services/actions and managing the workflow.
Cause: Convenience — the controller has all the data.
Consequence: Business orchestration coupled to HTTP; cannot be reused.
Better: Move orchestration to a service method.

### Actions Orchestrating Actions
Desc: An action calling other actions without a service coordinator.
Cause: Action composition done at the wrong layer.
Consequence: Action becomes an orchestrator, violating single responsibility.
Better: Use a service for orchestration; actions for execution.

### Missing Transaction Boundaries
Desc: Orchestration without `DB::transaction()`.
Cause: Not considering failure scenarios.
Consequence: Partial writes on failure (inventory reserved but payment not charged).
Better: Wrap orchestration in a database transaction.

---

## Anti-Patterns

### Orchestration in Every Service Method
Every service method is a multi-step workflow. Most operations are single-step. Only use orchestration when multiple actions need coordination.

### Over-Orchestration
Coordinating operations that don't need coordination. If the operations are independent, let the controller call them separately.

---

## Examples

### Order Placement Orchestration
```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->chargePayment->handle($data->paymentInfo);
            $order = $this->createOrder->handle($data->customerId, $data->items, $payment);

            $this->sendConfirmation->handle($order);

            return new OrderResult($order, $payment, $inventory);
        });
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Foundation for orchestration
- **Action Composition** — How actions call other actions

### Closely Related
- **Transaction Management** — Transaction boundaries in orchestration
- **Action Pattern** — Execution units that services compose

### Advanced
- **Domain vs Application Services** — Orchestration at different architectural levels

---

## AI Agent Notes

### Important Decisions
- Orchestration belongs in services, not controllers
- Actions execute single operations; services coordinate them
- Transaction boundaries are set at the orchestration level
- Individual actions should NOT manage their own transactions when composed

### Important Constraints
- Prefer actions to call services rather than services calling actions. This keeps the dependency direction consistent with the entry-point-to-domain flow.
- Orchestration methods should return aggregated results
- Transaction management is a service responsibility

---

## Verification

This document has been validated against:
- Production service orchestration patterns
- Action composition and service layering best practices
