# Skill: Govern Endpoint Query Budgets

## Purpose
Set hard limits on database resource usage per HTTP request (max queries, total duration, rows examined) to prevent runaway endpoints from exhausting connection pools.

## When To Use
- When setting up production governance
- When API endpoints show variable query counts
- When protecting against N+1 amplification in production

## When NOT To Use
- As a replacement for fixing underlying performance issues
- During initial development before query patterns stabilize

## Prerequisites
- Understanding of middleware and `DB::listen()`
- Knowledge of database timeout settings

## Inputs
- Endpoint route definitions and expected query budgets

## Workflow
1. Define governance tiers: API (strict), web (moderate), admin (relaxed), reports (opt-in)
2. Create middleware that tracks query count and total duration via `DB::listen()`
3. Enforce hard limits (throw exception) for strict tiers
4. Enforce soft limits (log warning) for moderate tiers
5. Set database-level safety nets: `MAX_EXECUTION_TIME` (MySQL) or `statement_timeout` (PostgreSQL)
6. Reset governance counters per request (important for Octane)

## Validation Checklist
- [ ] Governance middleware applied to route groups with appropriate limits
- [ ] Hard limits for API endpoints (e.g., max 10 queries, 200ms)
- [ ] Database-level timeouts set as safety net
- [ ] Octane-compatible counter reset implementation
- [ ] Queue jobs also have governance limits

## Common Failures
- Limits too tight — breaking legitimate pages with eager loading
- No governance on queue jobs — connection pool exhaustion from async processing
- Governance only in app layer — developer can bypass middleware
- Forgetting Octane — DB::listen callbacks persist across requests

## Decision Points
- API: max 10 queries, 200ms total — strict
- Web: max 30 queries, 500ms total — moderate
- Admin: max 100 queries, 5s total — relaxed
- Reports: opt-in with higher limits

## Performance
- `DB::listen()` callback: ~1-5μs per query — negligible
- Governance exception: prevents cascading failures
- Database-level timeout: last-resort safety net

## Security
- Governance prevents DoS from slow queries
- Governance middleware runs before response generation for early abort
- Database-level timeouts kill runaway queries at the engine level

## Related Rules
- 4-28-1: Always EXPLAIN Before Optimizing
- 4-28-4: Review And Apply Core Concepts

## Related Skills
- Detect Lazy Loading in Production
- Use Profiling Tools
- Apply Production Optimization Workflow

## Success Criteria
- Governance middleware enforces per-endpoint query budgets
- Excessive query patterns detected and blocked early
- Database-level timeouts provide defense in depth
- No connection pool exhaustion from runaway endpoints
