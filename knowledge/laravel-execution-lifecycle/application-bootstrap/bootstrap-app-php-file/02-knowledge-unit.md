# Knowledge Unit: Bootstrap App PHP File

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Application Bootstrap
- **Target Audience:** Laravel developers, deployment engineers, CI/CD pipeline maintainers
- **Last Updated:** 2026-06-02
- **Source File:** `bootstrap/app.php` (project root)

## Executive Summary
`bootstrap/app.php` is the single entry point for the entire Laravel application. It is invoked by all three kernel entry points (`public/index.php`, `artisan`, `octane`) and is responsible for creating the configured `Application` instance via the `Application::configure()->...->create()` static factory chain. The file returns the fully configured (but not yet bootstrapped) `Application` back to the caller. Understanding its structure is critical because it is the only file that must be correct for the application to function across all execution contexts.

## Core Concepts
- **Application::configure() static factory:** This method (added in Laravel 11) creates an `ApplicationBuilder` instance wrapping a fresh `Illuminate\Foundation\Application`. It takes no arguments — the base path is detected automatically from the file location using `realpath(__DIR__.'/../')`.
- **Builder chain:** A sequence of `->with*()` calls that configure the application. The chain terminates with `->create()`, which returns the configured `Application` instance.
- **File return value:** `bootstrap/app.php` uses `return $app;` (not `$app->make(...)` or `$app->run()`). The caller — `public/index.php` or `artisan` — receives the Application and passes it to the appropriate kernel.
- **CROSS CONTEXT COMPATIBILITY:** The same file must work for HTTP requests, Artisan console commands, queue workers, and Octane workers. Conditional logic using `$app->runningInConsole()` within this file enables context-specific configuration.

## Mental Models
Think of `bootstrap/app.php` as the **application's birth certificate** — it declares what the application is, what subsystems it uses, and how its core dependencies are wired. Everything that comes later (kernel handling, request handling) is runtime execution. The file is executed exactly once per application lifecycle (once per request in FPM, once per worker start in Octane).

## Internal Mechanics
When `public/index.php` invokes `$app = require __DIR__.'/../bootstrap/app.php';`:
1. PHP executes the file in the scope of `index.php`. The `Application::configure()` static method is called.
2. `configure()` internally calls `new ApplicationBuilder(new Application(...))`, passing the detected base path.
3. Each `with*()` call registers configuration on the builder (see Application Builder Configuration KU).
4. `create()` returns the Application instance.
5. The `return` statement passes the Application back to `index.php`, which then binds it as the app singleton and creates the HTTP kernel: `$app->make(Kernel::class)`.

The same flow applies to `artisan`, except the console kernel is resolved instead of the HTTP kernel.

## Patterns
- **Static Factory Pattern:** `Application::configure()` provides a named, intention-revealing static factory that replaces direct constructor calls.
- **Fluent Builder Pattern:** The method chain in `bootstrap/app.php` is the canonical example of the Fluent Builder pattern in the Laravel framework.
- **Return Value Inclusion:** The file uses `return` rather than setting global state, making it testable and predictable. Each caller receives its own Application instance.
- **Single Point of Configuration:** All first-run configuration flows through this single file, eliminating the need for multiple entry-point-specific configuration files.

## Architectural Decisions
- **Why a `return` statement instead of global `$app`?** Prior to Laravel 11, `bootstrap/app.php` set a global `$app` variable. The `return` approach eliminates global state, improves testability, and clarifies ownership of the Application instance.
- **Why `configure()` over `new Application()`?** `configure()` enforces the use of the ApplicationBuilder, preventing direct manipulation of the container before it is configured. This is a deliberate ergonomic constraint.
- **Why no configuration caching for bootstrap?** Unlike config, routes, and views, the bootstrap file itself is not cached because it must execute on every request (FPM) to produce a fresh container instance. In Octane, it runs once per worker.

## Tradeoffs
| Tradeoff | Decision | Rationale |
|---|---|---|
| Single file vs per-context files | Single `bootstrap/app.php` for all contexts | Reduces duplication; requires conditional logic inside the file |
| Builder chain vs direct container calls | Builder chain required via `configure()` | Safety and discoverability at the cost of flexibility |
| Return vs global | Return statement | Eliminates global state; requires caller to receive and manage the Application |

