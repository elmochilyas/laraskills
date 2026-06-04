# Skill: Implement Idempotency for Side-Effect Jobs

## Purpose
Guard job execution with a deduplication key so repeated processing (from at-least-once delivery, retries, worker crashes) produces the same side effects only once.

## When To Use
Always for jobs with side effects — API calls, payment processing, email sending. Not needed for read-only jobs or naturally idempotent operations (setting status, updating cache).

## When NOT To Use
Read-only jobs with no side effects; natural idempotency (e.g., "set status to paid"); `array` cache driver (per-worker dedup store); financial operations where DB constraints are preferred.

## Prerequisites
- Shared cache store (Redis, Database) — not `array` driver
- Unique job identifier available in constructor properties

## Inputs
- Job UUID or business identifier
- Dedup store (cache or DB)
- Total retry window for TTL calculation

## Workflow
1. Check dedup store at start of `handle()`: `if (Cache::has($key)) { return; }`
2. Perform side effect (API call, payment, email)
3. Mark processed in dedup store: `Cache::put($key, true, $ttl)`
4. Set dedup TTL > total retry window + 24 hours
5. For financial operations: use DB unique constraints instead of cache
6. Use Redis or Database cache driver — never `array`
7. Log when dedup prevents execution (useful for monitoring)

## Validation Checklist
- [ ] Dedup check at start of `handle()` before side effects
- [ ] Dedup TTL > total retry window + 24h
- [ ] Shared cache driver (Redis/DB) used — not `array`
- [ ] Financial operations use DB unique constraints
- [ ] Dedup skip logged for monitoring
- [ ] All side-effect jobs have idempotency implemented
- [ ] Retry from `failed_jobs` still hits dedup key

## Common Failures
- No idempotency for side-effect jobs — duplicate processing in production
- `array` cache driver — each worker has independent dedup store
- TTL too short (1 hour) — job retried from DLQ bypasses dedup
- Cache eviction removes key — duplicate allowed
- Not logging dedup hits — blind to how often it prevents duplicates

## Decision Points
- Non-financial side effects: Cache-based dedup with Redis
- Financial operations: DB unique constraints for durability
- Mixed: Cache check first, DB constraint as final guard

## Related Rules
- Rule 1: prefer-db-constraints-for-financial
- Rule 2: dedup-ttl-exceeds-retry-window
- Rule 3: no-array-cache-for-dedup
- Rule 4: always-implement-idempotency-for-side-effects

## Related Skills
- Use Failure Taxonomy — Release vs Exception vs Fail
- Retry Failed Jobs Safely

## Success Criteria
All side-effect jobs have dedup guards with TTL exceeding retry windows, financial operations use DB constraints, shared cache driver is used, and dedup skips are logged for observability.
