# Skill: Create a Laravel Bootstrap File

## Purpose

Write and maintain the `bootstrap/app.php` file — the single entry point configuration file that creates the Laravel Application instance for all execution contexts (HTTP, Artisan, Octane, queue workers).

## When To Use

- Setting up a new Laravel 11+ application's bootstrap file
- Migrating a Laravel 10 or earlier `bootstrap/app.php` to the modern `Application::configure()` API
- Adding routing, middleware, or exception handling configuration to an existing bootstrap file
- Reviewing or auditing the bootstrap file for correctness and security

## When NOT To Use

- Placing business logic or heavy computation inside the file
- Adding `dd()`, `var_dump()`, or `echo` calls (corrupts HTTP output)
- Calling `$app->make()` or `resolve()` before the bootstrapper sequence
- Hardcoding secrets (API keys, passwords) in the file
- Moving the file without updating base path references

## Prerequisites

- Laravel 11+ application
- Composer autoloader set up
- Directory structure with `bootstrap/`, `routes/`, `config/` directories
- Understanding of `Application::configure()` and the builder chain

## Inputs

- The `basePath` for the application (defaults to `dirname(__DIR__)` from `bootstrap/app.php`)
- Route file paths for web, API, console, and health routes
- Middleware configuration (global middleware, aliases, groups)
- Exception handling configuration (report, render, dontReport)
- Singleton and binding arrays for container pre-configuration

## Workflow

1. Open (or create) `bootstrap/app.php`
2. Add the `declare(strict_types=1)` directive and required `use` imports for `Application`, `Exceptions`, and `Middleware` (and `Configuration\Routing` if needed)
3. Start with `return Application::configure(basePath: dirname(__DIR__))` — this creates the ApplicationBuilder
4. Chain `->withRouting()` to specify route file locations:
   - `web:` for `routes/web.php`
   - `api:` for `routes/api.php`
   - `commands:` for `routes/console.php`
   - `health:` for the health check URI path
5. Chain `->withMiddleware()` to configure middleware (use a closure receiving `Middleware $middleware`)
6. Chain `->withExceptions()` to configure exception handling (use a closure receiving `Exceptions $exceptions`)
7. Chain `->withCommands()` if registering Artisan command classes at bootstrap level
8. Chain `->withSingletons()` and/or `->withBindings()` for simple container mappings
9. Terminate with `->create()` — this returns the configured Application instance
10. Ensure only the `return` statement is the file's output (no `echo`, `dd()`, or global assignment)

## Validation Checklist

- [ ] File returns an `Illuminate\Foundation\Application` instance (not `ApplicationBuilder`)
- [ ] `->create()` is the final method call in the builder chain
- [ ] No `dd()`, `var_dump()`, `echo` present in the file
- [ ] No `$app->make()` calls for non-base bindings
- [ ] No secrets hardcoded in the file
- [ ] All route file paths exist and are correct relative to the base path
- [ ] `php -l bootstrap/app.php` passes syntax check
- [ ] `php artisan about` succeeds with the current bootstrap file
- [ ] Builder chain is minimal — only includes methods for subsystems the application uses
- [ ] Environment-specific logic uses `$app->runningInConsole()` or `$app->environment()`

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Entry point returns type error | Missing `->create()` — builder returned instead of Application | Append `->create()` to chain |
| HTTP response corrupted | `dd()` or `echo` in builder closure | Remove debug output; use logging instead |
| Routes not loading | `withRouting()` configured but files don't exist | Verify route file paths and directory structure |
| `BindingResolutionException` on first request | Code in bootstrap file calls `$app->make()` before bootstrappers run | Move resolution code to service provider |
| `Cannot modify header information` warning | Output produced before kernel handles request | Remove all output-producing statements from bootstrap file |

## Decision Points

