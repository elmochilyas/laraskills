# ECC Anti-Patterns — Application Class Construction

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Application Class Construction |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Direct Constructor Invocation in Application Code
2. Constructor Modification via Inheritance
3. Premature Resolution After Construction
4. Missing Base Path in Non-Standard Deployments
5. Eager Resolution Inside Constructor Chain

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — calling `$this->make()` too early triggers resolution failures that cascade silently.

---

## Anti-Pattern 1: Direct Constructor Invocation in Application Code

### Category
Framework Usage

### Description
Using `new Application(...)` directly in `bootstrap/app.php` instead of `Application::configure()->...->create()`. In Laravel 11+, direct construction bypasses the ApplicationBuilder configuration chain, reverting to the fragile pre-Laravel 11 kernel binding approach.

### Why It Happens
Copying legacy examples, misunderstanding that `Application::configure()` is now the only supported pattern in Laravel 11+, or upgrading from Laravel 10 without updating the bootstrap file.

### Warning Signs
- `bootstrap/app.php` contains `$app = new Illuminate\Foundation\Application(...)` followed by manual `$app->singleton()` calls for kernel binding
- `php artisan about` reports kernel binding warnings
- Entry points show `BindingResolutionException` for kernel contracts

### Why It Is Harmful
Bypasses builder configuration, tightens coupling to internal constructor behavior, and prevents framework evolution. Builder methods like `withRouting()`, `withMiddleware()`, and `withExceptions()` become unusable.

### Real-World Consequences
After upgrading to Laravel 11+, the application crashes because the new Kernel architecture expects builder-configured bindings. Developers spend hours debugging kernel resolution failures.

### Preferred Alternative
Always use `Application::configure(basePath: ...)->withRouting(...)->withMiddleware()->withExceptions()->create()` in `bootstrap/app.php`.

### Refactoring Strategy
1. Replace `new Application($basePath)` with `Application::configure(basePath: $basePath)`
2. Replace `$app->singleton(HttpKernel::class, ...)` with `->withRouting(...)` and `->withMiddleware()`
3. Replace manual exception handler binding with `->withExceptions()`
4. Terminate with `->create()`

### Detection Checklist
- [ ] `bootstrap/app.php` contains `new Application`
- [ ] `bootstrap/app.php` contains manual `singleton()` calls for kernel contracts
- [ ] Builder chain missing `->create()`

### Related Rules
Rule 1 (05-rules.md): Always use `Application::configure()->create()` instead of `new Application()` in Laravel 11+.

### Related Skills
Bootstrap a Laravel Application Instance (06-skills.md).

### Related Decision Trees
Application Construction Method decision (07-decision-trees.md).

---

## Anti-Pattern 2: Constructor Modification via Inheritance

### Category
Architecture

### Description
Subclassing `Application` to add bindings in `__construct()` couples custom logic to the bootstrap phase. Bindings registered in constructor overrides survive `flush()` unexpectedly and cannot be cleared between Octane requests.

### Why It Happens
Developers think the constructor is the "right place" for application initialization because "everything starts from Application." They subclass to add custom bindings without understanding the flush/reset semantics.

### Warning Signs
- A custom `Application` subclass exists in the project
- `__construct()` calls `$this->singleton()`, `$this->bind()`, or `$this->instance()`
- After `flush()`, custom bindings persist unexpectedly in Octane

### Why It Is Harmful
Bindings registered in constructor overrides survive `flush()`, creating state leaks across Octane requests. Constructor modifications cannot be cleared between requests, making Octane compatibility impossible.

### Real-World Consequences
In Octane production, user authentication state leaks between requests because a custom `AuthServiceProvider` binding was registered in the Application constructor. User A sees User B's dashboard data.

### Preferred Alternative
Use service providers for complex bindings, or `withSingletons()` / `withBindings()` in the ApplicationBuilder for simple class-to-class mappings.

### Refactoring Strategy
1. Identify all bindings registered in the custom constructor
2. Move simple class mappings to `withSingletons()` in `bootstrap/app.php`
3. Move complex bindings with setup logic to dedicated service providers
4. Remove the custom Application subclass entirely

### Detection Checklist
- [ ] Custom `Application` subclass exists
- [ ] Constructor override calls `$this->singleton()`, `$this->bind()`, or `$this->instance()`
- [ ] After `flush()`, custom bindings still resolve

### Related Rules
Rule 2 (05-rules.md): Never modify the Application constructor or add bindings in constructor subclasses.

### Related Skills
Debug Application Construction Failures (06-skills.md).

### Related Decision Trees
Service Registration Location decision (07-decision-trees.md).

---

## Anti-Pattern 3: Premature Resolution After Construction

### Category
Reliability

### Description
Calling `app('config')` or any non-base binding immediately after Application construction, assuming configuration is already loaded. The constructor registers only `'app'`, `Container::class`, and PSR-11 bindings.

### Why It Happens
Developers assume that because `$app` exists, the full framework is ready. They call `$app->make('config')` inside `bootstrap/app.php` or in a provider's `register()` method.

### Warning Signs
- `$app['config']` or `$app->make('config')` appears in `bootstrap/app.php`
- `config()` helper used in a service provider's `register()` method
- `BindingResolutionException` for `'config'` during bootstrap

