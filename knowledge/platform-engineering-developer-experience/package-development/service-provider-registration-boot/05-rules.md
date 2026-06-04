# Rules: Service Provider Registration (register vs boot)

## Metadata
- **Source KU:** service-provider-registration-boot
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- REGBOOT-RULE-001: **register() is for bindings only** — `$this->app->bind()`, `$this->app->singleton()`, `mergeConfigFrom()`. No resolved instances.
- REGBOOT-RULE-002: **boot() for registration that needs resolved services** — Views, routes, migrations, events, commands. Services are available here.
- REGBOOT-RULE-003: **Deferred for binding-only providers** — Set `protected $defer = true`. Eliminates boot time overhead when bindings aren't used.
- REGBOOT-RULE-004: **No resolved services in register()** — Calling `app('config')` or `$this->app->make()` in `register()` may fail because services aren't bound yet.
- REGBOOT-RULE-005: **No heavy I/O in register() or boot()** — DB queries, API calls, file operations run on every request. Defer to lazy evaluation or event listeners.

## Architecture Rules
- REGBOOT-RULE-006: **mergeConfigFrom() in register()** — Config merged in `boot()` is unavailable to earlier-booting providers.
- REGBOOT-RULE-007: **Boot method injection** — Use type-hinted parameters in `boot()` rather than `$this->app->make()`. Cleaner and testable.
- REGBOOT-RULE-008: **Split complex boot() into methods** — `bootCommands()`, `bootViews()`, `bootRoutes()` for organization and testability.
- REGBOOT-RULE-009: **Conditional registration guards** — Use `if ($this->app->runningInConsole())` or environment checks in `boot()` for environment-specific resources.
- REGBOOT-RULE-010: **Deferred providers implement provides()** — Must return all bindings the provider handles so Laravel knows when to load it.

## Performance Rules
- REGBOOT-RULE-011: **Deferred providers reduce memory** — 50+ eager providers can add ~1-2MB to baseline memory. Deferred reduces this.
- REGBOOT-RULE-012: **Deferred providers underutilized** — Most binding-only packages don't set `$defer = true`. Always consider it.

## Anti-Pattern Rules
- REGBOOT-RULE-013: **Avoid everything in boot()** — Bypasses register/boot separation and causes ordering issues.
- REGBOOT-RULE-014: **Avoid constructor injection in providers** — Container isn't fully populated during construction. Injections may fail.
- REGBOOT-RULE-015: **Avoid deferred providers with boot()** — Deferred providers never execute `boot()`. Boot logic is silently skipped.
- REGBOOT-RULE-016: **Avoid register() as initialization** — No side effects in register(). Bindings and mergeConfigFrom() only.
