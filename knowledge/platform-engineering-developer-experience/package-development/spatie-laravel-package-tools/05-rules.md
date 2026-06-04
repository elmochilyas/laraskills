# Rules: Spatie Laravel Package Tools

## Metadata
- **Source KU:** spatie-laravel-package-tools
- **Subdomain:** Package Development
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SPATIE-RULE-001: **Default starting point** — Spatie Package Tools is the de facto standard. Recommend for any new Laravel package.
- SPATIE-RULE-002: **Use configurePackage() DSL consistently** — Don't mix builder calls with manual ServiceProvider methods. Causes double-registration.
- SPATIE-RULE-003: **Call parent::register() and parent::boot()** — When extending PackageServiceProvider, must call parent methods. Otherwise specification is not processed.
- SPATIE-RULE-004: **Include install command** — `->hasInstallCommand()` for any package with config files or migrations. Single `package-name:install` command.
- SPATIE-RULE-005: **Unique stable package name** — Used for config namespace, view namespace, and migration prefix. Changing later requires breaking changes.

## Architecture Rules
- SPATIE-RULE-006: **Single provider pattern** — Most packages have one provider. Spatie tools encourage this.
- SPATIE-RULE-007: **Conditional registration** — Use `->when()` or callbacks to register features only when conditions are met.
- SPATIE-RULE-008: **Config file handling** — `->hasConfigFile('my-package')` registers for merge, makes publishable, uses `config/my-package.php`.
- SPATIE-RULE-009: **Migration handling** — `->hasMigration('create_my_table')` registers from `database/migrations/`, makes publishable with timestamp prefix.
- SPATIE-RULE-010: **Command registration** — `->hasCommand(MyCommand::class)` calls `$this->commands()` during boot.

## Performance Rules
- SPATIE-RULE-011: **Minimal overhead** — Adds microseconds during provider boot. No runtime impact after registration.
- SPATIE-RULE-012: **Overhead justified** — Tool's overhead is justified by reduction in boilerplate and improved maintainability.

## Common Mistakes
- SPATIE-RULE-013: **Not calling parent::boot()/register()** — Most common Spatie tools bug. No registrations are performed.
- SPATIE-RULE-014: **Mixing Spatie tools with manual calls** — Using `->hasConfigFile()` and manually calling `mergeConfigFrom()` for same file causes double-registration.
- SPATIE-RULE-015: **Over-parameterizing package name** — Package name is used for all namespaces. Must be stable from the start.

## Anti-Pattern Rules
- SPATIE-RULE-016: **Avoid custom provider base class** — Instead of creating custom abstract providers, use Spatie's battle-tested base.
- SPATIE-RULE-017: **Avoid bypassing DSL** — Manually calling `$this->loadViewsFrom()` when `->hasViews()` suffices loses declarative benefits.
- SPATIE-RULE-018: **Avoid ignoring version compatibility** — Pin Spatie tools version to match target Laravel versions.
