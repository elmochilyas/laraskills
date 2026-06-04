# Skill: Customize Application Paths for Non-Standard Deployments

## Purpose

Override the default Laravel directory layout by customizing `basePath()`, `storagePath()`, `configPath()`, `appPath()`, and other path helpers in serverless, Docker, monorepo, or enterprise deployments where the standard directory structure does not apply.

## When To Use

- Deploying Laravel on serverless platforms (Vapor, Lambda) with read-only filesystems
- Running Laravel in Docker with custom mount points for storage
- Using a monorepo structure where the application root differs from the framework default
- Building Phar distributions or embedded Laravel applications
- Changing the `app/` directory name (e.g., `src/` instead of `app/`)
- Separating storage to a dedicated volume or network mount

## When NOT To Use

- Using custom paths to work around deployment misconfiguration — fix the deployment first
- Overriding paths in package code — packages should use `__DIR__` for their own resources
- Changing paths after configuration files have been loaded (config files may have captured stale path values)
- Expecting `storage_path()` to be writable without verifying — always check `is_writable()` in serverless environments

## Prerequisites

- Working Application instance with the standard directory layout
- Knowledge of which paths need to change for the target deployment
- Access to the service provider where path overrides will be registered
- Understanding of the `'path.*'` container binding keys

## Inputs

- The custom base path (for the entire application root)
- Custom paths for storage, config, app, bootstrap, resources, language, database, public
- The service provider class where `use*Path()` calls will be placed

## Workflow

1. Identify which paths need customization for the target deployment
2. Call path mutators in a service provider's `register()` method (before `LoadConfiguration` runs):
   - `$app->useStoragePath('/custom/storage')` — custom storage directory
   - `$app->useAppPath('src')` — custom app directory name
   - `$app->useConfigPath('/etc/laravel/config')` — custom config directory
   - `$app->useBootstrapPath('/var/cache/laravel')` — custom bootstrap cache directory
   - `$app->usePublicPath('/var/www/public')` — custom public directory
   - `$app->useDatabasePath('/var/data')` — custom database directory
   - `$app->useResourcePath('/var/resources')` — custom resources directory
   - `$app->useLangPath('/var/lang')` — custom language directory
3. If the entire application root is different, pass `basePath` to `Application::configure()` in `bootstrap/app.php`:
   `Application::configure(basePath: '/custom/root')`
4. Set base path bindings early: `$app->bindPathsInContainer()` if constructing the Application directly
5. Verify custom paths resolve correctly: `$app->make('path.storage')`, `storage_path()`, etc.
6. Ensure all config files that reference paths are compatible with the custom layout
7. Test with both `config:cache` enabled and disabled to confirm no stale path values

## Validation Checklist

- [ ] Path overrides are called in `register()` not `boot()` (before `LoadConfiguration`)
- [ ] `basePath` is passed to `Application::configure()` when the entire root moves
- [ ] `storage_path()` in the customized layout is writable (verify with `is_writable()`)
- [ ] Config files do not hardcode paths that will be stale after path customization
- [ ] Cached config (after `config:cache`) resolves correct paths at runtime
- [ ] All path helpers (`config_path()`, `resource_path()`, etc.) return the expected custom paths
- [ ] Environment-specific path overrides use `$app->environment()` branching

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `storage_path()` returns old path after customization | Config files referenced `storage_path()` during `LoadConfiguration` before the override | Move path override to `register()` before `LoadConfiguration` |
| Cached config has wrong paths | `config:cache` resolved path helpers at build time | Replace path helpers in config files with `env()` or runtime resolution in providers |
| `app_path()` returns wrong directory | Using path helper in package code | Use `__DIR__` for package-relative paths |
| Path override not applied in production | OPcode cache serves stale code without path overrides | Clear OPcache after deployment; verify path overrides in `register()` |
| `dirname(__DIR__, 3)` path resolution wrong | Non-standard vendor directory structure | Pass explicit `basePath` to `Application::configure()` |

## Decision Points

- **`basePath` in `configure()` vs `use*Path()` in providers** — Use `basePath` when the entire project root moves; use `use*Path()` for specific subdirectory overrides
- **Early vs late path override** — Always override in `register()` (before `LoadConfiguration`); overrides in `boot()` are too late for config files that use path helpers

## Performance Considerations

- Path overrides add one additional container binding per customized path — negligible cost
- Path helper methods are O(1) lookups after the first call
- In Octane, path overrides are set once per worker and never change — cost fully amortized

## Security Considerations

- Path override methods (`useStoragePath()`, `useAppPath()`, etc.) accept arbitrary paths — validate that custom paths do not enable directory traversal
- In serverless deployments, ensure storage paths point to writable directories (e.g., `/tmp`) — read-only filesystems cause silent write failures
- Custom `configPath()` may point to files outside version control — ensure proper file permissions

## Related Rules

- Always use path helpers instead of hardcoded absolute paths (05-rules.md, Rule 1)
- Customize application paths early in `register()` (05-rules.md, Rule 4)
- Never use path helpers inside `config/*.php` when `config:cache` is used (05-rules.md, Rule 5)
- Always verify `storage_path()` writability (05-rules.md, Rule 6)

