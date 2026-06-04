# Skill: Audit and Optimize Eager Provider Overhead

## Purpose

Identify unnecessarily eager providers in the bootstrap sequence and reduce their impact by converting eligible candidates to deferred or consolidating lightweight registrations.

## When To Use

- TTFB has increased beyond acceptable thresholds.
- Provider count has grown significantly (30+ eager providers).
- Routine performance optimization (quarterly basis).
- Before deploying to high-throughput production environments.

## When NOT To Use

- Small applications (<10 providers) with no performance complaints.
- Providers that register boot-time artifacts (routes, events, views, middleware) — these must remain eager.
- Octane-powered applications where provider overhead is paid once per worker boot (adjust threshold accordingly).

## Prerequisites

- Provider Fundamentals
- Deferred Providers knowledge
- Access to profiling tools (Laravel Debugbar, Blackfire, Xdebug)

## Inputs

- `bootstrap/providers.php` contents
- `bootstrap/cache/packages.php` contents
- Bootstrap profiling data (provider-by-provider timing)

## Workflow

1. List all eager providers: read `bootstrap/providers.php` + filter out deferred from auto-discovered providers.
2. Profile bootstrap time: use Laravel Debugbar "Bootstrap" tab or measure manually with `microtime(true)` around `$app->register()`.
3. For each provider, determine whether its services are used on <30% of routes.
4. If eligible, convert to deferred: add `implements DeferrableProvider` and implement `provides()`.
5. Verify provider does NOT register routes, views, event listeners, or middleware in `boot()`.
6. Consolidate multiple lightweight providers in the same domain into one provider.
7. Run `php artisan optimize` to rebuild the deferred manifest.
8. Re-profile bootstrap time and compare with baseline.

## Validation Checklist

- [ ] Every eager provider identified and categorized (infrastructure / domain / package)
- [ ] Bootstrap time measured before optimization (baseline)
- [ ] Eligible deferred candidates identified (services used on <30% of routes)
- [ ] No boot-time artifact registrations in converted providers
- [ ] Deferred manifest rebuilt and verified
- [ ] Bootstrap time re-measured with improvement recorded
- [ ] Application works correctly after conversion (routes, events, views unaffected)

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Routes return 404 after conversion | Provider registered routes in `boot()` — not eligible for deferral |
| Bootstrap time not improved | Only converted providers with negligible overhead; focus on top-contributing providers |
| Package provider cannot be modified | Third-party package — use deferred proxy or `dont-discover` + manual conditional registration |
| Provider count underestimated | Auto-discovered providers not included in audit |

## Decision Points

- **Defer vs Consolidate**: Provider used on <30% routes but cannot be deferred → consolidate multiple tiny providers into one domain provider.
- **Why Eager**: Is there a concrete reason this provider must run on every request? If not, default to deferred.

## Performance Considerations

- Each eager provider adds ~0.1-0.5ms — 30 providers = 3-15ms, 100 providers = 10-50ms.
- 80/20 rule: 20% of providers account for 80% of bootstrap time.
- Deferred providers eliminate overhead entirely for non-matching routes.
- Octane reduces per-request cost but increases worker memory pressure.

## Security Considerations

- Ensure security-critical providers (auth, encryption) remain eager — they must run on every request.
- Development-only providers (Debugbar, Telescope) must NOT be in production — use environment-specific registration.
- Profiling tools deployed to production can leak performance data.

## Related Rules

- Rule 1: Keep Eager Provider `register()` and `boot()` Methods Lightweight
- Rule 2: Prefer Deferred Providers for Services Used on Fewer Than 30% of Routes
- Rule 3: Always Verify Whether a Provider Is Eager or Deferred
- Rule 4: Never Convert All Providers to Deferred for "Optimization"
- Rule 5: Profile Eager Provider Bootstrap Time Regularly

## Related Skills

- Implement a Deferred Provider
- Enforce Provider Budget in CI
- Perform a Provider Audit

## Success Criteria

- Bootstrap time reduced by at least the combined cost of converted providers.
- No regressions in route availability, event dispatching, or view rendering.
- Provider count audit documents which are eager, deferred, and why.
- Re-profiling schedule established (quarterly automated check).
---

# Skill: Profile Provider Bootstrap Time

## Purpose

Measure each service provider's contribution to application bootstrap time to identify optimization targets and track performance regressions.

## When To Use

- Investigating slow TTFB.
- Before and after provider changes to measure impact.
- Quarterly provider performance review.
- Onboarding a new heavy package.

## When NOT To Use

- Local development without representative profile (hardware differences).
- Applications with <5 providers and no performance concerns.

## Prerequisites

- Access to Laravel Debugbar, Blackfire, Xdebug, or manual instrumentation
- Understanding of eager vs deferred providers

## Inputs

- List of all registered providers
- Target environment (local, staging, production)

## Workflow

1. Enable Laravel Debugbar — check the "Bootstrap" tab for provider timing.
2. Record baseline: total bootstrap time and top 5 slowest providers by time.
3. For manual measurement, instrument the application bootstrap:
   ```php
   $start = microtime(true);
   $app->register(Provider::class);
   $elapsed = (microtime(true) - $start) * 1000;
   ```
4. Categorize each provider: infrastructure, domain, package, development-only.
5. Identify the top 3 providers contributing the most to bootstrap time.
6. For each top contributor, assess: can it be deferred? Can its `register()` or `boot()` be optimized?
7. Document baseline and target values for provider count and total bootstrap time.

## Validation Checklist

- [ ] Bootstrap time measured with representative request (not the first request after cache clear)
- [ ] Provider timing data collected with at least 3 samples to average variance
- [ ] Top 3 slowest providers identified and analyzed
- [ ] Each provider's eligibility for deferral assessed
- [ ] Auto-discovered provider timing included in profile
- [ ] Development-only providers excluded from production profiling

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider timing not visible in Debugbar | Debugbar not configured in `config/debugbar.php`; ensure `collectors.bootstrap` enabled |
| First request is much slower | Cache warmup — ignore first request, measure subsequent |
| Profiling overhead skews results | Disable profiling tools when not actively profiling |
| Inconsistent measurements | Non-representative requests; use same route/middleware stack for each sample |

## Decision Points

- **Which providers to measure**: All eager providers; deferred providers contribute zero bootstrap time until first resolution.
- **When to profile**: After cache warmup, with production-like data and middleware stack.

## Performance Considerations

- Profiling tools add overhead — do not leave enabled in production.
- Xdebug profiling generates large output files — use only on staging or dedicated profiling requests.
- Laravel Debugbar adds ~5-15ms itself — account for this in measurements.

## Security Considerations

- Debugbar in production exposes config, queries, and request data — never enable in production.
- Profile on staging with production-like data for realistic measurements.
- Ensure profiling output files are not publicly accessible.

## Related Rules

- Rule 5: Profile Eager Provider Bootstrap Time Regularly

## Related Skills

- Audit and Optimize Eager Provider Overhead
- Enforce Provider Budget in CI

## Success Criteria

- Top 3 slowest providers identified with timing data.
- Documented baseline bootstrap time value.
- Optimization decisions backed by measurement, not speculation.
