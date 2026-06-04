# Decision Trees: Concurrency Handling

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Concurrency Handling |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Locking strategy selection (pessimistic vs optimistic) | Primary |
| 2 | Transaction scope and lock ordering | Architecture |
| 3 | Deadlock handling approach | Architecture |

---

## Decision 1: Locking Strategy Selection

### Context
Concurrent read-then-write sequences need protection against lost updates. Pessimistic locking locks rows immediately; optimistic locking detects conflicts at write time. The choice depends on contention level, operation duration, and acceptable throughput.

### Criteria
- How long does the read-modify-write sequence take?
- How often do concurrent writes to the same row occur?
- Can the operation tolerate retries on conflict?
- Is the operation short (milliseconds) or long (seconds)?

### Decision Tree
```
Is the operation short (< 100ms) and high-contention?
├── YES
│   └── Use pessimistic locking (lockForUpdate)
│       └── Are there multiple tables to lock?
│           ├── YES → Establish global lock order alphabetically
│           └── NO → Lock the single row
└── NO
    └── Is the operation long (form edits, document collaboration)?
        ├── YES → Use optimistic locking (lock_version column)
        │   └── Is retry logic implemented?
        │       ├── YES → Proceed with conflict detection
        │       └── NO → Add retry before deploying
        └── NO
            └── Is the dataset small and contention low?
                ├── YES → No locking needed (simple CRUD)
                └── NO → Use pessimistic locking
```

### Rationale
Pessimistic locking holds row-level locks for the transaction duration. For short operations, this is efficient and provides strong guarantees. For long operations (seconds), locking blocks all concurrent writers — optimistic locking is better since conflicts are detected at write time rather than preventing reads. Optimistic locking requires idempotent retry logic since every write can theoretically fail on conflict.

### Recommended Default
Pessimistic locking with `DB::transaction()` for high-contention, short-duration operations (inventory, balances). Optimistic locking for long-running operations (edits).

### Risks
- Pessimistic locking without transaction: lock released immediately, zero protection
- Optimistic locking without retry: users see conflict errors without resolution
- `lockForUpdate()` on unindexed column: table-level lock escalation
- Deadlock on inconsistent lock order

### Related Rules/Skills
- Always Wrap lockForUpdate in a Transaction (05-rules.md)
- Keep Locked Transactions Short (05-rules.md)
- Lock Tables in Consistent Global Order (05-rules.md)
- Enforce Uniqueness with Database Constraints and createOrFirst (06-skills.md)

---

## Decision 2: Transaction Scope and Lock Ordering

### Context
The scope of a locked transaction determines both data consistency and concurrency impact. Including I/O inside locks destroys throughput. Inconsistent lock ordering guarantees deadlocks.

### Criteria
- Does the transaction include HTTP calls, file I/O, or email sending?
- Are multiple tables locked in the same sequence across all code paths?
- Is the transaction duration predictable?

### Decision Tree
```
Does the transaction include I/O operations (HTTP, email, file)?
├── YES
│   └── Can the I/O be moved outside the transaction?
│       ├── YES → Extract I/O after commit, keep only read-modify-write inside
│       └── NO → Use queue-based serialization instead of locking
└── NO
    └── Does the transaction lock multiple tables or rows?
        ├── YES → Establish and document global lock order
        │   └── Is the order consistent across all code paths?
        │       ├── YES → Proceed
        │       └── NO → Refactor to consistent alphabetical order
        └── NO → Single-row lock, no ordering concern
```

### Rationale
Database locks are held until commit. A 500ms HTTP call inside a locked transaction blocks all other writers to that row for 500ms — destroying throughput. Moving I/O outside the transaction limits lock duration to the actual data mutation. For multiple locks, alphabetical ordering eliminates the circular wait condition that guarantees deadlocks.

### Recommended Default
Only the read-modify-write sequence inside the transaction; all I/O outside. Alphabetical lock order documented in project conventions.

### Risks
- Moving I/O outside breaks atomicity of write + side effect — use queues with compensating actions
- Inconsistent lock order across developers creates intermittent deadlocks that are hard to reproduce
- Missing `->index()` on locked columns causes table-level escalation

### Related Rules/Skills
- Keep Locked Transactions Short (05-rules.md)
- Lock Tables in Consistent Global Order (05-rules.md)
- Implement Atomic Bulk Upsert Operations (06-skills.md)

---

## Decision 3: Deadlock Handling Approach

### Context
Deadlocks are inevitable under concurrent access to shared resources. The response to a deadlock determines whether it's a transient error or a production incident.

### Criteria
- Is `DB::transaction($callback, $attempts)` configured?
- Is the callback idempotent (side effects before the retry point)?
- Are deadlocks monitored and logged?

### Decision Tree
```
Is the transaction configured with retry attempts?
├── YES (DB::transaction($callback, 3))
│   └── Is the callback idempotent?
│       ├── YES → Proceed (safe retry)
│       └── NO → Refactor to make side effects conditional or post-commit
└── NO
    └── Is deadlock frequency expected to be low?
        ├── YES → Add DB::transaction($callback, 3) with monitoring
        └── NO → Investigate contention source first
            ├── Hot row → Queue-based serialization
            ├── Inconsistent lock order → Fix ordering
            └── Long transactions → Shorten scope
```

### Rationale
`DB::transaction($callback, 3)` retries the closure on deadlock. If the closure has non-idempotent side effects (sending an email, decrementing an external counter), the retry executes them again. The closure should only perform database operations; all side effects should happen after the transaction commits or be guarded by idempotency keys.

### Recommended Default
`DB::transaction($callback, 3)` with idempotent closures. Log deadlock occurrences at warning level.

### Risks
- Non-idempotent callbacks cause duplicate side effects on retry
- Setting `$attempts` too high masks design problems — cap at 3
- Missing lock wait timeout setting — threads block indefinitely
- Deadlock retry with optimistic locking — transaction may fail for reasons other than deadlock

### Related Rules/Skills
- Always Wrap lockForUpdate in a Transaction (05-rules.md)
- Lock Tables in Consistent Global Order (05-rules.md)
- Implement Concurrent-Safe Find-Or-Create with createOrFirst (06-skills.md)