- **Environment branching in bootstrap** — Use `$app->environment('production')` for deployment-specific config; use `$app->runningInConsole()` for CLI-vs-HTTP differences
- **Builder registration vs service provider** — Use builder for simple configuration declarations (route files, middleware, exceptions, simple bindings); use service providers for complex registration logic

## Performance Considerations

- File inclusion overhead: ~0.1ms with OPcache — negligible
- Builder chain overhead: ~0.3ms for a typical 5-method chain
- In Octane, the file runs once per worker startup — cost fully amortized
- The file is not cached (unlike config/events/routes) — must execute on every FPM request

## Security Considerations

- `.env` is NOT loaded when `bootstrap/app.php` executes — environment variables are not yet available
- Never hardcode secrets — the file is tracked in version control and stored in OPcache dumps
- The base path detection uses `realpath()` which resolves symlinks — ensure the resolved path does not expose unintended directories
- In serverless deployments (Vapor), the file must work on read-only filesystems — verify no write operations

## Related Rules

- Always `return` the Application from `bootstrap/app.php` (05-rules.md, Rule 1)
- Never use `dd()`, `var_dump()`, `echo` in `bootstrap/app.php` (05-rules.md, Rule 2)
- Keep the builder chain minimal (05-rules.md, Rule 3)
- Never hardcode secrets in `bootstrap/app.php` (05-rules.md, Rule 4)
- Never call `$app->make()` before bootstrapper sequence completes (05-rules.md, Rule 5)

## Related Skills

- Configure Application via ApplicationBuilder (application-builder-configuration)
- Bootstrap a Laravel Application Instance (application-class-construction)
- Debug Bootstrap File Failures (this KU)

## Success Criteria

- `bootstrap/app.php` returns a correctly configured Application instance
- All three entry points (`index.php`, `artisan`, Octane) load the application without errors
- Routing, middleware, and exceptions are configured as specified
- No bootstrap file changes are needed between environments (configuration uses environment variables)
- `php artisan about` succeeds and displays correct application information

---

# Skill: Configure Environment-Specific Bootstrap Logic

## Purpose

Write conditional configuration in `bootstrap/app.php` that adapts routing, middleware, exception handling, and container bindings per environment (local, staging, production) and per execution context (HTTP vs CLI vs Octane).

## When To Use

- Registering commands only when running in console (`php artisan`)
- Configuring different middleware groups per environment
- Adding debug middleware only in local development
- Skipping broadcasting configuration in environments that don't use it
- Adapting exception handling verbosity based on `APP_DEBUG`

## When NOT To Use

- Using environment-specific logic that depends on resolved services (use service providers instead)
- Creating separate `bootstrap/app.production.php` files — use a single file with branching
- Placing environment-specific business logic in bootstrap — keep it in service providers
- Relying on `config()` inside environment checks — config is not loaded yet

## Prerequisites

- Working `bootstrap/app.php` with `Application::configure()` builder chain
- Understanding of `$app->runningInConsole()` and `$app->environment()` methods
- Awareness that `.env` is not yet loaded when `bootstrap/app.php` executes

## Inputs

- The Application instance (available inside the builder chain and closures)
- Environment names to check (`'local'`, `'production'`, `'staging'`, etc.)
- Execution context (`runningInConsole()`, `runningUnitTests()`)

## Workflow

1. Identify which configuration parts differ per environment or context
2. Use `$app->runningInConsole()` to guard console-only configuration (e.g., `withCommands()`)
3. Use `$app->environment('production')` for deployment-environment-specific configuration
4. Use `$app->runningUnitTests()` (not `$app->environment('testing')`) for test-specific behavior
5. Structure conditional logic inside the builder chain — not by creating multiple bootstrap files
6. Use the `->when($condition, $callback)` pattern if available in your Laravel version, or wrap conditional method calls in `if` blocks:

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        if (app()->environment('local')) {
            $middleware->append(\App\Http\Middleware\LocalDebug::class);
        }
    })
    ->withExceptions(function (Exceptions $exceptions) {
        if (! app()->environment('production')) {
            $exceptions->reportable(function (\Throwable $e) {
                // Verbose reporting for non-production
            });
        }
    })
    ->create();
