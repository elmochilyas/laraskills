# Skill: Detect and Eliminate N+1 Queries in Laravel

## Purpose
Detect, diagnose, and eliminate N+1 query patterns in Laravel applications across development, CI, and production environments.

## When To Use
- All Laravel applications during development and maintenance
- Performance optimization sprints
- Code review process for relationship data access

## When NOT To Use
- Single-record operations (N+1 does not apply)
- Systems using raw SQL exclusively (not applicable)

## Prerequisites
- Understanding of Eloquent relationships (hasMany, belongsTo, morphMany, etc.)
- Telescope or equivalent installed for development
- Access to production query monitoring (Pulse, APM)

## Inputs
- List of endpoints with high query counts
- Controller/repository classes returning relationship data
- Blade views accessing model relationships in loops
- API Resource classes accessing relation properties

## Workflow
1. **Enable lazy loading guard**: Add `Model::preventLazyLoading()` to `AppServiceProvider`. Verify it throws on lazy access.
2. **Run test suite**: Execute tests. Fix any `LazyLoadingViolationException` thrown. Add `with()` calls to affected queries.
3. **Audit Blade views**: Search for `->relation->field` or `$model->relation` inside `@foreach` loops. Add eager loading in the controller.
4. **Audit API Resources**: Check `toArray()` methods for `$this->whenLoaded()` usage. Ensure all accessed relationships are either eager loaded or use `whenLoaded()`.
5. **Add query count assertions**: Write tests for high-traffic endpoints asserting query counts below thresholds.
6. **Configure CI monitoring**: If using Scout APM, enable N+1 analyzer in CI. Configure Telescope in staging.
7. **Monitor production**: Configure Pulse slow query recorder. Set up alerting for endpoints with high query counts.

## Validation Checklist
- [ ] `Model::preventLazyLoading()` enabled in all non-production environments
- [ ] Tests pass without lazy loading violations
- [ ] Blade views checked for relationship access in loops
- [ ] API Resources use `whenLoaded()` for optional relations
- [ ] Query count assertions added for critical endpoints
- [ ] Scout APM N+1 analyzer active in CI
- [ ] Pulse slow query recorder configured
- [ ] No `load()` calls in API Resource serialization
- [ ] Selective columns used in `with()` calls

## Common Failures
- **Disabled guard globally:** `preventLazyLoading(false)` in production hides N+1. Only disable in production.
- **Missing view audit:** N+1 in Blade loops is invisible without query monitoring. Always audit views.
- **Post-serialization loading:** Calling `->load()` in API Resources defeats eager loading. Pre-load in controller.
- **Over-eager loading:** Loading all relationships when only one is used. Use selective `with()`.

## Decision Points
- **Eager vs lazy + chunk:** Eager for < 1000 records; lazy/chunk for > 1000.
- **with() vs load():** `with()` for initial query; `load()` for conditional or post-query loading.
- **Selective vs full columns:** Selective for all list endpoints; full columns only when most fields are needed.

## Performance Considerations
- N+1 turns 1 query into N+1 queries — impact is proportional to list size
- Each lazy query adds ~1-5ms — 500 queries = 500-2500ms added latency
- Memory from eager loading: 5-50KB per model with full columns
- Selective columns reduce memory by 50-80%

## Security Considerations
- Eager loaded relations bypass authorization — ensure tenant scoping applied
- `with()` preserves global scopes — verify tenant isolation works
- Selective columns prevent accidental data exposure via over-fetching

## Related Skills
- APM Tool Integration & Comparison
- Laravel Telescope
- Performance Profiling & Bottleneck Detection

## Success Criteria
- Zero lazy loading violations in non-production environments
- All list endpoints use eager loading for accessed relationships
- Query count assertions pass in CI
- No relationship `->load()` calls in API Resource or view layer
- Production query count per endpoint within established thresholds
