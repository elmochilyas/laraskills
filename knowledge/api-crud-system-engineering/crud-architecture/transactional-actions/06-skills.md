# Skill: Implement Transactional Actions

## Purpose
Wrap database operations in transactions within action classes using `DB::transaction()` with retry logic, ensuring atomicity for multi-step write operations.

## When To Use
- Multi-model write operations
- Operations requiring atomicity
- Any action modifying multiple database records

## When NOT To Use
- Single-model write operations
- Read-only queries

## Prerequisites
- Database transaction understanding
- Action class pattern

## Inputs
- Multi-step write operation specifications

## Workflow
1. Wrap action logic in `DB::transaction(callable $callback)`
2. Return action result from transaction callback
3. Catch exceptions within transaction — auto-rollback on exception
4. Set transaction isolation level if needed: `DB::transaction(..., 5)` (5 attempts)
5. Handle deadlock retry: `DB::transaction(..., 5)` retries up to 5 times
6. Keep transaction scope minimal — don't include external API calls
7. Fire domain events after transaction commits: `DB::afterCommit(fn() => event(...))`
8. Add `afterCommit` to queued jobs for post-transaction dispatch
9. Test transaction rollback on failure
10. Log transaction duration for performance monitoring

## Validation Checklist
- [ ] Multi-step writes wrapped in `DB::transaction()`
- [ ] Transaction returns result from callback
- [ ] Exception causes auto-rollback
- [ ] Deadlock retry configured
- [ ] External API calls outside transaction
- [ ] Domain events fire after commit
- [ ] Rollback tested
- [ ] Transaction duration monitored

## Related Skills
- Action Class Logic
- Queued Actions
- Domain Event Dispatching
