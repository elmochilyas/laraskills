# Decision Trees — Transactional Actions

## Tree 1: Transaction Boundary Decision

**Decision Context**: Where to place the database transaction boundary — inside the action, at the coordinator level, or split across multiple boundaries.

**Decision Criteria**:
- Action atomicity requirements
- Composed action coordination
- Side-effect ordering (API calls, email, file I/O within vs outside transaction)

**Decision Tree**:
```
Is the operation a single write action with no composed sub-actions?
├── YES → Place transaction inside the action method — `DB::transaction()` wraps the entire operation
└── NO → Is the operation a composed workflow (coordinator calling multiple sub-actions)?
    ├── YES → Place transaction at the coordinator level — wrap the entire composition in one transaction
    └── NO → Does the operation mix database writes with external API calls?
        ├── YES → Database transaction for DB writes only; move API calls outside the transaction
        └── NO → Standard transaction inside the action — default approach
```

**Rationale**: Transaction boundaries should match the unit of work. Single actions: inside the action. Composed: at coordinator level. External calls: outside the transaction.

**Recommended Default**: `DB::transaction()` inside each write action. Coordinator-level transaction for composed workflows.

**Risks**: Including external API calls inside a transaction holds database locks during network I/O. Splitting transactions for a truly atomic operation creates a window for partial failure.

---

## Tree 2: Deadlock Handling

**Decision Context**: How to handle deadlock scenarios in transactional write actions.

**Decision Criteria**:
- Write contention frequency
- Lock ordering consistency
- Retry tolerance

**Decision Tree**:
```
Is there a risk of concurrent writes to the same table (high traffic, batch operations)?
├── YES → Use `DB::transaction($callback, attempts: 3)` — retry on deadlock detection
│   Also: acquire locks in consistent table order across all code paths
└── NO → Are there multiple tables being updated in the same action?
    ├── YES → Ensure consistent lock ordering — always lock tables in the same sequence
    │   Add `attempts: 3` as defensive measure
    └── NO → Simple transaction with pessimistic locking only when race conditions are documented
```

**Rationale**: Deadlock retries handle transient contention. Consistent lock ordering prevents deadlocks from occurring in the first place.

**Recommended Default**: `DB::transaction($callback, attempts: 3)` for all write actions. Consistent lock ordering across the codebase.

**Risks**: No retry mechanism causes 500 errors on deadlock (rare but inevitable under concurrent traffic). Indefinite retries (too many attempts) can mask real problems and create runaway workers.
