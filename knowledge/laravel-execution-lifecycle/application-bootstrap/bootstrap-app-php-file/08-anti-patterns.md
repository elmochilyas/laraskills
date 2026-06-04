# ECC Anti-Patterns — Bootstrap App PHP File

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Application Bootstrap |
| **Knowledge Unit** | Bootstrap App PHP File |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Global Variable Pollution
2. Entry Point Conditionals per Environment
3. Hardcoded Absolute Paths
4. Service Resolution in Bootstrap

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — database queries in `bootstrap/app.php` block the entire application bootstrap.

---

## Anti-Pattern 1: Global Variable Pollution

### Category
Architecture

### Description
Setting `$GLOBALS['app']` or global variables inside `bootstrap/app.php` instead of using the return-value convention. The file is designed to return the Application instance, not set global state.

### Why It Happens
Developers come from other frameworks where global variables are common. They set `$GLOBALS['app']` as a shortcut so other files can access the Application without dependency injection.

### Warning Signs
- `$GLOBALS['app']` set in `bootstrap/app.php`
- Other files reference `$GLOBALS['app']` instead of receiving the Application via injection
- Global `$app` variable used instead of the return value

### Why It Is Harmful
Global access to the Application defeats the return-value encapsulation, making the entry point unreusable, untestable, and coupling all code to a global variable.

### Real-World Consequences
A package uses `$GLOBALS['app']` set in `bootstrap/app.php` to resolve services. When the application is refactored to use Octane, the global variable is not reset between requests, causing service references to become stale and corrupting the application state.

### Preferred Alternative
Use the return value convention: `return Application::configure()->create()`. The caller receives the Application and passes it to the appropriate kernel. Inject dependencies explicitly.

### Refactoring Strategy
1. Remove global variable assignments from `bootstrap/app.php`
2. Ensure the file ends with `return $app;`
3. Update any code that references `$GLOBALS['app']` to receive the Application via injection
4. Verify entry points (`index.php`, `artisan`) use the return value

### Detection Checklist
- [ ] `$GLOBALS` set in `bootstrap/app.php`
- [ ] Global `$app` variable assigned instead of `return`
- [ ] Non-entry-point code references `$GLOBALS['app']`

### Related Rules
Rule 1 (05-rules.md): Use the return-value convention — never set global variables inside `bootstrap/app.php`.

---

## Anti-Pattern 2: Entry Point Conditionals per Environment

### Category
Maintainability

### Description
Creating separate bootstrap files for different environments (e.g., `bootstrap/app.production.php`, `bootstrap/app.local.php`) instead of using environment branching inside the single `bootstrap/app.php`.

### Why It Happens
Development and production have different configuration needs. Developers create separate files to keep them clean, not realizing `bootstrap/app.php` supports environment branching natively.

### Warning Signs
- Multiple `bootstrap/app.*.php` files exist
- Entry points switch on `APP_ENV` to load different bootstrap files
- Environment-specific configuration diverges over time

### Why It Is Harmful
Multiple bootstrap files inevitably diverge. A change meant for all environments is applied to one file but not others. The single-file design ensures all contexts use the same base configuration.

### Real-World Consequences
Security team adds CSRF middleware to `bootstrap/app.php` for production. The development bootstrap file (`bootstrap/app.local.php`) doesn't get updated. The team deploys to production with missing middleware, creating a security vulnerability that goes unnoticed for weeks.

### Preferred Alternative
Use `$app->environment('production')` or `$app->runningInConsole()` inside the single `bootstrap/app.php` file for environment-specific configuration.

### Refactoring Strategy
1. Merge all bootstrap files into the single `bootstrap/app.php`
2. Use `if ($app->environment('production'))` blocks for environment-specific config
3. Delete the separate bootstrap files
4. Update entry points to always load `bootstrap/app.php`

### Detection Checklist
- [ ] Multiple `bootstrap/app.*.php` files exist
- [ ] Entry points conditionally load different bootstrap files
- [ ] Configuration is duplicated across bootstrap files

### Related Rules
Rule 2 (05-rules.md): Use a single `bootstrap/app.php` with environment branching.

---

## Anti-Pattern 3: Hardcoded Absolute Paths

### Category
Maintainability

### Description
Using absolute filesystem paths like `/var/www/app/storage` inside `bootstrap/app.php` instead of path helpers or relative detection.

### Why It Happens
Quick debugging or configuration where a developer uses `pwd` output as a path. The path works on their machine and becomes permanent.

### Warning Signs
- String literals like `/var/www/` or `/home/user/` in `bootstrap/app.php`
- Paths that don't use `__DIR__` or `dirname()`
- Deployment requires changing paths in the bootstrap file

### Why It Is Harmful
Absolute paths break when deploying to different environments (local → CI → production). Each deployment requires manual path changes, which are error-prone and often forgotten.

### Real-World Consequences
An absolute `/home/developer/app/storage` path is hardcoded. The CI server has no `/home/developer` directory. The application fails silently on deployment, and developers spend hours debugging why storage operations don't work.

### Preferred Alternative
Use `__DIR__` for paths relative to the bootstrap file, or pass an explicit `basePath` to `Application::configure()`. Use path helpers (`storage_path()`, `config_path()`).

### Refactoring Strategy
1. Find all absolute paths in `bootstrap/app.php`
2. Replace with `__DIR__.'/../path'` or `dirname(__DIR__).'/path'`
3. Use `basePath()` and other path helpers instead of hardcoded strings

### Detection Checklist
- [ ] Absolute filesystem paths in `bootstrap/app.php`
- [ ] Paths that change between environments without automation

### Related Rules
Rule 3 (05-rules.md): Always use relative paths or path helpers — never absolute filesystem paths.

---

## Anti-Pattern 4: Service Resolution in Bootstrap

### Category
Reliability

### Description
Calling `$app->make()` or `resolve()` inside `bootstrap/app.php` before the container is fully populated. The container holds only base bindings during bootstrap execution.

### Why It Happens
Developers need a service early and call `$app->make()` directly in the bootstrap file. They don't realize the container is nearly empty at this point.

### Warning Signs
- `$app->make()` or `resolve()` called in `bootstrap/app.php`
- `BindingResolutionException` during bootstrap
- Services resolved in bootstrap are null or unexpected instances

### Why It Is Harmful
Most services are not yet registered during bootstrap execution. Resolution attempts throw exceptions or return null values, crashing the application before any request handling begins.

### Real-World Consequences
A developer adds `$cache = $app->make(Cache::class)` to `bootstrap/app.php` to pre-configure caching. The cache binding is not yet registered during construction, throwing `BindingResolutionException` and preventing the application from booting entirely.

### Preferred Alternative
Move service resolution to service provider `boot()` methods, middleware, or controller constructors where the full container is available. Use the builder chain for declarative configuration only.

### Refactoring Strategy
1. Remove all `$app->make()` and `resolve()` calls from `bootstrap/app.php`
2. Move the logic to the appropriate service provider or middleware
3. If the service truly needs early resolution, use `booting()` callbacks registered through the builder

### Detection Checklist
- [ ] `$app->make()` or `resolve()` called in `bootstrap/app.php`
- [ ] `BindingResolutionException` occurs during bootstrap
- [ ] Service resolution depends on non-base bindings

### Related Rules
Rule 4 (05-rules.md): Never call `$app->make()` in `bootstrap/app.php` — it runs before most services are registered.

### Related Skills
Create a Laravel Bootstrap File (06-skills.md).
