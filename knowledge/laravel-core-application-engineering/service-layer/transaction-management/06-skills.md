# Skill: Manage Transaction Boundaries in Service Orchestration

## Purpose
To correctly apply database transaction boundaries at the service orchestration level, ensuring atomicity of multi-step workflows while avoiding common pitfalls like nested transactions, long-held locks, and silent failures.

## When To Use
- Multi-step service orchestration methods requiring atomic writes
- Operations across multiple tables or repositories
- Any workflow where partial failure would corrupt data
- High-contention operations (orders, inventory, payments, balances)

## When NOT To Use
- Single database write operations (no atomicity need)
- Read-only operations
- Operations on non-transactional storage (cache, files)
- Trivially simple workflows where no coordination is needed

## Prerequisites
- Service orchestration method exists
- Understanding of which operations are database writes vs external calls
- Knowledge of contention patterns for the tables involved

## Inputs
- Service orchestration method code
- List of database write operations in the workflow
- List of non-database operations (API calls, email, file I/O)
- Contention assessment (high or low)

## Workflow
1. Identify the database write operations that must succeed or fail together. These form the transaction scope.
2. If all database writes are in a linear, unconditional flow, wrap them in `DB::transaction(callback)`. If high-contention tables are involved, set retry to 3: `DB::transaction(callback, 3)`.
3. If the workflow has conditional commit/rollback decisions (e.g., commit only if balance is sufficient), use manual control: `DB::beginTransaction()` / `commit()` / `rollBack()` with a try/catch that rolls back on exception and re-throws.
4. Move all non-database operations (external API calls, email sending, file system writes, cache operations) outside the transaction boundary. Place them after the transaction completes.
5. Verify that individual action classes called within the orchestration do NOT manage their own transactions. Actions should be transaction-ignorant when composed.
6. Ensure the transaction callback is idempotent (uses `updateOrCreate`, `firstOrCreate`, or conditional checks) to prevent duplicates on deadlock retry.
7. After a transaction rollback, either re-throw the exception (or a wrapped domain exception) or return a clear failure result. Never silently return success/null after a rollback.

## Validation Checklist
- [ ] Transaction boundary is in the service method, not in controllers or actions
- [ ] Actions called within the transaction do NOT call `DB::transaction()`, `beginTransaction()`, `commit()`, or `rollBack()`
- [ ] Non-database operations (API calls, email) are OUTSIDE the transaction
- [ ] High-contention operations use `DB::transaction(callback, 3)` for deadlock retry
- [ ] Transaction scope is minimal — only the writes that need atomicity
- [ ] Callback is idempotent — safe to execute multiple times on deadlock retry
- [ ] On rollback, an exception is thrown or failure result is returned — no silent swallowing
- [ ] Simple linear workflows use closure-based `transaction()`; complex conditional workflows use manual control
- [ ] No transaction-only services (services whose only purpose is wrapping `DB::transaction()`)

## Common Failures
- Missing transaction boundary in multi-step orchestration — partial writes on failure
- Actions managing their own transactions inside a service transaction (nested counter issues)
- External API calls inside the transaction — locks held during network latency
- No deadlock retry on high-contention tables — 500 errors under concurrency
- Silent failure after rollback — returns null or success, caller doesn't know it failed
- Non-idempotent callback — duplicate records on deadlock retry
- Transaction-only service with no orchestration value

## Decision Points
- Closure-based or manual transaction? → Use closure for linear unconditional flows. Use manual for workflows with conditional commit/rollback.
- Retry count? → 3 for high-contention operations (orders, payments, inventory, balances). 1 (default) for reference/lookup tables.
- What belongs inside the transaction? → Only database writes that need atomicity. Not API calls, email, or file I/O.
- Idempotency needed? → Yes for any callback with retry > 1. Use `updateOrCreate` or unique constraints.

## Performance Considerations
- Minimize transaction scope — shorter transactions release locks faster
- External API calls inside transactions are the #1 cause of lock contention
- Deadlock retry adds latency but prevents 500 errors — a good trade-off
- Monitor for lock wait timeouts as traffic grows; adjust retry or scope as needed
- Use `READ COMMITTED` isolation unless `SERIALIZABLE` is explicitly required

## Security Considerations
- Transaction rollback should not reveal sensitive data in error messages
- Logged transaction failures must not include full request data containing secrets
- Manual transaction control must not skip rollback on any exception path

## Related Rules
- **Rule 1**: Set Transaction Boundaries at the Service Orchestration Level
- **Rule 2**: Actions Must Not Manage Their Own Transactions
- **Rule 3**: Use Deadlock Retry for High-Contention Operations
- **Rule 4**: Keep Transaction Scope Minimal
- **Rule 5**: Use Manual Transaction Control for Complex Workflows
- **Rule 6**: Retry Callbacks Must Be Idempotent
- **Rule 7**: Do Not Create Transaction-Only Services
- **Rule 8**: Handle Transaction Rollback Correctly in Orchestration

## Related Skills
- Orchestrate a Multi-Step Workflow in a Service Method
- Design a Stateless Service

## Success Criteria
- Multi-step database operations are atomic — all succeed or all roll back
- Transaction boundary is in the service layer, not in controllers or actions
- Deadlock retry prevents transient 500 errors on high-contention operations
- External I/O is outside the transaction — no locks held during network calls
- Rollback always results in a clear error indicator (exception or failure result)
- No duplicate records from deadlock retry — callbacks are idempotent