## Related Skills

- Write Environment-Aware Service Providers (this KU)
- Debug Path Resolution Failures (this KU)
- Create a Laravel Bootstrap File (bootstrap-app-php-file)

## Success Criteria

- All path helpers return the correct custom paths for the deployment layout
- Storage directory is writable and used by all filesystem operations
- Config files resolve correct paths at runtime (not stale build-time paths)
- Application works identically with and without `config:cache`
- The non-standard directory layout is transparent to application code (no hardcoded paths)

---

# Skill: Write Environment-Aware Service Providers

## Purpose

Write service provider code that adapts its behavior to the current application environment and execution context using `environment()`, `runningInConsole()`, and `runningUnitTests()`, ensuring correct service registration per deployment target.

## When To Use

- Registering different service implementations per environment (e.g., production vs local mailer)
- Registering Artisan commands that should only be available in CLI
- Adding debug middleware or development-only services
- Configuring services differently when running unit tests vs in production
- Skipping service registration for environments where the service is not needed

## When NOT To Use

- Using `environment()` before the `LoadConfiguration` bootstrapper — reads `$_ENV['APP_ENV']` directly, not `config/app.php`
- Confusing `runningInConsole()` with `runningUnitTests()` — they detect different execution contexts
- Using environment checks to conditionally register security middleware (always register security middleware)
- Creating separate service provider classes per environment — use conditional logic within a single provider

## Prerequisites

- Understanding of `$app->environment()`, `$app->runningInConsole()`, `$app->runningUnitTests()`
- Knowledge of the two-phase provider lifecycle: `register()` and `boot()`
- Service provider registered in `config/app.php 'providers'`

## Inputs

- The service provider class with environment-aware logic
- Environment names to check (`'local'`, `'production'`, `'staging'`, `'testing'`)
- Execution context (`runningInConsole()`, `runningUnitTests()`)
- The services/bindings that differ per environment or context

## Workflow

1. In the service provider's `register()` method, add conditional binding logic:
   - `if ($this->app->environment('production')) { ... }` for deployment-specific bindings
   - `if ($this->app->runningInConsole()) { ... }` for console-only registrations (commands, CLI-specific services)
2. In the service provider's `boot()` method, add conditional configuration:
   - `if ($this->app->environment('local')) { ... }` for development-only middleware or routes
   - `if ($this->app->runningUnitTests()) { ... }` for test-specific service overrides
3. Use `$this->app->runningUnitTests()` instead of `$this->app->environment('testing')` for detecting test context
4. For multiple environment names, use array syntax: `$this->app->environment(['local', 'staging'])`
5. Ensure environment checks do not depend on services that are not yet available at the check point
6. Test each environment branch: run the application in each relevant environment and verify correct behavior

## Validation Checklist

- [ ] `runningUnitTests()` used for test detection, not `environment('testing')` alone
- [ ] Console-only registrations use `runningInConsole()`, not environment checks
- [ ] Environment strings are case-sensitive and match actual `APP_ENV` values
- [ ] No environment check depends on binding that is not yet registered
- [ ] Each environment branch produces a working application configuration
- [ ] Production environment falls back to defaults when no explicit branch exists
- [ ] Environment checks in `register()` do not access config (use `boot()` for config reads)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `config()` returns null in `register()` register | Config-dependent logic in `register()` instead of `boot()` | Move config reads to `boot()` |
| Console commands not registered | Using `environment()` instead of `runningInConsole()` | Replace with `$this->app->runningInConsole()` |
| Test-specific code runs in production | `APP_ENV=testing` set at system level | Use `runningUnitTests()` instead of `environment('testing')` |
| Environment check never matches | Case mismatch (`'Production'` vs `'production'`) | Use lowercase environment names consistently |
| Development service used in production | `else` branch missing for production fallback | Add explicit production-case logic or ensure default values are production-safe |

## Decision Points

- **`$app->environment()` vs `$_ENV['APP_ENV']`** — Use `$app->environment()` for readability and array matching; use `$_ENV['APP_ENV']` directly only when environment must be checked before config loads
- **`runningInConsole()` vs `APP_RUNNING_IN_CONSOLE`** — Use `runningInConsole()` which checks `PHP_SAPI`; override with `$_ENV['APP_RUNNING_IN_CONSOLE']` only in custom PHP SAPIs

## Performance Considerations

- Environment checks are property reads on the Application — effectively free
- Conditional registration adds zero runtime overhead (unregistered services do not consume memory or time)
- In Octane, environment checks run once per worker start, not per request

## Security Considerations

- Environment checks can be manipulated if `$_ENV` / `$_SERVER` superglobals are writable by upstream middleware
- Do not use environment checks to disable authentication or authorization — security should be environment-independent
- If `runningUnitTests()` is spoofed, test-only mock services may be used in production

## Related Rules

- Prefer `runningUnitTests()` over `APP_ENV === 'testing'` (05-rules.md, Rule 2)
- Place all config-dependent logic in `boot()` not `register()` (bootstrapper-sequence, Rule 1)
- Never use `app_path()` in package code (05-rules.md, Rule 3)

