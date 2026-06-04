# Decision Trees: Transaction Management

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Transaction management: where transactions belong
- **Knowledge Unit ID:** SLP-11
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Transaction in service vs in action/repository | Architecture | Transaction design |
| 2 | Nested transactions vs single transaction | Reliability | Multi-step operations |
| 3 | Side effects in transaction vs afterCommit | Reliability | Side effect handling |

---

## Decision 1: Transaction in service vs in action/repository

### Context
Transaction boundaries belong exclusively in the Service layer. Actions and repositories must not call `DB::transaction()`. The service defines the unit of work — everything inside either succeeds or fails together.

### Decision Tree

```
Does this operation involve multiple database writes?
├── YES
│   → Service wraps all writes in DB::transaction()
│   Is there an existing transaction in the calling code?
│   ├── YES → Do NOT create a nested transaction — use savepoint or participate
│   └── NO → Service is correct transaction boundary
└── NO (single database write)
    → No transaction needed
    Each individual write is atomic by default
```

### Rationale
The service method defines the unit of work boundary. Actions and repositories perform atomic steps within that boundary. If every class manages its own transaction, composing operations becomes impossible — each action would commit independently, preventing rollback of the full workflow.

### Recommended Default
Transactions in Service layer only; never in Actions or Repositories

### Risks
- Action-level transactions: nested savepoints, partial commits on error
- Repository-level transactions: hidden commits, service cannot compose operations
- No transaction for multi-write: inconsistent state on partial failure

### Related Rules
- Place Transactions In The Service Layer Only (SLP-11/05-rules.md)
- Never Nest Transactions (SLP-11/05-rules.md)
- Use AfterCommit For Side Effects (SLP-11/05-rules.md)

### Related Skills
- Manage Transaction Boundaries in the Service Layer (SLP-11/06-skills.md)
- Build Service + Action + Repository Pyramid (SLP-04/06-skills.md)

---

## Decision 2: Nested transactions vs single transaction

### Context
Never nest `DB::transaction()` calls. If a service opens a transaction and calls an action that opens another, the inner call becomes a savepoint. Only the outermost transaction is real. Developers may erroneously believe the inner one is independent.

### Decision Tree

```
Does the called method (action, repository) call DB::transaction()?
├── YES
│   → REFACTOR: Remove inner transaction
│   The inner call should participate in the outer transaction
│   Is the calling code already in a transaction?
│   ├── YES → Remove the inner transaction; it's a savepoint
│   └── NO → Move the transaction to the outer service
└── NO → No nesting risk — correct design
```

### Rationale
Nested `DB::transaction()` creates a savepoint, not an independent transaction. If the outer transaction rolls back, the inner "transaction" also rolls back — but the code suggests otherwise. The only correct pattern is one transaction per unit of work, owned by the service.

### Recommended Default
Exactly one `DB::transaction()` per unit of work, in the service

### Risks
- Nested transactions: savepoints mislead developers about atomicity guarantees
- Nested from action + service: unclear which transaction is the "real" one
- No transaction: multi-write operations may partially commit

### Related Rules
- Never Nest Transactions (SLP-11/05-rules.md)
- Place Transactions In The Service Layer Only (SLP-11/05-rules.md)
- Keep Transactions Short (SLP-11/05-rules.md)

### Related Skills
- Manage Transaction Boundaries in the Service Layer (SLP-11/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)

---

## Decision 3: Side effects in transaction vs afterCommit

### Context
Side effects (email sending, API calls, event dispatching) should not execute inside a database transaction. If the transaction later rolls back, the side effect has already happened. Use `DB::afterCommit()` to schedule callbacks for post-commit execution.

### Decision Tree

```
Is this operation a side effect (email, API call, event, notification)?
├── YES
│   Must the side effect happen if and only if the transaction commits?
│   ├── YES → Use DB::afterCommit() to schedule post-commit execution
│   │   Can the side effect be queued instead?
│   │   ├── YES → Queue job (async, retryable, even safer)
│   │   └── NO → afterCommit callback (sync, post-transaction)
│   └── NO → Execute side effect regardless of transaction outcome
│       (rare — typically audit logging, metrics)
└── NO (database operation) → Keep inside transaction
```

### Rationale
Side effects inside a transaction create two problems: they execute even if the transaction rolls back, and they hold database locks for the duration of the side effect. `afterCommit` ensures the side effect only runs after successful commit. Queuing the side effect adds async resilience and retry capability.

### Recommended Default
Side effects in `afterCommit()` or queued; never inside a transaction

### Risks
- Side effects in transaction: execute on rollback, hold locks during API calls
- No afterCommit: side effects without transaction guarantee
- Queue failures: queued side effect may never execute — need monitoring

### Related Rules
- Use AfterCommit For Side Effects (SLP-11/05-rules.md)
- Keep Transactions Short (SLP-11/05-rules.md)
- Place Transactions In The Service Layer Only (SLP-11/05-rules.md)

### Related Skills
- Manage Transaction Boundaries in the Service Layer (SLP-11/06-skills.md)
- Handle Eventual Consistency (DBC-12/06-skills.md)
