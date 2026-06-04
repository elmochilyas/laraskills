# Community Packages

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** Community Packages
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

The OTel PHP ecosystem includes community packages that simplify Laravel integration. `keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` provide Laravel-specific convenience layers over the raw OTel SDK — service provider registration, configuration via `config/opentelemetry.php`, automatic tracer setup, and facade access. These packages reduce the boilerplate of SDK initialization, making OTel adoption faster for Laravel teams.

---

## Core Concepts

- **Convenience layer:** Wraps OTel SDK initialization with Laravel conventions (config files, service providers, facades)
- **Auto-configuration:** Reads OTel config from Laravel's `.env` and `config/opentelemetry.php`; no manual `Sdk::builder()` needed
- **Laravel lifecycle hooks:** Some packages hook into Laravel events for automatic span creation
- **Config file approach:** Options set in Laravel config file with env var fallbacks instead of raw env vars

---

## Mental Models

- **Starter Home Model:** Community packages are like buying a starter home vs custom building — you get the basics set up quickly, but you may outgrow it and need to renovate or rebuild
- **Training Wheels Model:** These packages are training wheels for OTel — they get you riding immediately, but eventually you remove them for full control
- **App Store Model:** Think of community packages like app store plugins — convenient, well-tested for common cases, but you're dependent on the developer's maintenance schedule

---

## Internal Mechanics

Community packages wrap the OTel SDK initialization. On Laravel bootstrap, the package's service provider reads `config/opentelemetry.php`, initializes the `TracerProvider` (and optionally `MeterProvider` and `LoggerProvider`), registers them with the service container, and exposes a facade (`OpenTelemetry::tracer()`). Auto-instrumentation hooks into Laravel events (request, query, job) to create spans automatically.

---

## Patterns

- **Package as Starting Point:** Use community packages for initial OTel adoption, migrating to raw SDK for advanced customization. Benefit: fast onboarding. Tradeoff: package abstractions may limit advanced features.
- **Package with Raw SDK Fallback:** Extend the service provider to register custom span processors or exporters when the package doesn't cover a needed feature. Benefit: keeps package benefits while extending. Tradeoff: more complex configuration.
- **Pinned Version Approach:** Pin OTel SDK and package versions together to prevent compatibility issues. Benefit: stable instrumentation. Tradeoff: manual upgrade process.

---

## Architectural Decisions

**Prefer `keepsuit/laravel-opentelemetry` (2026 release, PHP 8.1+, broader auto-instrumentation coverage).** Use `overtrue/laravel-open-telemetry` for PHP 8.0 compatibility if needed.

**Use community packages as starting point; migrate to raw SDK for advanced customization.** Package supports 80% of use cases; reserve raw SDK for remaining 20%.

**Set up fallback to raw SDK if package maintenance is discontinued.** Avoid critical path dependency on unmaintained packages.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Quick OTel setup in minutes | Limited to package feature set | Migrate to raw SDK for advanced needs |
| Laravel-idiomatic configuration | May lag behind upstream OTel SDK releases | Pin versions together; test upgrades |
| Auto-instrumentation hooks for common libraries | Not all libraries covered | Manual instrumentation for uncovered libraries |

---

## Performance Considerations

Community package overhead is negligible — they configure the SDK at bootstrap, not per-request. Auto-instrumentation via package hooks adds same overhead as raw SDK auto-instrumentation. Config file parsing is a one-time bootstrap cost. Package abstractions add no measurable runtime overhead over raw SDK.

---

## Production Considerations

Packages read configuration from Laravel config files; ensure files are not publicly accessible. OTel endpoint credentials in config files must be protected. Verify package maintainer reputation before adoption. Community packages receive security updates on best-effort basis. Pin package versions to prevent unexpected changes in instrumentation behavior.

---

## Common Mistakes

**Not checking SDK compatibility** — assuming package always up to date leads to silent failures after OTel SDK upgrade.

**Staying on package when customization needed** — not migrating to raw SDK leads to fighting against package abstractions.

**Using package for critical path without fallback** — single dependency risk blocks by package bugs.

**Not testing package in staging** — unexpected instrumentation behavior discovered in production.

---

## Failure Modes

**Package abandonment:** Maintainer stops updating package. Detection: no updates for 6+ months; open issues pile up. Mitigation: have raw SDK fallback path; budget for migration.

**SDK version incompatibility:** OTel SDK upgrade breaks package. Detection: initialization errors after composer update. Mitigation: pin OTel SDK and package versions together.

**Feature gap:** Package doesn't support needed instrumentation. Detection: observability gap in production. Mitigation: extend service provider or use raw SDK directly.

---

## Ecosystem Usage

Community packages integrate with the OTel PHP SDK, Laravel service container, and the standard OTLP exporter pipeline. They provide a convenience layer on top of `open-telemetry/sdk`, handling the initialization and configuration that would otherwise require manual `Sdk::builder()` calls.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (raw SDK usage, underlying these packages)

### Related Topics
- OTel Auto-Instrumentation (auto-instrumentation, complementary to convenience layer)
- OTLP Exporter & Collector Configuration (exporter configuration via packages)

### Advanced Follow-up Topics
- Raw SDK migration strategy when packages are insufficient

---

## Research Notes

`keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` are the primary community packages. Neither package is officially maintained by the OpenTelemetry organization. Both packages simplify OTel adoption but may lag behind upstream SDK releases. Official `open-telemetry/opentelemetry-auto-laravel` provides auto-instrumentation as a contrib package.