## Related Skills

- Customize Application Paths for Non-Standard Deployments (this KU)
- Configure Environment-Specific Bootstrap Logic (bootstrap-app-php-file)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

## Success Criteria

- Service provider registers correct bindings in each environment and execution context
- Console commands are registered only when running in CLI
- Test-specific overrides activate reliably during PHPUnit/Pest runs and never in production
- Environment checks use the correct method for the context being detected
- No branch produces errors when tested in its corresponding environment

---

# Skill: Debug Path Resolution Failures

## Purpose

Identify and resolve failures where Laravel path helpers (`basePath()`, `storagePath()`, `appPath()`, `configPath()`, etc.) return incorrect, non-existent, or non-writable paths.

## When To Use

- Log files are written to unexpected locations
- Route or view files are not found (404s for resources that exist)
- `config:cache` produces paths that work in CI but fail in production
- Filesystem operations throw "file not found" or "permission denied" errors
- Artisan commands fail with file resolution errors
- Application works locally but fails in deployment with path-related errors

## When NOT To Use

- General filesystem permission issues outside of path helper resolution
- Composer autoloader class resolution failures (different path resolution mechanism)
- HTTP routing 404s unrelated to path resolution

## Prerequisites

- Access to the Application container state (`$app->make('path.base')`, etc.)
- Knowledge of the directory structure on the failing environment
- Understanding of how path helpers resolve: check explicit binding → fall back to computed default
- Access to the deployment configuration (Docker, serverless, or server setup)

## Inputs

- The failing path helper call and its return value
- The expected path value
- The error message (file not found, permission denied, etc.)
- The deployment environment directory structure
- Whether `config:cache` is enabled

## Workflow

1. Identify which path helper is returning the wrong value: check `basePath()`, `storagePath()`, `appPath()`, etc.
2. Check the explicit path binding: `$app->bound('path.storage')` and `$app->make('path.storage')`
3. If no explicit binding, check the computed default: `$this->basePath.DIRECTORY_SEPARATOR.'{dir}'`
4. If `basePath()` is wrong, verify the `basePath` argument passed to `Application::configure()` or `new Application()`
5. Check if a path override (`$app->useStoragePath()`) is being called too late (in `boot()` instead of `register()`)
6. If the error only occurs with `config:cache`, check `config/*.php` files for path helper calls — they are resolved at build time, not runtime
7. If the error is environment-specific, compare the directory structure between environments
8. Verify file permissions: `is_readable()`, `is_writable()` on the resolved path

## Validation Checklist

- [ ] `$app->make('path.base')` returns the correct project root
- [ ] All custom path overrides are called before `LoadConfiguration` (in `register()`)
- [ ] Config files do not contain path helper calls (or `config:cache` is not used)
- [ ] Storage path is writable: `is_writable(storage_path()) === true`
- [ ] Route files exist at the paths passed to `withRouting()`
- [ ] `basePath` argument matches the actual directory structure in the failing environment
- [ ] OPcache cleared after any path changes

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `storage_path()` returns wrong value in production | Path override placed in `boot()` — too late for config files | Move to `register()` |
| Cached config has stale build-time paths | `config:cache` resolved `base_path()` at build time | Replace path helpers in config files with config values or `env()` |
| `dirname(__DIR__, 3)` resolves incorrectly | Non-standard vendor directory structure | Pass explicit `basePath` to `Application::configure()` |
| Path helpers return correct values but file operations fail | Filesystem permissions or non-existent directory | Verify `is_readable()` and `is_writable()`; create directory if needed |
| Custom path works locally but not on server | Different directory structure between environments | Use environment variables or conditional path overrides per environment |

## Decision Points

- **Explicit binding vs computed default** — Check `$app->bound('path.storage')` to determine if the path is explicitly set or computed; explicit bindings take priority
- **Build-time vs runtime path** — If `config:cache` is enabled and the error is path-related, the config files likely captured build-time paths that differ from runtime paths

## Performance Considerations

- Path helper resolution is O(1) — checking `bound()` and `make()` is negligible
- The debug process itself does not impact production performance (analysis only)

## Security Considerations

- Path resolution failures may expose filesystem structure in error messages
- Ensure directory traversal is not possible through path helper manipulation
- In serverless deployments, path resolution may return paths that exist at build time but not at runtime — test with a read-only filesystem scenario

## Related Rules

- Always use path helpers instead of hardcoded absolute paths (05-rules.md, Rule 1)
- Customize application paths early in `register()` (05-rules.md, Rule 4)
- Never use path helpers inside `config/*.php` when `config:cache` is used (05-rules.md, Rule 5)
- Always verify `storage_path()` writability (05-rules.md, Rule 6)

## Related Skills

- Customize Application Paths for Non-Standard Deployments (this KU)
- Write Environment-Aware Service Providers (this KU)
- Debug Bootstrap File Failures (bootstrap-app-php-file)

## Success Criteria

- All path helpers return correct paths matching the deployment directory structure
- Storage path is writable and used consistently by all filesystem operations
- Config files resolve runtime paths correctly (not stale build-time paths)
- Path resolution works identically across all environments
- No path-related file operations fail in production