## Performance Considerations
- File inclusion overhead: `require` on `bootstrap/app.php` is ~0.1ms with OPcache enabled (it is always cached in production).
- Builder chain overhead: Each `with*()` call adds marginal time. A typical chain of 5 methods adds ~0.3ms.
- OPcache implications: `bootstrap/app.php` is OPcached like all PHP files. The `require` cost is minimal. The real cost is the code execution inside the file.
- In Octane, the file runs once, so its performance impact is amortized across thousands of requests.

## Production Considerations
- **Do not modify `bootstrap/app.php` in production directly.** Any changes require a fresh deploy (or Octane worker restart).
- **Environment-specific branching:** Use `if ($app->environment('production')) { ... }` inside `bootstrap/app.php` to conditionally configure middleware, exception handling, or services per environment. Avoid requiring separate bootstrap files.
- **File permissions:** `bootstrap/app.php` must be readable by the web server user. Ensure it is not writable in production.
- **Version control:** The file should be tracked in version control. It contains essential application configuration that defines the application's architecture.

## Common Mistakes
- Using `dd()`, `var_dump()` or `echo` inside `bootstrap/app.php` — output will appear before headers are sent, breaking HTTP responses.
- Calling `$app->make()` before the bootstrappers have run — the container is empty except for base bindings and aliases.
- Moving `require __DIR__.'/../bootstrap/app.php'` to a different location without adjusting the relative path — the base path detection depends on the file's location.
- Configuring services inside `bootstrap/app.php` that depend on environment variables — environment variables are not loaded until the `LoadEnvironmentVariables` bootstrapper runs, which happens *after* `bootstrap/app.php` returns.

## Failure Modes
- **Missing file:** If `bootstrap/app.php` is deleted or corrupted, every entry point (`public/index.php`, `artisan`) will fail with a fatal error immediately. There is no graceful degradation.
- **Syntax error in builder chain:** A syntax error in `bootstrap/app.php` crashes every entry point. Test all changes with `php artisan about` (which uses the console kernel) before deploying.
- **Incorrect return type:** If the file accidentally returns `null` or a non-Application object, downstream code in `index.php` will fail with a method call on non-object.

## Ecosystem Usage
- **Laravel Installer:** Created `bootstrap/app.php` with default builder chain for new projects.
- **Laravel Shift:** Automated upgrade tool rewrites pre-Laravel 11 bootstrap files to the new builder syntax.
- **Serverless deployment (Laravel Vapor):** `bootstrap/app.php` must be compatible with the read-only filesystem restrictions of AWS Lambda. Path detection must work without write access to `bootstrap/cache/`.
- **Statamic:** Modifies the bootstrap chain to configure custom routing and middleware for the Statamic CMS integration.

## Related Knowledge Units

### Prerequisites
- [Application Class Construction](./application-class-construction/02-knowledge-unit.md) — the Application instance returned by the file.
- [Application Builder Configuration](./application-builder-configuration/02-knowledge-unit.md) — the builder methods called within the file.

### Related Topics
- [Bootstrapper Sequence](./bootstrapper-sequence/02-knowledge-unit.md) — what happens after the file returns.
- [Public Index PHP] — the file that requires `bootstrap/app.php` in HTTP context.
- [Path Helpers and Environment Detection](./path-helpers-and-environment-detection/02-knowledge-unit.md) — base path detection from file location.

### Advanced Follow-up Topics
- [Octane Application Lifecycle](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how Octane bootstraps once and reuses the Application across requests.
- [Laravel Zero Bootstrapping] — alternative bootstrap file structure for console-only applications.
- [Config Caching](../caching-optimization/config-caching/02-knowledge-unit.md) — how configuration caching relates to the bootstrap file flow.

## Research Notes

### Source Analysis
`Application::configure()` is defined in `Illuminate\Foundation\Application::configure()` (~line 170). It creates `new Configuration\ApplicationBuilder(new static($basePath), $basePath)`.

### Key Insight
`bootstrap/app.php` is the only file in a Laravel application that runs in the context of ALL entry points. Its design as a pure configuration file that returns a value is deliberate: it avoids side effects, enables testability (you can require the file in a test and inspect the returned Application), and makes the bootstrap process deterministic.

### Version-Specific Notes
- **Laravel 1–10:** `bootstrap/app.php` used `$app = new Illuminate\Foundation\Application(...)` directly and often included `$app->singleton()` calls for kernel binding.
- **Laravel 11:** Migrated to `Application::configure()->...->create()` with the ApplicationBuilder API. The `return $app` pattern replaced implicit global `$app`. Old files with direct `$app = new Application(...)` remain functional but are not the recommended pattern.
