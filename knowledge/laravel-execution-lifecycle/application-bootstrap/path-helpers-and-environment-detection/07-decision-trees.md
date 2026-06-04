# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Application Bootstrap
**Knowledge Unit:** Path Helpers and Environment Detection
**Generated:** 2026-06-03

---

# Decision Inventory

1. Path Reference: Path helpers vs hardcoded absolute paths
2. Path Override Timing: `register()` vs `boot()` for path customization
3. Test Context Detection: `runningUnitTests()` vs `$app->environment('testing')`
4. Package Path Strategy: `__DIR__` vs application path helpers in packages

---

# Architecture-Level Decision Trees

---

## Decision Name: Path Reference Strategy

---

## Decision Context

Choosing between path helpers (`basePath()`, `storage_path()`, etc.) and hardcoded absolute filesystem paths.

---

## Decision Criteria

* performance — path helpers are O(1) container lookups — negligible
* architectural — path helpers resolve from container bindings, supporting runtime override
* security — hardcoded paths can enable directory traversal if not validated
* maintainability — path helpers adapt to any deployment layout; hardcoded paths break on move

---

## Decision Tree

Is the code referencing a framework-managed directory (storage, config, app, resources)?
↓
YES → Use path helper (`storage_path()`, `config_path()`, `app_path()`, etc.)
NO → Is the path referencing a runtime-generated or temporary file?
↓
YES → Use `storage_path('app/temp/...')` or `sys_get_temp_dir()` for truly temporary files
NO → Is the path in a third-party configuration file (Nginx, Supervisor) that cannot run PHP?
↓
YES → Hardcoded absolute path is unavoidable — document the path assumption clearly
NO → Use path helper — always prefer the abstraction

---

## Rationale

Hardcoded absolute paths break when the application is deployed to a different environment, moved to a different server directory, or packaged in a serverless artifact. Path helpers resolve dynamically from container bindings, supporting runtime override and environment-specific customization. The `'path.*'` binding system makes path customization accessible via `$app->make('path.storage')` or `$app->bound('path.storage')`.

---

## Recommended Default

**Default:** `storage_path('logs/laravel.log')` instead of `/var/www/app/storage/logs/laravel.log`.
**Reason:** Adapts to any deployment layout; works identically across local dev, CI, staging, and production.

---

## Risks Of Wrong Choice

- Hardcoded paths: deployment to non-default directories fails silently — logs write to wrong locations, file operations throw.
- Path helpers in `config/*.php` with `config:cache`: path values are resolved at cache-build time, not runtime — the cached path may differ from the actual deployment path.
- Using `app_path()` in package code: resolves to host app directory, not package directory.

---

## Related Rules

- Always use path helpers instead of hardcoded absolute filesystem paths (05-rules.md, Rule 1)
- Never use path helpers inside `config/*.php` when `config:cache` is used (05-rules.md, Rule 5)
- Never use `app_path()` or other application path helpers in package code (05-rules.md, Rule 3)

---

## Related Skills

- Customize Application Paths for Non-Standard Deployments (06-skills.md)

---

## Decision Name: Path Override Timing

---

## Decision Context

Choosing when to register custom path overrides — in `register()` vs `boot()` of a service provider.

---

## Decision Criteria

* performance — no meaningful difference
* architectural — path bindings are consumed by `LoadConfiguration` bootstrapper
* security — late overrides may not be applied to config files
* maintainability — early registration ensures consistency

---

## Decision Tree

Does the path customization affect config file resolution (e.g., custom `configPath()`)?
↓
YES → Override in `register()` — before `LoadConfiguration` bootstrapper runs
NO → Does the path customization affect storage or runtime behavior?
↓
YES → Override in `register()` — still safe, but `boot()` works for non-config paths
NO → Is the path override environment-specific (e.g., different storage for local vs production)?
↓
YES → Override in `register()` using `$app->environment()` or `$app->runningInConsole()` checks
NO → Override in `register()` — the earliest safe point in the lifecycle

