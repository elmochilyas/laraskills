# Skill: Implement Config File Merging and Publishing for Laravel Packages

## Purpose
Set up proper configuration file merging (`mergeConfigFrom()` in `register()`) and tagged publishing for Laravel packages, ensuring config defaults are always available and consumers can customize them.

## When To Use
- Any Laravel package with configurable options
- Package needs to provide sensible defaults that work without publishing
- Package consumers need visibility into available configuration options

## When NOT To Use
- Packages with no configurable options (fully automatic behavior)
- Internal-only packages where configuration is hardcoded
- Configuration managed through database rather than config files

## Prerequisites
- Package service provider
- Config file at `config/package-name.php` in package root

## Inputs
- Config file with documented defaults
- Package namespace prefix
- List of config options that need `env()` calls

## Workflow (numbered)
1. **Create config file** — Place at `config/package-name.php` with snake_case keys, dot-notation hierarchy, and inline documentation
2. **Set sensible defaults** — Every option must have a safe default; package works without publishing
3. **Call mergeConfigFrom() in register()** — `$this->mergeConfigFrom(__DIR__.'/../config/package-name.php', 'package-name')`
4. **Set up tagged publishing** — `$this->publishes([__DIR__.'/../config/package-name.php' => config_path('package-name.php')], 'package-name-config')`
5. **Verify env() placement** — `env()` calls only in published config files, not in unpublished defaults; use `env()` with no fallback for sensitive options
6. **Document new options** — When adding config options in updates, document in release notes; merging provides new defaults over published files

## Validation Checklist
- [ ] `mergeConfigFrom()` called in `register()`, not `boot()`
- [ ] Config publishing uses specific tag (`--tag=package-name-config`)
- [ ] Package works without publishing — defaults cover all options
- [ ] `env()` calls only in published config, not unpublished defaults
- [ ] Config namespace unique and prefixed with package name
- [ ] Config file has inline documentation for each option
- [ ] Secrets use `env()` with no fallback (placeholder to force explicit config)

## Common Failures
- **mergeConfigFrom() in boot()** — config unavailable to other providers during their boot phase
- **Not tagging config publishing** — consumers can't publish config independently
- **env() in unpublished config** — `env()` evaluated during merge; stale after config:cache
- **Config key collisions** — two packages using same top-level key; always namespace with package name

## Decision Points
- Single file vs multiple files: single for < 20 options; multiple for separable configuration domains
- env() vs plain values: `env()` for deployment-specific values; plain defaults for non-sensitive options
- Publishable vs internal: only make publishable what consumers need to customize

## Performance/Security Considerations
- `mergeConfigFrom()` is an array merge operation (microseconds per package); no performance concern
- `env()` in unpublished config is evaluated during merge; stale after `config:cache`
- Production deployments must run `php artisan config:cache` for optimal config access
- Never put secrets in config defaults; use `env()` with documented required variables
- Sensitive config options: use `env()` with no fallback to force explicit configuration

## Related Rules (from 05-rules.md)
- CONFIG-RULE-001: mergeConfigFrom() in register()
- CONFIG-RULE-002: Tagged publishing
- CONFIG-RULE-003: Sensible defaults
- CONFIG-RULE-004: env() only in published config
- CONFIG-RULE-005: Unique config namespace
- CONFIG-RULE-011: env() staleness

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Implement Service Provider Registration (register vs boot)
- Create Install Commands for Laravel Packages

## Success Criteria
- Package config accessible via `config('package-name.key')` without publishing
- Tagged publishing works independently (`php artisan vendor:publish --tag=package-name-config`)
- `php artisan config:cache` succeeds without env() staleness issues
- No config key collisions with other packages
- Zero security incidents from secrets in config defaults

---

# Skill: Create Install Commands for Laravel Packages

## Purpose
Build a single-step `php artisan package-name:install` command that publishes config files, migrations, and assets, runs setup operations, and guides the developer through the initial configuration.

## When To Use
- Package has config files, migrations, or assets that need publishing
- Package requires initial setup beyond simple publishing
- Developer experience is a priority

## When NOT To Use
- Package auto-discovers and works immediately without setup
- Internal packages where consumers know manual steps
- Package where only `.env` changes are needed

## Prerequisites
- Package service provider (Spatie Package Tools recommended)
- Spatie laravel-package-tools for `InstallCommand` class
- Config files and migrations ready for publishing

## Inputs
- Package name and namespace
- List of publishable resources (config, migrations, assets)
- Setup steps (directory creation, key generation)
- Post-install documentation content

## Workflow (numbered)
1. **Create InstallCommand class** — Extend `Spatie\LaravelPackageTools\Commands\InstallCommand`
2. **Define publish steps** — Chain `publishConfigFile()`, `publishMigrations()`, `publishAssets()` with specific tags
3. **Add interactive prompts** — `askToRunMigrations()`, `askToStarOnGitHub()` (open-source only); ensure all prompts work with `--no-interaction`
4. **Add post-install summary** — Display available commands, config keys, documentation links via `info()` blocks
5. **Register in provider** — `->hasInstallCommand(InstallCommand::class)` in `configurePackage()`
6. **Verify idempotency** — Run install command multiple times; no data loss, no duplicate files, no errors
7. **Test non-interactive** — Run with `--no-interaction` flag; verify defaults are used and no prompts block CI

## Validation Checklist
- [ ] Install command registered as `package-name:install`
- [ ] Works with `--no-interaction` flag (CI-compatible)
- [ ] Publishing uses specific tags, not "publish everything"
- [ ] Existing published files not overwritten without confirmation or `--force`
- [ ] Progress feedback provided during execution
- [ ] Post-install summary shows commands, config keys, next steps
- [ ] Command is idempotent (safe to run multiple times)
- [ ] Migration execution is optional or confirmable
- [ ] No sensitive information exposed in output

## Common Failures
- **Non-interactive mode broken** — prompts block CI/CD; ensure defaults work with `--no-interaction`
- **Silently overwriting published files** — consumer loses customizations; always ask before overwrite
- **No progress feedback** — users think command frozen; use `info()`, `newLine()`, `warn()`
- **Publishing without tags** — may overwrite other packages' files; use `--tag=package-name-config`

## Decision Points
- Prompt depth: minimal prompts for standard install; optional verbose mode for advanced
- Migration strategy: prompt to run migrations now vs later; support CI with `--no-interaction`
- Overwrite strategy: always ask → default no; `--force` for automation; `--no-interaction` skips prompts

## Performance/Security Considerations
- Install completes in under 5 seconds (config-only) or under 30 seconds (with migrations)
- Install runs once on setup; no runtime performance impact
- No sensitive info in output or prompts
- Destructive operations (migrations) require confirmation
- Install command should not modify `.env` files or expose credentials

## Related Rules (from 05-rules.md)
- INSTALL-RULE-001: Install command for packages with publishable resources
- INSTALL-RULE-002: Idempotent
- INSTALL-RULE-003: Non-interactive mode
- INSTALL-RULE-004: Ask before overwriting
- INSTALL-RULE-005: Tagged publishing

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- Implement Config File Merging and Publishing
- Write Custom Artisan Commands for Laravel

## Success Criteria
- `php artisan package-name:install` sets up the package completely in one command
- CI/CD deployments succeed with `php artisan package-name:install --no-interaction`
- Running install twice produces no errors and no data loss
- Post-install output clearly shows what was installed and how to use the package
