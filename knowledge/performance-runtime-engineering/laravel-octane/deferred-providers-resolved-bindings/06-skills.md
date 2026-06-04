# Skill: Configure Deferred Providers and Pre-Resolved Bindings for Octane

## Purpose
Optimize Octane worker boot time and memory usage by deferring non-essential service providers and strategically pre-resolving high-usage bindings — reducing per-request overhead while minimizing worker start latency.

## When To Use
- Fine-tuning Octane worker performance after initial deployment
- When worker boot time is on the critical path (rolling deployments, frequent recycling)
- When memory usage per worker is higher than desired
- When first-request latency after worker boot is a concern
- After adding new service providers to an Octane-deployed application

## When NOT To Use
- During initial Octane migration (focus on correctness first, optimization second)
- For applications with minimal service providers (<5 custom providers)
- Without first profiling worker boot time and first-request latency (tuning without data)
- When service providers have boot-time side effects (event listeners, middleware, route models) — these cannot be deferred

## Prerequisites
- Laravel application running under Octane
- Complete list of all service providers and their bindings
- Understanding of which providers have boot-time side effects
- Worker boot time baseline (from Octane start logs or profiling)
- First-request latency baseline for key endpoints
- Access to `config/octane.php` for pre_resolved configuration

## Inputs
- Full list of service providers from `config/app.php` and dynamically registered providers
- For each provider: list of boot-time side effects (event listeners, middleware, route models)
- Worker boot time (current baseline)
- First-request latency for most-used endpoints
- Usage frequency of each service (what percentage of requests resolve each binding)
- `config/octane.php` current pre_resolved list

## Workflow

### 1. Catalog All Service Providers
- List all providers from `config/app.php` `'providers'` array
- For each provider, identify:
  - Does it have a `boot()` method? What does it do?
  - Does it register event listeners, middleware, or route model bindings?
  - Does it only register container bindings (no side effects)?
  - How frequently are its bound services used (estimate as percentage of requests)?
- Classify each provider: Deferrable (no boot side effects, services used <50% of requests), Non-Deferrable (has boot side effects), or Pre-Resolution Candidate (services used >50% of requests)

### 2. Mark Deferrable Providers with DeferrableProvider Interface
- For each provider classified as deferrable:
  - Add `implements DeferrableProvider` to the class declaration
  - Add `provides()` method returning array of service container bindings this provider registers
  - Example:
```php
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Support\DeferrableProvider;

class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsService::class, fn() => new AnalyticsService());
    }

    public function provides(): array
    {
        return [AnalyticsService::class];
    }
}
```
- Verify the provider's `boot()` method is empty or only resolves its own bindings

### 3. Verify Non-Deferrable Providers Justify Their Status
- For each provider that has boot-time side effects, document why it cannot be deferred
- Common justifications: registers event listeners, registers middleware, registers route model bindings, performs eager configuration loading needed for all requests
- If a provider has both deferrable bindings and non-deferrable boot side effects, split into two providers:
  - One deferred provider for the service bindings
  - One non-deferred provider for the boot-time registrations

### 4. Identify Pre-Resolution Candidates
- Review the default `pre_resolved` list in `config/octane.php`:
  `auth, cache, config, db, encrypter, events, files, log, queue, redirect, router, session, validator, view`
- Identify custom services that are used in >50% of requests
- For each candidate, estimate the resolution cost:
  - Low cost (>5ms to resolve): pre-resolve if used >50%
  - High cost (>50ms): pre-resolve even if used >20%
  - Very high cost (>100ms): pre-resolve regardless of usage frequency
- Add selected custom services to the pre_resolved array

### 5. Benchmark Before and After Changes
- Measure worker boot time before changes:
  - Start Octane, capture time from command to first request accepted
  - Average over 3-5 starts for reliable baseline
- Measure first-request latency:
  - Send a request immediately after worker start
  - Compare to steady-state request latency
- After applying deferred provider and pre-resolution changes:
  - Re-measure worker boot time
  - Re-measure first-request latency
  - Document improvement (or regression)

### 6. Run php artisan optimize
- After making provider changes, run `php artisan optimize` to compile container definitions
- This caches: `config:cache`, `route:cache`, `event:cache`
- Add `php artisan optimize` to the deployment pipeline after any provider changes
- Verify the cached files are generated in `bootstrap/cache/`

