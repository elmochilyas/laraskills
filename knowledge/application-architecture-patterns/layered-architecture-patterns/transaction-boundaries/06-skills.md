# Skill: Manage Transaction Boundaries in the Application Layer
## Purpose
Place and manage `DB::transaction()` boundaries correctly in the Application layer (use cases/services) — keeping controllers free of persistence concerns, repositories composable, external API calls outside transactions, and monitoring duration to prevent lock contention and connection pool exhaustion.
## When To Use
- Operations spanning multiple repository calls that must be atomic
- Business operations with side effects needing rollback on failure
- Any write operation involving multiple aggregate roots
## When NOT To Use
- Read-only queries (no transaction needed)
- Single-table operations with no side effects (repository-level transaction may suffice)
- Operations where eventual consistency is acceptable instead of atomicity
## Prerequisites
- LAP-06 Application layer: use cases orchestrate business operations
- LAP-07 Infrastructure layer: repositories participate in caller's transaction
- Understanding of database isolation levels and lock types
- Transaction duration monitoring infrastructure (custom middleware or DB event listener)
## Inputs
- Use case DTO with operation parameters
- Repository interfaces (Domain/Application level)
- External service adapters (payment, email, event bus)
- Authorization result (checked before transaction begins)
## Workflow
1. Place `DB::transaction()` in the use case method, wrapping all repository calls that must be atomic — never in controllers or repositories
2. Perform authorization checks BEFORE the transaction starts — fail fast, avoid holding locks for auth
3. Move ALL external API calls (payment gateways, email, HTTP requests) AFTER the transaction commit — API calls cannot be rolled back
4. Prevent nested transactions: private methods called within the transaction should NOT wrap their own `DB::transaction()` — they participate in the caller's transaction
5. Follow consistent table access ordering within all transactions (e.g., alphabetical order) to prevent deadlocks
6. Dispatch domain events AFTER transaction commit (use after-commit event dispatcher or `dispatchAfterCommit()` in queue)
7. Monitor transaction duration: log warnings for transactions exceeding 500ms, alert on transactions exceeding 2s
8. Set appropriate isolation level: `READ COMMITTED` for most scenarios, `SERIALIZABLE` with retry logic for high-contention operations
9. Handle idempotent retry: if transaction fails due to deadlock, retry with exponential backoff (without creating duplicate side effects)
10. Test concurrent transaction behavior: write integration tests that simulate concurrent operations on the same aggregate
## Validation Checklist
- [ ] `DB::transaction()` only in Application layer (use cases/services)
- [ ] No controller or repository manages its own transaction
- [ ] External API calls after transaction commit, never within
- [ ] No nested `DB::transaction()` calls within the same operation
- [ ] Consistent table access ordering across all transactions
- [ ] Authorization performed before transaction, not within
- [ ] Domain events dispatched after commit (via `dispatchAfterCommit` or after-commit callback)
- [ ] Transaction duration monitored and alerted in production
- [ ] Deadlock retry logic implemented for SERIALIZABLE isolation
- [ ] Concurrent transaction test verifies lock behavior
## Common Failures
- **Transactions in controllers:** Controller wraps `DB::transaction()` — every delivery mechanism needs its own transaction management. Fix: move to use case.
- **External API inside transaction:** Payment succeeds, but DB rollback leaves payment taken with no order. Fix: move API calls after transaction commit.
- **Nested transactions:** Inner `DB::transaction()` uses savepoints — inner rollback doesn't roll back outer. Fix: don't nest; let inner method participate in caller's transaction.
- **Deadlocks from inconsistent ordering:** Transaction A locks invoices→users, Transaction B locks users→invoices. Fix: consistent table ordering (e.g., alphabetical).
- **Long transactions:** 3-second API call inside transaction holds locks, exhausts connection pool. Fix: monitor duration, extract slow operations.
## Decision Points
- **READ COMMITTED vs SERIALIZABLE:** READ COMMITTED for most cases (good performance). SERIALIZABLE with retry for financial operations with high contention.
- **Transaction scope:** Single aggregate root = simple transaction. Cross-aggregate = consider eventual consistency or saga pattern.
- **After-commit actions:** Queue job with `dispatchAfterCommit()` for non-critical side effects. Synchronous after-commit callback for critical follow-ups.
## Performance Considerations
- Long transactions hold database connections and locks — target <200ms for interactive operations
- External API calls inside transactions multiply lock duration by API latency (100ms-30s)
- Batch operations may need longer transactions — configure appropriate thresholds per operation type
- Monitor transaction duration to detect regressions (N+1 in transactions, misplaced API calls)
## Security Considerations
- Transactions ensure data consistency, not security — authorization must happen before transaction
- Check authentication and authorization before opening the transaction to minimize lock time
- Sensitive data within transaction scope should still be encrypted at column level
- Transaction logs may expose data patterns — ensure logging respects data privacy requirements
## Related Rules (from 05-rules.md)
- Place Transactions in Use Case Layer
- Move External API Calls Outside Transaction
- Avoid Nested Transactions
- Consistent Table Access Ordering
- Monitor Transaction Duration
- Authorize Before Transaction, Not Within
## Related Skills
- Application Layer Orchestration (LAP-06)
- Infrastructure Adapters (LAP-07)
- Domain-Entity Mapping (LAP-10)
- Idempotency Patterns (resilience)
## Success Criteria
- Zero `DB::transaction()` calls in Controllers or Repositories (verified by arch tests)
- Zero external API calls inside transaction boundaries
- Zero nested transaction savepoint confusion
- No deadlock errors in production (consistent table ordering)
- Transaction duration p99 <200ms with alerting for outliers
