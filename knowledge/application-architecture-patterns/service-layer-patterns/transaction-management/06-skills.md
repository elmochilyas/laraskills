# Skill: Manage Transaction Boundaries in the Service Layer

## Purpose
Place database transaction boundaries exclusively in the Service layer. Services define the unit of work; Actions and Repositories must not call `DB::transaction()`. Keep transactions short and use `afterCommit` for side effects.

## When To Use
- Multiple database writes that must succeed or fail together
- Business operations requiring atomicity

## When NOT To Use
- Single-write operations (each write is atomic by default)
- Read-only operations

## Prerequisites
- Understanding of database transactions and atomicity
- Service layer ownership of orchestration

## Inputs
- Business operations requiring atomic multi-step writes
- Identified side effects (email, API calls, events)

## Workflow
1. **Place transactions in the Service layer only.** The service method wraps `DB::transaction(function() { ... })`. This defines the unit of work — everything inside either succeeds or fails together.

2. **Never nest transactions.** If an inner class calls `DB::transaction()`, it becomes a savepoint, not a true transaction. Only the outermost transaction is real.

3. **Use `DB::afterCommit()` for side effects.** Schedule external API calls, email sending, and event dispatching with `afterCommit()` so they only execute if the transaction commits successfully.

4. **Keep transactions short.** Do not perform slow operations (HTTP API calls, file processing, image manipulation, email sending) inside a transaction. Move them to `afterCommit()` callbacks or queue jobs.

5. **Actions must never call `DB::transaction()`.** Actions are leaf-node operations that participate in the transaction managed by the calling service.

6. **Repositories must never call `DB::transaction()`.** Repositories are data access abstractions that do not own the consistency boundary.

7. **Consider a `TransactionService` or `UnitOfWork` class for testability.** Instead of calling `DB::transaction()` directly, inject a transaction manager that can be mocked in unit tests.

## Validation Checklist
- [ ] Transactions are in Service layer only
- [ ] Actions and repositories don't call `DB::transaction()`
- [ ] No nested transaction layers
- [ ] External API calls are outside transactions (afterCommit/queue)
- [ ] Transaction duration is monitored
- [ ] Side effects use `afterCommit()` to avoid executing on rollback

## Common Failures
- **Multiple transaction layers.** Controller wraps a transaction calling a service wrapping another — inner is a savepoint.
- **Transactions in repositories.** Every repository method wraps its own transaction — service calling three repos has three separate transactions.
- **External API calls in transactions.** HTTP API call inside a transaction holding locks for the API call duration.

## Decision Points
- **`DB::transaction()` vs injectable TransactionService?** Use `DB::transaction()` directly for simplicity. Use an injectable transaction manager when you need to mock transactions in unit tests.

## Performance Considerations
- Transactions hold database locks. Keep duration short.
- External API calls in transactions increase lock time dramatically — use afterCommit.
- Long-running transactions are a common source of production deadlocks.

## Security Considerations
- No direct security implications. Transaction boundaries are data consistency, not security.

## Related Rules
- Rule: Place Transactions In The Service Layer Only (SLP-11/05-rules.md)
- Rule: Never Nest Transactions (SLP-11/05-rules.md)
- Rule: Use AfterCommit For Side Effects (SLP-11/05-rules.md)
- Rule: Keep Transactions Short (SLP-11/05-rules.md)
- Rule: Actions Must Not Call DB::transaction (SLP-11/05-rules.md)
- Rule: Repositories Must Not Call DB::transaction (SLP-11/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Build Service + Action + Repository Pyramid (SLP-04/06-skills.md)
- Manage Multi-Context Transactions (DBC-11/06-skills.md)
- Handle Eventual Consistency (DBC-12/06-skills.md)

## Success Criteria
- All transaction boundaries are in Service layer methods — never in Actions, Repositories, or Controllers.
- Side effects use `afterCommit()` to avoid executing on transaction rollback.
- No nested transaction calls exist in the codebase.
- Transaction durations are monitored and kept short.
