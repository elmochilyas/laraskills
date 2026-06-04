# Skill: Prevent Lazy Loading to Catch N+1 in Development

## Purpose

Enable `Model::preventLazyLoading()` in non-production environments to throw exceptions when relationships are lazy-loaded outside of eager loading contexts, catching accidental N+1 query problems during development before they reach production.

## When To Use

- Development and staging environments
- CI/CD test pipelines
- Any environment where catching N+1 early is desired

## When NOT To Use

- Production (log instead of throw)
- Environments where lazy loading is intentional and performance is acceptable

## Prerequisites

- Understanding of N+1 query pattern
- Relationships defined on models

## Inputs

- Environment detection
- Error handling strategy (throw vs log)

## Workflow

1. In `AppServiceProvider::boot()`, add: `Model::preventLazyLoading(! $this->app->isProduction())`
2. For production, use: `Model::handleLazyLoadingViolationUsing(fn($model, $relation) => Log::warning("Lazy loading $relation on ".get_class($model)))`
3. Run the application's feature/integration tests — lazy loading violations will throw exceptions
4. Fix violations by adding `with()` or `load()` as needed
5. In production, monitor logs for lazy loading warnings and fix them in the next sprint

## Validation Checklist

- [ ] `preventLazyLoading` enabled in non-production environments
- [ ] Lazy loading violations logged (not thrown) in production
- [ ] Test suite passes without lazy loading violations
- [ ] Production logs monitored for lazy loading warnings

## Common Failures

### Enabling with throwing in production
Production users see exception pages for N+1 queries. Use logging handler in production, throwing only in non-production.

### Not fixing logged violations
Production logs show lazy loading warnings but they're ignored. All logged violations should have a ticket and be fixed.

## Decision Points

### Throw vs log?
Throw in local/dev/staging to catch immediately. Log in production to avoid breaking user experience while still tracking the issue.

### Global vs selective prevention?
Global via `Model::preventLazyLoading()` for all models. Selective for specific models when lazy loading is intentional and documented.

## Performance Considerations

The lazy loading check itself adds negligible overhead. The performance savings from preventing N+1 are orders of magnitude larger. No production performance impact with the logging handler.

## Security Considerations

Lazy loading violations logged in production may include model data. Ensure logs don't contain sensitive information. Use structured logging with appropriate levels.

## Related Rules

- Enable preventLazyLoading in non-production
- Log lazy loading violations in production
- Fix all logged violations

## Related Skills

- Eager Load Relationships
- Define Eloquent Relationship Types
- Use Lazy Collections

## Success Criteria

- N+1 query problems are caught during development
- Production logs capture lazy loading violations without breaking UX
- Test suite has zero lazy loading violations
- Team has a process for fixing logged violations
