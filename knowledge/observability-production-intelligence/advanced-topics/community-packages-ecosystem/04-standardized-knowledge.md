# Standardized Knowledge: Community Packages

## Metadata
| Attribute | Value |
|---|---|
| Domain | Observability & Production Intelligence |
| Subdomain | OpenTelemetry Ecosystem |
| Knowledge Unit | Community Packages |
| Difficulty | Intermediate |
| Maturity | Mature |
| Last Updated | 2026-06-02 |

## Overview
The OTel PHP ecosystem includes community packages that simplify Laravel integration. `keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` provide Laravel-specific convenience layers over the raw OTel SDK — service provider registration, configuration via `config/opentelemetry.php`, automatic tracer setup, and facade access. These packages reduce the boilerplate of SDK initialization, making OTel adoption faster for Laravel teams.

## Core Concepts
- **Convenience layer**: Wraps OTel SDK initialization with Laravel conventions (config files, service providers, facades)
- **Auto-configuration**: Reads OTel config from Laravel's `.env` and `config/opentelemetry.php`; no manual `Sdk::builder()` needed
- **Laravel lifecycle hooks**: Some packages hook into Laravel events for automatic span creation
- **Config file approach**: Options set in Laravel config file with env var fallbacks instead of raw env vars

## When To Use
- Teams new to OpenTelemetry wanting a simplified Laravel-native setup
- Laravel applications that don't need advanced SDK customization
- Rapid prototyping and POCs where quick OTel setup is needed
- Teams wanting Laravel-idiomatic configuration (config files, facades)
- Projects where community package features cover 80% of needs

## When NOT To Use
- Applications requiring advanced SDK customizations (custom span processors, multiple exporters)
- Teams already comfortable with raw OTel SDK setup
- Production-critical systems where upstream SDK release lag is unacceptable
- Applications needing features not supported by community packages
- When official `open-telemetry/opentelemetry-auto-laravel` packages are preferred

## Best Practices
- Use community packages as starting point for OTel adoption; migrate to raw SDK for advanced customization
- Set sampler type and ratio in config file; change at deploy time without code changes
- Extend the package's service provider to register custom span processors or exporters
- If package doesn't support a needed feature, access the underlying `TracerProvider` via facade
- Check package compatibility before upgrading OTel SDK — packages may lag behind upstream releases

## Architecture Guidelines
- Prefer `keepsuit/laravel-opentelemetry` (2026 release, PHP 8.1+, broader auto-instrumentation coverage)
- Use `overtrue/laravel-open-telemetry` for PHP 8.0 compatibility if needed
- Package supports 80% of use cases; reserve raw SDK for remaining 20%
- For critical paths, prefer official `open-telemetry/opentelemetry-auto-laravel` instrumentation packages
- Set up fallback to raw SDK if package maintenance is discontinued

## Performance Considerations
- Community package overhead is negligible — they configure the SDK at bootstrap, not per-request
- Auto-instrumentation via package hooks adds same overhead as raw SDK auto-instrumentation
- Config file parsing is a one-time bootstrap cost
- Package abstractions add no measurable runtime overhead over raw SDK
- Facade access resolves to the same underlying `TracerProvider` instance

## Security Considerations
- Packages read configuration from Laravel config files; ensure files are not publicly accessible
- OTel endpoint credentials in config files must be protected
- Verify package maintainer reputation before adoption
- Community packages receive security updates on best-effort basis
- Pin package versions to prevent unexpected changes in instrumentation behavior

## Common Mistakes
| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not checking SDK compatibility | Assuming package always up to date | Silent failures after OTel SDK upgrade | Pin OTel SDK and package versions together |
| Staying on package when customization needed | Not migrating to raw SDK | Fighting against package abstractions | Migrate for advanced needs |
| Using package for critical path without fallback | Single dependency risk | Blocked by package bugs | Have raw SDK fallback path |
| Not testing package in staging | Assuming it works | Unexpected instrumentation behavior | Test in staging with production traffic patterns |

## Anti-Patterns
- **Package as permanent dependency**: Community packages may slow maintenance; plan for migration to raw SDK as needs grow.
- **Not pinning package version**: OTel ecosystem evolves rapidly; unpinned packages may break on upgrade.
- **Package for everything**: If 20% of needs aren't met by the package, use raw SDK rather than fighting abstractions.
- **Ignoring official packages**: Prefer `open-telemetry/opentelemetry-auto-laravel` (official contrib) for auto-instrumentation over community alternatives.

## Examples
| Feature | keepsuit/laravel-opentelemetry | overtrue/laravel-open-telemetry |
|---|---|---|
| TracerProvider auto-config | Yes | Yes |
| Config file | `config/opentelemetry.php` | `config/telemetry.php` |
| Facade | `OpenTelemetry::tracer()` | `OpenTelemetry::tracer()` |
| Laravel auto-instrumentation | Requests, queries, jobs, cache, mail | Requests, queries, jobs |
| OTLP exporter | Yes | Yes |
| Sampler configuration | Config-based | Config-based |
| PHP version support | 8.1+ | 8.0+ |

## Related Topics
- OpenTelemetry PHP SDK (raw SDK usage, underlying these packages)
- OTel Auto-Instrumentation (auto-instrumentation, complementary to convenience layer)
- OTLP Exporter & Collector Configuration (exporter configuration via packages)

## AI Agent Notes
- `keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` are the primary community packages
- Neither package is officially maintained by the OpenTelemetry organization
- Both packages simplify OTel adoption but may lag behind upstream SDK releases
- Official `open-telemetry/opentelemetry-auto-laravel` provides auto-instrumentation as a contrib package

## Verification
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
