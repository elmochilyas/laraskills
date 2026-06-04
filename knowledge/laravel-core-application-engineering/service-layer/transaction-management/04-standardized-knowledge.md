# ECC Standardized Knowledge — Transaction Management

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Service Layer Pattern |
| **Knowledge Unit** | Transaction Management |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Business Logic |
| **Last Updated** | 2026-06-02 |

---

## Overview

Transaction management in the service layer ensures that multi-step operations execute atomically — either all steps succeed or all changes are rolled back. Laravel provides `DB::transaction()` for wrapping database operations, with support for manual rollback, retry on deadlock, and nested transaction handling.

The critical engineering decision is where to set the transaction boundary. The rule: transactions wrap at the orchestration level (service), not the execution level (action). Individual actions should not begin or commit transactions when they are part of a larger workflow — the parent transaction handles atomicity.

---

## Core Concepts

### DB::transaction()
`DB::transaction(fn () => ...)` wraps operations in a database transaction. Commits on success, rolls back on exception.

### Manual Transaction Control
`DB::beginTransaction()`, `DB::commit()`, `DB::rollBack()` for fine-grained control. Useful when the transaction spans multiple methods.

### Deadlock Retry
`DB::transaction(callback, $attempts)` — the second parameter sets retry count on deadlock. Default is 1 attempt.

### Nested Transactions
Laravel uses a transaction counter for nesting. Only the outermost transaction actually commits to the database.

---

## When To Use

- Multi-step operations that must be atomic (place order = reserve + charge + create)
- Operations with multiple database writes
- Operations where partial writes would corrupt data
- Service orchestration methods

---

## When NOT To Use

- Single database write operations (no atomicity need)
- Read-only operations
- Operations using non-transactional storage (cache, files)

---

## Best Practices

### Set Transactions at the Service Level
Wrap orchestration methods in `DB::transaction()`.

**Why:** The service knows the workflow boundary. Individual actions should not start their own transactions — they should run within the parent's transaction.

### Handle Deadlocks with Retry
Use `DB::transaction(callback, 3)` for high-contention operations.

**Why:** Deadlocks are inevitable in concurrent systems. Automatic retry handles transient deadlocks without application errors.

### Use Manual Control for Complex Workflows
Use `DB::beginTransaction()`, `commit()`, `rollBack()` when the transaction spans multiple methods or conditional logic.

**Why:** The closure-based `transaction()` is simpler but cannot span method boundaries or handle complex conditional commits.

### Avoid Long-Running Transactions
Keep transaction scope minimal — only the operations that need atomicity.

**Why:** Long transactions hold database locks longer, increasing contention and deadlock probability. Close the transaction as soon as the critical writes are complete.

---

## Architecture Guidelines

### Simple Transaction
```php
DB::transaction(function () {
    $order = Order::create($data);
    $payment = Payment::create($data);
    Inventory::decrement($data->items);
});
```

### Transaction with Retry
```php
DB::transaction(function () use ($data) {
    $order = $this->orderService->place($data);
    $this->inventoryService->reserve($data->items);
}, 3); // Retry up to 3 times on deadlock
```

### Manual Transaction
```php
DB::beginTransaction();
try {
    $order = $this->placeOrder($data);
    if (!$order->isPaid()) {
        DB::rollBack();
        return;
    }
    $this->sendConfirmation($order);
    DB::commit();
} catch (\Throwable $e) {
    DB::rollBack();
    throw $e;
}
```

---

## Common Mistakes

### Transactions in Actions
Desc: Individual actions starting their own transactions.
Cause: Each action protecting itself independently.
Consequence: Nested transactions don't compose correctly; rollback may not include all operations.
Better: Set transaction boundaries at the service orchestration level.

### Missing Transactions in Orchestration
Desc: Multi-step operations without `DB::transaction()`.
Cause: Not considering failure scenarios.
Consequence: Partial writes on failure; data inconsistency.
Better: Always wrap orchestration in a transaction.

### Long Transactions
Desc: Including slow external API calls inside a transaction.
Cause: Wrapping everything "just in case."
Consequence: Transaction holds locks during API latency; increased deadlock probability.
Better: Only include database operations in the transaction.

---

## Anti-Patterns

### Transaction-Only Services
Services that do nothing except wrap a transaction around operations. If orchestration doesn't need coordination, the transaction boundary can be in the controller.

### Ignoring Deadlocks
Transactions without retry handling in high-contention scenarios. Production applications should configure deadlock retry for critical operations.

---

## Examples

### Service-Level Transaction
```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->chargePayment->handle($data->payment);
            return $this->createOrder->handle($data, $payment, $inventory);
        }, 3);
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Class Design** — Services as transaction boundaries
- **Service Orchestration** — When transactions are needed

### Closely Related
- **Transactional Actions** — Action-level transaction patterns
- **Database Transactions** — Database-level transaction mechanics

### Cross-Domain
- **Data & Storage Systems** — Transaction isolation levels and locking

---

## AI Agent Notes

### Important Decisions
- Transaction boundary = service orchestration level
- Individual actions should not manage transactions
- `DB::transaction(callback, $attempts)` for deadlock retry
- Manual `beginTransaction/commit/rollBack` for complex workflows

### Important Constraints
- External API calls should not be inside transactions
- Long transactions increase deadlock probability
- Nested transactions use a counter — only outermost commits
- Retry callbacks must be idempotent

---

## Verification

This document has been validated against:
- `Illuminate\Database\DatabaseManager::transaction()` — transaction handling
- `Illuminate\Database\Connection::transaction()` — closure-based transactions
- Database deadlock and retry patterns in production