---

## Rationale

Path overrides in `boot()` are too late for config files that use path helpers. When `LoadConfiguration` runs (the second bootstrapper), it executes `config/*.php` files which may call `storage_path()`, `config_path()`, etc. If the path override happens in `boot()` (which runs during `BootProviders`, the last bootstrapper), config files resolve with the default paths. Always override in `register()` to ensure path bindings are set before any config file executes.

---

## Recommended Default

**Default:** Always call `$app->useStoragePath()`, `$app->useConfigPath()`, etc. in `register()` — never in `boot()`.
**Reason:** Guarantees path overrides are applied before `LoadConfiguration` consumes them.

---

## Risks Of Wrong Choice

- Path override in `boot()`: config files resolved with default paths; cached config (if rebuilt) may still use defaults.
- Path override after `config:cache`: cached config has stale path values; must clear cache and re-cache after overriding paths.
- Not verifying writability after path override: `storage_path()` returns custom path that may not be writable in serverless environments.

---

## Related Rules

- Customize application paths early in `register()` (05-rules.md, Rule 4)
- Always verify `storage_path()` writability (05-rules.md, Rule 6)

---

## Related Skills

- Customize Application Paths for Non-Standard Deployments (06-skills.md)

---

## Decision Name: Test Context Detection Strategy

---

## Decision Context

Choosing between `$app->runningUnitTests()` and `$app->environment('testing')` for detecting whether code is executing in a PHPUnit/Pest test context.

---

## Decision Criteria

* performance — both are effectively free
* architectural — `runningUnitTests()` checks PHPUnit-specific indicators; `environment()` only checks `APP_ENV`
* security — false positives of `environment('testing')` can expose test-only code in production
* maintainability — `runningUnitTests()` is more reliable and semantically correct

---

## Decision Tree

Do you need to detect the PHPUnit/Pest test runner specifically?
↓
YES → Use `$app->runningUnitTests()` — checks PHPUnit-specific environment variables
NO → Do you need environment-specific behavior that should also apply outside PHPUnit (e.g., Dusk browser tests)?
↓
YES → Use `$app->environment('testing')` — broader scope includes non-PHPUnit test scenarios
NO → Are you concerned about `APP_ENV=testing` being set at the system level in production?
↓
YES → Always use `runningUnitTests()` — `APP_ENV=testing` alone could be set accidentally
NO → Use `runningUnitTests()` for test-specific logic; `environment('testing')` for environment-specific behavior

---

## Rationale

`runningUnitTests()` checks for PHPUnit-specific environment variables (`PHPUNIT_COMPOSER_INSTALL`, `__PHPUNIT_PHAR__`) in addition to `APP_ENV`. The environment check alone can produce false positives if `APP_ENV` is set to `'testing'` at the system level during normal web requests, or false negatives if `APP_ENV` is not set but PHPUnit is running.

---

## Recommended Default

**Default:** `$app->runningUnitTests()` for test-specific logic (mock registrations, disabled mailers).
**Reason:** Reliable — checks PHPUnit-specific indicators, not just the `APP_ENV` value.

---

## Risks Of Wrong Choice

- Using `environment('testing')` alone: test-specific code (mock registrations, disabled mailers) accidentally executes in production if `APP_ENV` is ever set to `'testing'` at the system level.
- Using `runningUnitTests()` when `APP_ENV=testing` for non-PHPUnit tests: test-only bindings are not registered, causing test failures in Dusk or custom test runners.
- Not using either: test-specific code runs in all environments, potentially disabling security features or sending test emails in production.

---

## Related Rules

- Prefer `runningUnitTests()` over `APP_ENV === 'testing'` for test context detection (05-rules.md, Rule 2)
- Never use `app_path()` or other application path helpers in package code (05-rules.md, Rule 3)

---

## Related Skills

- Customize Application Paths for Non-Standard Deployments (06-skills.md)
