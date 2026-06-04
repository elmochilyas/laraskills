# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Transaction management: where transactions belong
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Transaction management answers: who calls `DB::transaction()`? The consensus: the Service layer owns transactions. Services coordinate multiple operations that must be atomic. Actions do not manage transactions (they're leaf operations). Repositories do not manage transactions (they're data access only). Controllers do not manage transactions (they're HTTP concerns). Service-layer transaction ownership provides the right granularity: one transaction per business operation.

---

# Core Concepts

**Transaction ownership by layer:**
- **Controller: Never** — Controllers handle HTTP, not data consistency
- **Service: Yes** — Services orchestrate operations that must be atomic
- **Action: No** — Actions are leaf nodes; they don't know if they're part of a larger operation
- **Repository: No** — Repositories handle data access; they don't own the consistency boundary

---

# Mental Models

**The "Service as Transaction Boundary" model:** The service method defines the unit of work. Everything within the service method's transaction either succeeds together or fails together.

**The "Nested Transaction Problem" model:** If an action wraps its own transaction, and a service also wraps a transaction, the inner one becomes a savepoint, not a true transaction. Only the outermost `DB::transaction()` is real.

**The "No Partial State" model:** After a service method completes, either all changes are committed or none are. The database is consistent.

---

# Internal Mechanics

```php
class OrderService {
    public function placeOrder(CheckoutData $data): Order {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrder->execute($data);
            $this->processPayment->execute($order, $data->payment);
            $this->updateInventory->execute($order);
            $this->dispatchEvents->execute($order);
            // All succeed or all fail
            return $order;
        });
    }
}
```

---

# Patterns

**Explicit transaction service:** A dedicated `TransactionService` or `UnitOfWork` class:
```php
class TransactionService {
    public function execute(callable $operation): mixed {
        return DB::transaction($operation);
    }
}

class OrderService {
    public function __construct(
        private TransactionService $tx,
        private CreateOrderAction $createOrder,
    ) {}
    public function placeOrder(CheckoutData $data): Order {
        return $this->tx->execute(function () use ($data) {
            return $this->createOrder->execute($data);
        });
    }
}
```

**After-commit callbacks:** Schedule side effects to run after the transaction commits:
```php
DB::afterCommit(function () {
    // Send emails, dispatch events, call external APIs
    // Only runs if the transaction succeeds
});
```

---

# Architectural Decisions

**Place transaction in service when:** The operation involves multiple writes that must be atomic.

**Place transaction in action when:** The action is genuinely standalone (no other operations share its transaction). But this prevents composition.

**Use afterCommit when:** Side effects (emails, events, API calls) should only happen if the transaction succeeds.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear transaction boundaries | Service layer must know about transactions | Transactions are an infrastructure concern in service |
| Atomicity per business operation | Actions can't be independently transactional | An action called outside a service doesn't have a transaction |
| No partial state | Long transactions hold locks | Services doing API calls in transactions block DB |

---

# Performance Considerations

Transactions hold database locks. Keep transactions short. Move external API calls and email sending to `afterCommit` callbacks or queue jobs.

---

# Production Considerations

Monitor transaction duration and deadlocks. Long-running transactions are a common source of production issues.

---

# Common Mistakes

**Multiple transaction layers:** Controller wraps a transaction, which calls a service that wraps another transaction. The inner one is a savepoint.

**Transactions in repositories:** If every repository method wraps its own transaction, a service calling three repositories has three independent transactions, not one atomic unit.

**External API calls in transactions:** A transaction that makes an HTTP API call in the middle. If the API call times out (30s), the transaction holds locks for 30 seconds.

---

# Failure Modes

**Deadlock:** Two transactions waiting for each other's locks. Mitigate by accessing tables in the same order in all transactions.

**Phantom reads:** Transaction reads data that another transaction modifies concurrently. Mitigate by setting appropriate isolation level.

---

# Ecosystem Usage

Laravel's `DB::transaction()` is the standard mechanism. Some teams use the `lorisleiva/laravel-transactions` package for explicit transaction wrapping.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-01 Service classes | LAP-11 Transaction boundaries | DBC-11 Multi-context transactions |
| SLP-04 Pyramid architecture | SLP-09 Dependency injection | DBC-12 Eventual consistency |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
