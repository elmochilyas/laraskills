# OTel Community Packages — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** Community Packages
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] PHP 8.1+ (for `keepsuit/laravel-opentelemetry`) or 8.0+ (for `overtrue/laravel-open-telemetry`)
- [ ] Composer installed
- [ ] OTel backend endpoint available (OTLP receiver)
- [ ] Laravel application with service provider registration

## Implementation Checklist
- [ ] Community package is selected based on feature needs and PHP version
- [ ] OTel SDK version is pinned alongside package version
- [ ] Config file approach is used for sampler and exporter configuration
- [ ] Auto-instrumentation coverage matches application's library usage
- [ ] Service provider is extended if custom span processors are needed
- [ ] Package compatibility is tested when OTel SDK is upgraded
- [ ] Raw SDK fallback path exists for advanced use cases
- [ ] Package versions are pinned in composer.json
- [ ] OTel endpoint credentials in config files are protected
- [ ] Package maintainer reputation is evaluated before production adoption

## Verification Checklist
- [ ] TracerProvider auto-configuration works (reads from config file and env vars)
- [ ] Config file exists (`config/opentelemetry.php` or `config/telemetry.php`)
- [ ] Facade returns correct `TracerProvider` instance
- [ ] Laravel auto-instrumentation covers expected operations (requests, queries, jobs, cache, mail)
- [ ] OTLP exporter configuration is correct
- [ ] Sampler configuration is readable from config
- [ ] Package version is compatible with installed OTel SDK version
- [ ] Traces appear in OTel backend

## Security Checklist
- [ ] Package configuration files are not publicly accessible
- [ ] OTel endpoint credentials in config files are protected
- [ ] Package maintainer reputation is verified before adoption
- [ ] Security updates are monitored (community package, best-effort basis)
- [ ] Package versions are pinned to prevent unexpected instrumentation behavior
- [ ] No sensitive data leaked through auto-instrumentation hooks

## Performance Checklist
- [ ] Community package overhead is negligible (configures SDK at bootstrap, not per-request)
- [ ] Auto-instrumentation via package hooks adds same overhead as raw SDK
- [ ] Config file parsing is one-time bootstrap cost
- [ ] Package abstractions add no measurable runtime overhead over raw SDK
- [ ] Facade access resolves to same underlying `TracerProvider` instance

## Production Readiness Checklist
- [ ] Community package meets 80%+ of instrumentation needs
- [ ] Migration path to raw SDK is documented if needs grow
- [ ] Package is not a permanent dependency — raw SDK fallback exists
- [ ] Package compatibility tested when OTel SDK is upgraded
- [ ] Pinned package version in `composer.json`
- [ ] Official `open-telemetry/opentelemetry-auto-laravel` preferred for auto-instrumentation
- [ ] Package maintenance status is monitored

## Common Mistakes to Avoid
- [ ] Not checking SDK compatibility — silent failures after OTel SDK upgrade
- [ ] Staying on package when customization needed — fighting abstractions
- [ ] Using package for critical path without fallback — blocked by package bugs
- [ ] Not testing package in staging — unexpected instrumentation behavior
- [ ] Package as permanent dependency — plan migration as needs grow
- [ ] Not pinning package version — breaks on OTel ecosystem upgrade
- [ ] Package for everything — use raw SDK when 20% needs aren't met
- [ ] Ignoring official packages — prefer `open-telemetry/opentelemetry-auto-laravel`