### 7. Test Deferred Provider Resolution
- Start Octane with the deferred provider configuration
- Verify the deferred provider's services are NOT loaded at start (check memory or logs)
- Access an endpoint that uses the deferred service
- Verify the service resolves correctly on first access
- Verify subsequent requests reuse the resolved service (it's still a singleton within the worker, just deferred)
- Test that deferred providers work correctly through `php artisan octane:reload`

### 8. Document Provider Tier Configuration
- Create a provider tier document:
  - Tier 1 (Non-deferred, pre-resolved): Framework essentials (auth, config, db, router, session)
  - Tier 2 (Non-deferred, lazy): Providers with boot side effects but services used infrequently
  - Tier 3 (Deferred): Providers with no boot side effects, services used <50%
- Document which providers are deferred and why
- Record pre-resolution decisions and rationale
- Include benchmarking data showing boot time and first-request latency improvements

## Validation Checklist
- [ ] All custom providers audited for deferrability
- [ ] Deferrable providers implement `DeferrableProvider` and `provides()` method
- [ ] Non-deferred providers have documented justifications (boot side effects)
- [ ] Providers with mixed concerns split into deferred + non-deferred
- [ ] Custom pre-resolved bindings limited to services used in >50% of requests
- [ ] Worker boot time measured before and after changes
- [ ] First-request latency measured before and after changes
- [ ] `php artisan optimize` run and cached files generated
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] Deferred providers resolve correctly on first request
- [ ] Deferred providers work after `octane:reload`
- [ ] Provider tier configuration documented

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Deferred provider never loads | Service returns null or errors | `provides()` missing the bound service name | Add all bound aliases to `provides()` array |
| Missing event listeners | Events not handled | Provider with boot() side effects was deferred | Split provider or remove DeferrableProvider |
| Boot time didn't improve | Same boot time after deferring providers | Heavy providers not actually deferred (still have boot side effects) | Audit deferral candidates more carefully |
| First-request latency increased | First request slower after changes | Removed essential service from pre_resolved list | Re-add to pre_resolved if first-request SLA is critical |
| Pre-resolved service returns stale data | Service holds request-scoped data across requests | Request-scoped service added to pre_resolved | Remove from pre_resolved or ensure stateless design |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Defer vs not defer | Defer if no boot() side effects AND services used <50% of requests. Do NOT defer if boot() has event listeners, middleware, or route registrations |
| Pre-resolve vs lazy | Pre-resolve if used >50% of requests OR resolution cost >50ms. Leave as lazy if used <50% and resolution cost <5ms |
| Split provider vs keep combined | Split if the provider has both deferrable services AND non-deferred boot logic. Keep combined if all concerns share the same lifecycle |
| Add to pre_resolved vs keep default | Only add if monitoring shows first-request latency is a bottleneck AND the service is used on most requests |

## Performance Considerations
- Each deferred provider skipped saves its entire boot() cost on worker start (varies, typically 2-50ms)
- Each pre-resolved service adds 1-5ms to worker boot time but saves 0.1-1ms per request
- Default pre-resolved list (14 services) is well-optimized — adding more is rarely beneficial
- `php artisan optimize` compilation takes ~2s but saves 10-50ms per worker start
- Deferred providers that are eventually resolved still pay their boot cost — just deferred to first request
- For high-throughput APIs (>1000 RPS), every microsecond of per-request savings compounds significantly

## Security Considerations
- Pre-resolved bindings are shared across all requests in a worker — never pre-resolve services that hold request-scoped data
- Deferred providers should not handle authentication or authorization that must be present for every request
- If a deferred provider registers middleware, that middleware is not applied until the service is first resolved — potential security hole
- `php artisan optimize` caches configuration — sensitive values in config files become part of the cache; ensure file permissions restrict access
- After splitting a provider, verify security-critical bindings (auth, encryption) remain in the non-deferred provider

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Make every custom provider implement DeferrableProvider unless it has boot-time side effects | `05-rules.md:1` | Steps 1-3: deferral classification |
| Never pre-resolve services used in fewer than 50% of requests | `05-rules.md:42` | Step 4: pre-resolution candidates |
| Never defer a provider that registers event listeners, middleware, or route models | `05-rules.md:73` | Step 3: verify non-deferrable status |
| Run php artisan optimize after every service provider change | `05-rules.md:110` | Step 6: container compilation |

## Related Skills

| Skill | Relation |
|-------|----------|
| Optimize Service Providers for Octane Persistent Execution | This skill extends provider optimization with deferral and pre-resolution |
| Install and Configure Octane for a Laravel Project | Octane must be installed to access config/octane.php pre_resolved |
| Configure Octane Workers by Driver | Worker configuration affects how many workers benefit from provider optimization |
| Perform FPM-to-Octane Migration | Provider optimization is Phase 2-3 of the migration |

## Success Criteria
- All eligible custom providers implement DeferrableProvider
- Worker boot time measurably reduced (10-50% improvement, depending on provider count)
- First-request latency does not increase (or improves from strategic pre-resolution)
- `php artisan optimize` integrated into deployment pipeline
- No missing event listeners, middleware, or route model bindings from improperly deferred providers
- Pre-resolved list does not contain rarely-used services
- Provider tier configuration documented and understood by the team
- `php artisan octane:test` passes with zero warnings
