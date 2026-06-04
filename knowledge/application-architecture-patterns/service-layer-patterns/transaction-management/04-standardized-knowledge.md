# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Transaction management: where transactions belong
Knowledge Unit ID: SLP-11
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Who calls `DB::transaction()`? Consensus: the Service layer owns transactions. Services coordinate multiple operations that must be atomic. Actions do not manage transactions (leaf operations). Repositories do not manage transactions (data access only). Controllers do not manage transactions (HTTP concerns). Service-layer transaction ownership provides the right granularity: one transaction per business operation.

---

# Core Concepts

- **Controller: Never** — Handles HTTP, not data consistency.
- **Service: Yes** — Orchestrates operations that must be atomic.
- **Action: No** — Leaf nodes; don't know if part of larger operation.
- **Repository: No** — Data access only; doesn't own consistency boundary.

---

# When To Use

- Multiple database writes that must succeed or fail together.
- Business operations requiring atomicity.

---

# When NOT To Use

- Single-write operations (no transaction needed — each write is atomic).
- Read-only operations.

---

# Best Practices

- **Place transactions in the Service layer.** WHY: The service method defines the unit of work. Everything within the transaction either succeeds or fails together. Actions and repositories don't own the consistency boundary.
- **Never nest transactions.** WHY: If an action wraps its own transaction inside a service's transaction, the inner one becomes a savepoint, not a true transaction. Only the outermost transaction is real.
- **Use `afterCommit` for side effects.** WHY: External API calls, email sending, and event dispatching should only happen if the transaction succeeds. `DB::afterCommit()` schedules callbacks for post-commit execution.
- **Keep transactions short.** WHY: Transactions hold database locks. Long transactions cause contention. Move slow operations (API calls, email) to afterCommit callbacks or queue jobs.

---

# Architecture Guidelines

- Service method wraps `DB::transaction(function() { ... })`.
- Alternatively, inject a `TransactionService` or `UnitOfWork` class for testability.
- Actions and repositories never call `DB::transaction()`.
- Monitor transaction duration and deadlock frequency.

---

# Performance Considerations

- Transactions hold database locks. Keep duration short.
- External API calls in transactions increase lock time dramatically — use afterCommit.
- Long-running transactions are a common source of production deadlocks.

---

# Security Considerations

- No direct security implications. Transaction boundaries are data consistency, not security.

---

# Common Mistakes

1. **Multiple transaction layers:** Controller wraps a transaction, which calls a service wrapping another transaction. Cause: no ownership standard. Consequence: inner transaction is a savepoint. Better: service owns transactions exclusively.

2. **Transactions in repositories:** Every repository method wraps its own transaction. Cause: defensive coding. Consequence: service calling three repositories has three independent transactions, not one atomic unit. Better: service owns the transaction.

3. **External API calls in transactions:** HTTP API call inside a transaction. Cause: convenience. Consequence: transaction holds locks for the API call duration. Better: use afterCommit or queue jobs.

---

# Anti-Patterns

- **Distributed transaction without distributed infrastructure**: Service tries to coordinate transactions across multiple databases without a distributed transaction coordinator.
- **Transaction per action**: Every action wraps its own transaction — prevents composition.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | LAP-11 Transaction boundaries | DBC-11 Multi-context transactions |
| SLP-04 Pyramid architecture | SLP-09 Dependency injection | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Default: transactions in Service layer only.
- Actions and repositories should never wrap their own transactions.
- Generate afterCommit callbacks for side effects.

---

# Verification

- [ ] Transactions are in Service layer only
- [ ] Actions and repositories don't call DB::transaction()
- [ ] No nested transaction layers
- [ ] External API calls are outside transactions (afterCommit/queue)
- [ ] Transaction duration is monitored