```

## Validation Checklist

- [ ] Environment checks use `$app->environment()` not `config('app.env')`
- [ ] `runningUnitTests()` preferred over `$app->environment('testing')`
- [ ] No environment-specific logic depends on resolved services
- [ ] All environments use a single `bootstrap/app.php` file
- [ ] Conditional branches are tested in CI for each environment
- [ ] Environment name strings are correct (case-sensitive)

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| `config()` returns null in environment check | Config not loaded yet | Use `$app->environment()` which reads `$_ENV['APP_ENV']` directly |
| Condition never true | Misspelled environment name | Verify exact `APP_ENV` value (case-sensitive) |
| Middleware registered in wrong environment | `runningInConsole()` incorrectly assumed | Use explicit `$app->environment('local')` check |
| Different bootstrap files per environment | Copy-pasted bootstrap for each env | Consolidate into single file with branching |

## Decision Points

- **Environment branching vs separate files** — Always use a single file with conditional branching; separate files become out of sync and increase maintenance burden
- **`$app->environment()` vs `$_ENV['APP_ENV']`** — Both work at bootstrap time; `$app->environment()` is preferred for readability and supports array matching: `$app->environment(['local', 'staging'])`

## Performance Considerations

- Environment checks are property reads — effectively free
- Conditional builder methods add only the cost of the methods that actually execute
- Unused conditional branches add zero runtime overhead (but may impact code readability)

## Security Considerations

- Environment names are case-sensitive — `'Production'` does not match `'production'`
- `$app->environment()` reads from `$_ENV['APP_ENV']` before config loads — this can be manipulated by upstream middleware or PHP configuration
- Do not use environment checks to conditionally disable security middleware — security middleware should always run

## Related Rules

- Keep the builder chain minimal (05-rules.md, Rule 3)
- Prefer `runningUnitTests()` over `APP_ENV === 'testing'` (path-helpers-and-environment-detection, Rule 2)

## Related Skills

- Configure Application via ApplicationBuilder (application-builder-configuration)
- Write Environment-Aware Service Providers (path-helpers-and-environment-detection)
- Create a Laravel Bootstrap File (this KU)

## Success Criteria

- Single `bootstrap/app.php` file works across all environments without modifications
- Console-only configuration (commands) is guarded by `runningInConsole()`
- Environment-specific middleware and exception handling is correctly applied
- No environment configuration leaks between different deployment targets

---

# Skill: Debug Bootstrap File Failures

## Purpose

Diagnose and resolve failures originating from `bootstrap/app.php` that prevent the Laravel application from starting correctly across any entry point.

## When To Use

- Entry points (`index.php`, `artisan`, Octane) crash immediately
- PHP syntax errors in `bootstrap/app.php`
- Type errors where `ApplicationBuilder` is returned instead of `Application`
- `BindingResolutionException` from code inside `bootstrap/app.php`
- HTTP response corrupted with early output from bootstrap file
- Bootstrap file works locally but fails in production (OPcache or path issues)

## When NOT To Use

- Errors that occur after the Application instance is returned to the entry point (belong to kernel or bootstrapper debugging)
- Configuration loading or environment variable errors (belong to bootstrapper-sequence debugging)
- General PHP errors unrelated to bootstrap file execution

## Prerequisites

- Access to the error message and stack trace
- File permissions to read `bootstrap/app.php` and the entry point files
- Ability to run `php -l` for syntax checking
- Access to the production environment (for environment-specific failures)

## Inputs

- The error message, stack trace, and HTTP response status code
- The `bootstrap/app.php` file contents
- The entry point file that requires the bootstrap file (`public/index.php`, `artisan`)
- The deployment environment configuration (OPcache settings, PHP version, file permissions)

## Workflow

1. Check the error type:
   - Parse/syntax error: Run `php -l bootstrap/app.php`
   - Type error: Check if `->create()` is present at end of builder chain
   - `BindingResolutionException`: Check for `$app->make()` calls before bootstrappers
   - "Headers already sent" warning: Check for `dd()`, `echo`, or whitespace after `<?php`
2. Verify file permissions: `bootstrap/app.php` must be readable by the web server user
3. Check for OPcache issues: After modifying bootstrap file, restart PHP-FPM or clear OPcache
4. Verify the base path resolution: `dirname(__DIR__)` in the builder must resolve to the correct project root
5. Check for missing route files: All paths passed to `withRouting()` must exist
6. Test in isolation: Create a minimal test script that requires the bootstrap file and checks the return type
7. If the error only occurs in production, compare the production `bootstrap/app.php` with the development version
8. Verify all imported classes (`Application`, `Middleware`, `Exceptions`, `Routing`) are correctly spelled and use the correct namespace

## Validation Checklist

- [ ] `php -l bootstrap/app.php` passes without errors
- [ ] File returns an `Application` instance (not `ApplicationBuilder`)
- [ ] No `dd()`, `var_dump()`, `echo` or output-producing statements in the file
- [ ] All `use` imports have correct namespaces for the Laravel version
- [ ] Base path resolves to the correct directory
- [ ] Route files referenced in `withRouting()` exist at the specified paths
- [ ] OPcache cleared after bootstrap file changes
- [ ] File permissions allow reading by the web server user
- [ ] No whitespace or characters before `<?php` or after the closing `?>` tag

## Common Failures

| Failure | Cause | Fix |
|---------|-------|-----|
| Parse/syntax error | Missing semicolon, unmatched parenthesis, or invalid syntax | Run `php -l bootstrap/app.php` to identify the exact line |
| Type error: `ApplicationBuilder` returned | `->create()` omitted | Add `->create()` to end of builder chain |
| `BindingResolutionException` | `$app->make()` called for non-base binding | Move resolution code to service provider |
| "Headers already sent" | `echo`, `dd()`, or whitespace output before HTTP response | Remove all output; ensure no characters before `<?php` |
| File not found | Incorrect `require` path in entry point | Verify the `require` statement path in `public/index.php` |
| Works in dev, fails in prod | OPcache serves stale compiled version | Clear OPcache after deployment |

## Decision Points

- **Syntax error vs runtime error** — Syntax errors fail at parse time with no error handling; runtime errors may be caught by the application's error handler only if `HandleExceptions` has run
- **Development vs production** — If it works in dev but not production, compare files for environment-specific differences and check OPcache

## Performance Considerations

- Syntax errors always produce a fatal error — the application never starts
- OPcache may mask bootstrap file changes — always clear OPcache after modifying `bootstrap/app.php`
- In Octane, a bootstrap file error crashes the worker; the process manager spawns a replacement

## Security Considerations

- Raw PHP errors from bootstrap file failures may expose filesystem paths in production
- Ensure `display_errors=Off` in production `php.ini` when debugging bootstrap failures
- Do not use `dd()` or similar debugging functions in bootstrap files — they reveal application internals

## Related Rules

- Always `return` the Application from `bootstrap/app.php` (05-rules.md, Rule 1)
- Never use `dd()`, `var_dump()`, `echo` in `bootstrap/app.php` (05-rules.md, Rule 2)
- Never call `$app->make()` before bootstrapper sequence completes (05-rules.md, Rule 5)

## Related Skills

- Create a Laravel Bootstrap File (this KU)
- Debug Application Construction Failures (application-class-construction)
- Diagnose Bootstrap-Order Bugs (bootstrapper-sequence)

## Success Criteria

- The bootstrap file passes `php -l bootstrap/app.php` syntax check
- All entry points load the bootstrap file without errors
- The bootstrap file returns an `Illuminate\Foundation\Application` instance
- No output is produced before the kernel handles the request
- The same bootstrap file works in development and production environments
