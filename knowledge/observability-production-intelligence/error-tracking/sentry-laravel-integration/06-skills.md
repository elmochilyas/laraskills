# Skill: Integrate Sentry with Laravel Applications

## Purpose
Integrate and configure Sentry error tracking and performance monitoring for Laravel applications with optimal settings for production reliability, security, and cost.

## When To Use
- Production Laravel applications requiring comprehensive error tracking
- Teams needing performance tracing, release tracking, and profiling
- Applications where Sentry is the chosen error tracking platform

## When NOT To Use
- Development-only environments
- Applications where Sentry is not the chosen platform

## Prerequisites
- Sentry account and project created
- `sentry/sentry-laravel` package installed
- Access to Sentry dashboard for configuration

## Inputs
- Sentry DSN and project ID
- Performance budget for tracing overhead
- Traffic patterns for sampling configuration
- PII types that must be redacted

## Workflow
1. **Initialize SDK**: Install via Composer. Publish config: `php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"`. Set `SENTRY_LARAVEL_DSN` in `.env`.
2. **Configure release tracking**: Set `SENTRY_RELEASE` in deployment environment (git SHA). Verify release appears in Sentry dashboard.
3. **Configure sampling**: Implement `traces_sampler` callback. Exclude health checks. Set base rate (0.1 for high traffic, 0.5 for moderate). Preserve parent sampling decisions.
4. **Implement PII redaction**: Configure `before_send` callback. Strip email, IP, and PII fields. Test with sample error events.
5. **Configure environment**: Set environment from `APP_ENV`. Verify staging/production separation in dashboard.
6. **Configure breadcrumbs**: Enable query, HTTP client, and queue breadcrumbs. Disable debug-level noise. Set buffer to 100 for production.
7. **Configure queue tracing**: Verify job classes appear as transactions. Check span coverage for job execution.
8. **Test end-to-end**: Trigger test exception. Verify event appears with correct context, release, environment, and breadcrumbs. Verify traces_sampler decisions.

## Validation Checklist
- [ ] DSN stored in environment variable
- [ ] Release tracking configured and verified
- [ ] `traces_sampler` callback implemented (not `traces_sample_rate`)
- [ ] Health check endpoints excluded from sampling
- [ ] `before_send` configured for PII redaction
- [ ] `send_default_pii` set to false
- [ ] Environment matches APP_ENV
- [ ] Breadcrumbs: queries, HTTP, queue enabled; debug disabled
- [ ] Queue job transactions visible in dashboard
- [ ] Profiling disabled in production (on-demand only)

## Common Failures
- **DSN hardcoded in config:** Committed to version control. Use `env()` with no fallback.
- **No sampling configuration:** Default is 0.0 — no transactions. Or set to 1.0 — every request traced. Neither is correct.
- **Health check endpoints traced:** 30%+ of span budget wasted. Add exclusion to sampler.
- **No PII redaction:** User data sent to Sentry servers without review. Implement `before_send`.

## Decision Points
- **traces_sampler vs traces_sample_rate:** Sampler for dynamic, context-aware sampling. Sample rate for simple fixed probability.
- **Profiling always-on vs on-demand:** Always-on for performance-focused teams; on-demand for cost-sensitive teams.
- **Full auto-instrumentation vs selective:** Full for maximum insight; selective for minimal overhead.

## Performance Considerations
- SDK overhead: 5-10ms per request
- Per-span cost: 1-5ms each
- Profiling overhead: 5% CPU on sampled transactions
- Breadcrumb cost: < 1ms each, ~50KB for full buffer

## Security Considerations
- DSN in `.env` only — never hardcode
- `before_send` for PII redaction — non-negotiable
- `send_default_pii = false`
- Session replay requires privacy assessment
- User context fields reviewed before enabling

## Related Skills
- Error Tracking Workflow
- Span Sampling Strategies
- Log Context & Correlation

## Success Criteria
- All unhandled exceptions captured with full context
- Performance traces visible with correct transaction names
- Release correlation: each error traceable to deployment
- Zero PII leakage through events
- Health check traffic excluded from tracing budget
- Queue jobs traced as separate transactions
