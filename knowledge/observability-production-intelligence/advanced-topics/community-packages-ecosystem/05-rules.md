# Phase 5: Behavioral Rules — Community Packages

## Never Use Community Packages as Permanent Dependencies Without a Migration Path
---
## Architecture
---
Use community OTel packages (`keepsuit/laravel-opentelemetry`, `overtrue/laravel-open-telemetry`) as a starting point for OTel adoption, but plan for migration to the raw SDK as customization needs grow.
---
Community packages may lag behind upstream OTel SDK releases, lack advanced features, or become unmaintained. Treating them as permanent dependencies creates risk — when the package blocks an SDK upgrade or doesn't support a needed feature, the team must migrate under pressure.
```
# Bad: Package treated as permanent dependency
# Package doesn't support OTel SDK v1.2 released 6 months ago
# Team can't upgrade — blocked on package maintainer
```
```
# Good: Package with migration path
# Phase 1: Use package for quick setup
# Phase 2: When customization needed, extend the service provider
# Phase 3: Migrate to raw SDK, retaining only the config file structure
# Fallback: Raw SDK initialization exists alongside package code
```
---
Applications with 100% feature coverage from the community package and low customization needs.
---
Blocked on package maintenance; cannot upgrade OTel SDK; forced emergency migration under time pressure.
---

## Always Pin Community Package Version Alongside the OTel SDK Version
---
## Maintainability
---
Pin both the community package version and the OTel SDK version in `composer.json` to prevent incompatible upgrades from breaking instrumentation.
---
The OTel PHP ecosystem evolves rapidly. An unpinned package may auto-update to a version incompatible with the installed SDK (or vice versa), causing silent instrumentation failures — no spans, no metrics, no errors.
```json
// Bad: Unpinned versions — incompatible upgrades possible
"require": {
    "open-telemetry/sdk": "^1.0",
    "keepsuit/laravel-opentelemetry": "^2.0"
}
```
```json
// Good: Pinned, tested versions
"require": {
    "open-telemetry/sdk": "1.1.0",
    "keepsuit/laravel-opentelemetry": "2.3.0"
}
// Upgrade process: Pin both, test together, upgrade together
```
---
No common exceptions.
---
Silent instrumentation failure after `composer update`; no telemetry data without error warning.
---

## Test Community Package Compatibility With Each OTel SDK Upgrade in Staging
---
## Testing
---
Always test community package + OTel SDK upgrades in a staging environment with production-mirroring traffic before deploying to production.
---
Community packages may have subtle incompatibilities with newer OTel SDK versions that only manifest under real traffic patterns — span processor changes, exporter interface changes, or configuration option deprecations.
```bash
# Bad: Upgrade without testing
# composer update → deploy to production
# OTel SDK v1.1 → v1.2: exporter interface changed
# Package not updated → zero telemetry in production
```
```bash
# Good: Staged upgrade testing
# 1. composer require open-telemetry/sdk:1.2.0 on staging
# 2. Run load tests with production traffic patterns
# 3. Verify spans appear in Collector/Dashboard
# 4. Only then deploy to production
```
---
No common exceptions.
---
Silent instrumentation failure in production; undetected data gaps.
---

## Prefer Official open-telemetry/opentelemetry-auto-laravel Instrumentation Packages Over Community Alternatives
---
## Architecture
---
For auto-instrumentation, prefer the official `open-telemetry/opentelemetry-auto-laravel` contrib packages over community convenience wrappers for critical paths.
---
Official contrib packages under the `open-telemetry` organization are maintained alongside the SDK release cycle, with better compatibility guarantees and more timely updates. Community packages are maintained on a best-effort basis.
```json
// Better: Official contrib for auto-instrumentation
"require": {
    "open-telemetry/sdk": "1.1.0",
    "open-telemetry/opentelemetry-auto-laravel": "^1.0",  // Official
    "open-telemetry/opentelemetry-auto-pdo": "^1.0"       // Official
}
// Use community package ONLY for convenience layer (config, facades)
```
```
# Worse: Community package for critical auto-instrumentation
# may lag upstream release by weeks/months
```
---
Applications where the community package's auto-instrumentation coverage matches all needs and has proven reliability.
---
Incompatibility risks; delayed support for new Laravel or OTel features.
---

## Set Sampler Type and Ratio in Config File — Not in Code
---
## Maintainability
---
Configure sampler type and ratio in the package's config file (or via environment variables) so sampling can be adjusted at deploy time without code changes.
---
Hardcoded sampler configuration requires a code commit and deployment to change the sampling rate. Config file or env var-based configuration allows operator-controlled changes without developer involvement — critical during incidents when you may need to increase sampling temporarily.
```php
// Bad: Sampler hardcoded in application code
$tracerProvider = TracerProvider::builder()
    ->setSampler(new TraceIdRatio(0.1))  // Code change needed to adjust
    ->build();
```
```php
// Good: Sampler configured via config/env
// .env
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
// Or config/opentelemetry.php:
'sampler' => [
    'type' => env('OTEL_TRACES_SAMPLER', 'parentbased_traceidratio'),
    'ratio' => env('OTEL_TRACES_SAMPLER_ARG', 0.1),
],
```
---
No common exceptions.
---
Hardcoded sampling requires code deploy to adjust; delayed response during incidents when sampling needs change.
---

## Always Verify Package Maintainer Reputation Before Production Adoption
---
## Security
---
Evaluate the community package's maintainer reputation, commit frequency, issue response time, and security track record before adopting it for production observability.
---
Observability packages have deep access to application internals (capture requests, queries, exceptions). A malicious or poorly maintained package can introduce security vulnerabilities, data leaks, or instrumentation gaps.
```
# Bad: Adopted without maintainer evaluation
# Package has 1 maintainer, 6 months since last commit
# Security issue discovered — no fix available
```
```
# Good: Maintainer evaluation completed
# - GitHub stars: 100+
# - Last release: < 3 months ago
# - Open issues responded to within 1 week
# - Security policy documented
# - Multiple contributors (not single-maintainer risk)
```
---
No common exceptions.
---
Security vulnerabilities from unmaintained packages; no support when issues arise.
