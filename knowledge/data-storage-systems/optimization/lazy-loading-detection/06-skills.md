# Skill: Detect Lazy Loading in Production

## Purpose
Detect N+1 queries caused by lazy loading in production using query logging, middleware, and Laravel's built-in N+1 detection.

## When To Use
- When setting up query monitoring for production
- When investigating slow endpoints
- When establishing development guardrails

## When NOT To Use
- In production — `preventLazyLoading` should be disabled in production (use monitoring instead)

## Prerequisites
- Understanding of N+1 query patterns
- Knowledge of Laravel service providers

## Inputs
- Laravel application with potential lazy loading

## Workflow
1. Enable `Model::preventLazyLoading()` in development/staging
2. Install Telescope or Debugbar for query count visualization
3. Create middleware to log total query count per request
4. Set query count thresholds — alert when exceeded
5. Review Telescope entries or query logs for N+1 patterns
6. Fix by adding eager loading

## Validation Checklist
- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] Query logging middleware captures per-request query counts
- [ ] No lazy loading exceptions in tests or staging
- [ ] Blind eager loading avoided (`$with` property not used for everything)

## Common Failures
- Disabling lazy loading prevention in production without alternative monitoring
- Relying on `$with` on the model — always eager loads even when not needed
- Not checking query count for API resource classes

## Decision Points
- Development: `preventLazyLoading(true)` throws exceptions
- Staging: Telescope monitors query counts
- Production: query log middleware + duration-based alerts

## Performance
- Lazy loading N+1: 1 + N queries
- Eager loading: 2 queries
- Detection overhead: negligible (~1-5μs per query with DB::listen)

## Security
- `preventLazyLoading` throws `LazyLoadingViolationException` — safe
- Query logs may contain query data — ensure access control

## Related Rules
- 4-25-1: Always EXPLAIN Before Optimizing
- 4-25-4: Review And Apply Core Concepts

## Related Skills
- Detect and Eliminate N+1 Queries
- Use Profiling Tools
- Enforce Performance Budget in CI

## Success Criteria
- Lazy loading detected in development/staging
- Production monitoring in place for query count
- No N+1 queries in production endpoints