### Why It Is Harmful
Config accesses return null or throw exceptions, causing silent fallback to defaults. Logic silently uses wrong values, corrupting the application state.

### Real-World Consequences
A database config accessed in `register()` returns null, so the connection defaults to SQLite. Production mashes writes into a SQLite database instead of PostgreSQL. Data loss occurs before anyone notices.

### Preferred Alternative
Use `boot()` for config-dependent code. The `LoadConfiguration` bootstrapper runs before `BootProviders`, making config available during `boot()` but not during `register()`.

### Refactoring Strategy
1. Find all `config()` calls in `register()` methods
2. Move config-dependent logic to `boot()` methods
3. If the binding must be registered in `register()`, capture a callback instead of resolving eagerly

### Detection Checklist
- [ ] `config()` or `$app['config']` used in `register()` of any provider
- [ ] `$app->make()` for non-base bindings in `bootstrap/app.php`
- [ ] `env()` used in code that runs before `LoadEnvironmentVariables`

### Related Rules
Rule 3 (05-rules.md): Never call `app('config')` or any non-base binding immediately after construction.

### Related Skills
Bootstrap a Laravel Application Instance (06-skills.md).

### Related Decision Trees
Service Registration Location decision (07-decision-trees.md).

---

## Anti-Pattern 4: Missing Base Path in Non-Standard Deployments

### Category
Reliability

### Description
Omitting the explicit `basePath` argument to `Application::configure()` in non-standard directory layouts (serverless, monorepos, Phar archives). The constructor fallback `dirname(__DIR__, 3)` assumes a standard `vendor/` directory structure.

### Why It Happens
Developers use the default `Application::configure()` without arguments because it works in local development. Non-standard deployment layouts violate the assumption, silently breaking path resolution.

### Warning Signs
- `storage_path()` returns a wrong directory in production
- Log files appear in unexpected locations
- Config files not found after deployment to serverless
- File operations fail with "No such file or directory"

### Why It Is Harmful
All path helpers (`basePath()`, `storagePath()`, `configPath()`, etc.) return wrong paths. File operations fail, logs write to wrong locations, and cached files are not found.

### Real-World Consequences
In a Vapor (serverless) deployment, `dirname(__DIR__, 3)` resolves to `/tmp` instead of the application root. Logs are lost, cache files cannot be found, and the application silently malfunctions.

### Preferred Alternative
Always pass an explicit `basePath` to `Application::configure(basePath: '/custom/root')` when deploying to non-standard directory layouts.

### Refactoring Strategy
1. Determine the correct base path for the deployment environment
2. Pass it as `Application::configure(basePath: $correctPath)`
3. Test all path helpers in the deployment environment
4. Verify `storage_path()` is writable

### Detection Checklist
- [ ] Deployment uses non-standard directory layout
- [ ] `Application::configure()` called without `basePath` argument
- [ ] Path helpers return unexpected values in production

### Related Rules
Rule 4 (05-rules.md): Always pass explicit `basePath` in non-standard directory layouts.

### Related Skills
Bootstrap a Laravel Application Instance (06-skills.md).

### Related Decision Trees
Base Path Resolution Strategy decision (07-decision-trees.md).

---

## Anti-Pattern 5: Eager Resolution Inside Constructor Chain

### Category
Reliability

### Description
Calling `$this->make()` inside `registerBaseBindings()`, `registerBaseServiceProviders()`, or `registerCoreContainerAliases()` before the constructor call chain completes. The chain executes sequentially and resolution during construction may trigger failures.

### Why It Happens
Developers override constructor methods to add custom initialization and call `$this->make()` without realizing that some bindings don't exist yet. The framework itself uses `new` instead of `make()` for base service providers by design.

### Warning Signs
- Custom override of `registerBaseServiceProviders()` or `registerCoreContainerAliases()`
- `$this->make()` called inside these overrides
- `BindingResolutionException` during application construction

### Why It Is Harmful
Constructor errors are especially hard to debug because error handlers are not yet registered. The entire framework fails to initialize with a raw PHP error, showing sensitive stack traces.

### Real-World Consequences
A package overrides `registerBaseServiceProviders()` to add a custom provider. The override calls `$this->make('router')` before the routing provider is fully initialized. The production site shows a blank white screen with no error log because `HandleExceptions` hasn't run yet.

### Preferred Alternative
Use `$this->booting(function ($app) { ... })` callbacks for post-construction setup. These run during the bootstrapper sequence after all base bindings are established.

### Refactoring Strategy
1. Remove `$this->make()` calls from constructor method overrides
2. Move initialization logic to `booting()` callbacks
3. Register the callbacks in a service provider instead of the constructor

### Detection Checklist
- [ ] `$this->make()` called in `registerBaseBindings()` or `registerBaseServiceProviders()` override
- [ ] `BindingResolutionException` occurs during construction
- [ ] Error occurs before error handlers are registered

### Related Rules
Rule 5 (05-rules.md): Never call `$this->make()` inside `registerBaseBindings()` or `registerBaseServiceProviders()`.

### Related Skills
Debug Application Construction Failures (06-skills.md).

### Related Decision Trees
Application Construction Method decision (07-decision-trees.md).
