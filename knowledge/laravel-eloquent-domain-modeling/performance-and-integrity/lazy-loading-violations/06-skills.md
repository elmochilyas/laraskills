# Skill: Enforce Lazy Loading Discipline with Strict Mode

## Purpose
Configure `preventLazyLoading()` and `shouldBeStrict()` to convert accidental lazy-loaded relationship accesses into immediate exceptions during development and testing, catching N+1 violations at the cheapest possible time.

## When To Use
- Development environment — enable with throw behavior to catch violations early
- CI/CD test suite — enable to prevent deployment of code with lazy loading violations
- Staging environment — enable with custom logging handler
- Any codebase where N+1 regression prevention is important

## When NOT To Use
- Production with throw behavior — a single lazy load breaks the entire request
- Codebases with many third-party packages that use lazy loading (use custom handler)
- Single-model applications with no relationships

## Prerequisites
- Service provider registration
- Understanding of lazy loading and eager loading
- Knowledge of third-party package lazy loading patterns

## Inputs
- Application environment configuration
- Custom violation handler (optional)
- List of known package lazy loads to ignore (optional)

## Workflow
1. In `AppServiceProvider::boot()`: gate `Model::preventLazyLoading()` behind `app()->isLocal()`
2. For Laravel 10+: call `Model::shouldBeStrict()` in development instead of individual methods
3. For staging: use a custom logging handler instead of throw
4. In `TestCase::setUp()`: add `Model::preventLazyLoading()` for test enforcement
5. For third-party packages: configure a custom handler that ignores known model/relation combinations
6. Combine with `assertQueryCountLessThan()` tests for full N+1 coverage (catches method-chain lazy loads)

## Validation Checklist
- [ ] `preventLazyLoading()` enabled in development with throw behavior
- [ ] Custom logging handler configured for staging environments
- [ ] `TestCase::setUp()` enables `preventLazyLoading()` for test enforcement
- [ ] Third-party package violations handled via custom handler, not global disable
- [ ] Query count assertions complement strict mode for full N+1 coverage
- [ ] Throw behavior never enabled in production

## Common Failures
- Enabling throw in production — 500 errors on every lazy load
- Not enabling in test suite — violations ship to production
- Disabling globally for packages — all enforcement lost
- Confusing with method-chain lazy loads — only catches property access, not `$model->relation()->get()`

## Decision Points
- `preventLazyLoading()` vs `shouldBeStrict()`: `shouldBeStrict()` bundles lazy loading prevention, silent attribute discarding prevention, and missing attribute access prevention — prefer it in development
- Throw vs log: throw in development (immediate feedback), log in staging (track without breaking pages), never throw in production

## Performance Considerations
- `preventLazyLoading()` adds a single static property check before each lazy load — no measurable overhead
- Custom handler performing I/O per violation can add overhead if violations are frequent
- The N+1 queries prevented are far more costly than the check

## Security Considerations
- `LazyLoadingViolationException` may expose model and relation names in stack traces
- Do not enable throw behavior in production — causes denial of service for any code path with a lazy load

## Related Rules
- Enable preventLazyLoading in Development with Throw Behavior (performance-and-integrity/lazy-loading-violations)
- Enable shouldBeStrict in Development and CI (performance-and-integrity/lazy-loading-violations)
- Never Enable Throw Behavior in Production (performance-and-integrity/lazy-loading-violations)
- Configure Custom Handler for Package Compatibility (performance-and-integrity/lazy-loading-violations)
- Enable in TestCase::setUp (performance-and-integrity/lazy-loading-violations)
- Combine with Query Count Assertions for Full Coverage (performance-and-integrity/lazy-loading-violations)

## Related Skills
- Prevent N+1 with Eager Loading Strategies
- Detect N+1 with Automated Tooling
- Implement Query Count Middleware

## Success Criteria
- N+1 violations throw exceptions in development, preventing silent performance degradation
- Test suite fails on lazy loading violations, preventing merge of N+1 code
- Staging logs violations for monitoring without breaking pages
- Package-compatible strict mode keeps enforcement active for application code
- Method-chain lazy loads caught by query count assertions
