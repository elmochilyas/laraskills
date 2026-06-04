# Rules: Package Service Provider Patterns

## Metadata
- **Source KU:** package-service-provider-patterns
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PROVIDER-RULE-001: **register() for bindings only** — No resolved instances, no side effects. Only `$this->app->bind()`, `$this->app->singleton()`, and `mergeConfigFrom()`.
- PROVIDER-RULE-002: **boot() for registration** — Views, routes, migrations, events, commands. Any logic that depends on resolved services.
- PROVIDER-RULE-003: **Deferred for binding-only providers** — Set `protected $defer = true` for packages that only register bindings without boot logic.
- PROVIDER-RULE-004: **Never resolve container in register()** — Not all services are bound yet. Use `boot()` for any resolved instances.
- PROVIDER-RULE-005: **Call parent::register()/boot()** — When overriding, must call parent methods. Otherwise Spatie tools' specification processing is skipped.

## Architecture Rules
- PROVIDER-RULE-006: **Single provider pattern** — One provider per package. Split only for clear functional separation (e.g., separate web and API).
- PROVIDER-RULE-007: **Singleton binding pattern** — `$this->app->singleton(Contract::class, Concrete::class)` for primary service classes.
- PROVIDER-RULE-008: **Conditional registration** — Use `if ($this->app->runningInConsole())` guards for environment-appropriate resource registration.
- PROVIDER-RULE-009: **Provider base class** — Use Spatie's PackageServiceProvider for most packages. Laravel's base for deferred-only needs.

## Performance Rules
- PROVIDER-RULE-010: **Deferred providers reduce boot time** — Every eager-loaded provider adds to boot time. Deferred providers are underutilized.
- PROVIDER-RULE-011: **Heavy boot() operations** — Don't do DB queries, API calls, or file I/O in `boot()`. Defer to lazy evaluation or event listeners.

## Anti-Pattern Rules
- PROVIDER-RULE-012: **Avoid everything in boot()** — Bypasses register/boot separation and causes ordering issues.
- PROVIDER-RULE-013: **Avoid giant provider classes** — 500+ lines handling all concerns. Split into traits or separate classes.
- PROVIDER-RULE-014: **Avoid runtime logic in register()** — No API calls, DB queries, or I/O. Register phase is for binding only.
