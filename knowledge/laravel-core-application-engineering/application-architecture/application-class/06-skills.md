# Skill: Configure Application via Fluent API

## Purpose
Customize middleware, exception handling, and routing in Laravel 11+ using `bootstrap/app.php` fluent API instead of extending the Application class.

## When To Use
- Customizing middleware registration in new Laravel 11+ projects
- Configuring exception handling behavior
- Defining route file locations
- Before considering Application class extension

## When NOT To Use
- When overriding path resolution methods (use class extension)
- In Laravel 10- projects (use Kernel class properties)
- When implementing multi-app path conventions (use class extension)

## Prerequisites
- Laravel 11+ project
- Understanding of `bootstrap/app.php` entry point
- Familiarity with Middleware, Exceptions, and Routing contracts

## Inputs
- Desired middleware configuration (global, group, route aliases)
- Exception handling rules (dontReport, render callbacks)
- Route file paths and configurations

## Workflow
1. Open `bootstrap/app.php`
2. Chain `->withMiddleware(function (Middleware $middleware) { ... })` to configure middleware
3. Chain `->withExceptions(function (Exceptions $exceptions) { ... })` to configure exception handling
4. Chain `->withRouting(web: ..., api: ..., commands: ...)` to define route file paths
5. Call `->create()` to instantiate the configured Application
6. Remove any existing Kernel class overrides or Handler class overrides if they become redundant

## Validation Checklist
- [ ] `bootstrap/app.php` uses fluent API only — no `new Application()` instantiation
- [ ] Middleware is registered in exactly one place (global, group, or alias)
- [ ] Route files referenced in `withRouting()` exist at specified paths
- [ ] Exception handling does not duplicate logic from `app/Exceptions/Handler.php`
- [ ] `->create()` is the final call in the chain

## Common Failures
- Mixing Kernel class middleware registration with fluent API — use one or the other per Laravel version
- Referencing route files that do not exist at the specified path
- Calling `->create()` before chaining all configuration methods

## Decision Points
- Should middleware be global, group, or route-alias? Use global for security/perimeter, group for domain-specific, alias for per-route
- Should exception handling be in fluent API or a dedicated Handler class? Fluent API for simple rules, Handler for complex custom rendering

## Performance Considerations
- Fluent API configuration is executed once at bootstrap — negligible overhead
- Keep `bootstrap/app.php` free of business logic and database queries

## Security Considerations
- Middleware registration order determines security perimeter — authentication before authorization
- Exception configuration must not expose stack traces in production
- Route configuration must not accidentally expose debug routes

## Related Rules
- Prefer Fluent API Over Class Extension (05-rules.md)
- Keep bootstrap/app.php Free of Business Logic (05-rules.md)
- Use Dependency Injection Over app() Helper (05-rules.md)

## Related Skills
- Skill: Bootstrap Application with Custom Path Resolution
- Skill: Configure Middleware Pipeline via Kernel
- Skill: Register Service Providers

## Success Criteria
- `bootstrap/app.php` is the sole customization point for middleware, exceptions, and routing
- No Application class extension exists for standard customizations
- Configuration is clear, declarative, and upgrade-safe

---

# Skill: Bootstrap Application with Custom Path Resolution

## Purpose
Extend the Application class to override path resolution methods (basePath, path, configPath, storagePath) for projects requiring custom directory layouts.

## When To Use
- Using `src/` instead of `app/` for application code
- Running multiple Laravel applications from a single codebase
- Custom storage or configuration directory locations
- When fluent API cannot satisfy path requirements

## When NOT To Use
- Simple service registration or middleware config (use fluent API)
- Adding business logic or initialization code (use service providers)
- When default directory structure suffices

## Prerequisites
- Understanding of `Illuminate\Foundation\Application` class hierarchy
- Knowledge of path resolution methods and their consumers
- Test suite for verifying path-dependent operations

## Inputs
- Custom base path or per-directory overrides
- List of framework components that depend on each path method

## Workflow
1. Create a custom Application class that extends `Illuminate\Foundation\Application`
2. Override only the path methods that need changing (path, configPath, storagePath, databasePath, resourcePath, langPath)
3. Ensure `parent::__construct($basePath)` is called first in the constructor
4. Update `bootstrap/app.php` to instantiate the custom Application class instead of calling `Application::configure()`
5. Test all path-dependent operations: `php artisan make:controller`, `php artisan migrate`, `php artisan db:seed`, `php artisan route:list`
6. Verify package commands and third-party service providers still resolve correct paths

## Validation Checklist
- [ ] `parent::__construct($basePath)` is called as the first statement in the constructor
- [ ] Overridden path methods return correct values for all callers
- [ ] Artisan generator commands place files in expected custom directories
- [ ] Migrations, seeders, and factories are found by the framework
- [ ] Package commands that resolve paths through the Application work correctly
- [ ] `php artisan route:list` resolves controllers from the custom path
- [ ] `composer dump-autoload` has been run after updating autoload configuration

## Common Failures
- Missing `parent::__construct()` call — facades fail, bootstrap breaks
- Overriding too many methods — only override paths that differ from defaults
- Not testing Artisan generators — commands use default paths regardless of custom Application
- Forgetting to update `composer.json` PSR-4 mapping for the custom directory

## Decision Points
- Which path methods to override? Only override those that diverge from defaults
- Extend Application vs modify bootstrap/app.php? Extend only for path resolution; use fluent API for everything else

## Performance Considerations
- Custom path resolution adds no per-request overhead — path methods are simple string operations
- Verify that optimized autoloader (`composer dump-autoload -o`) accounts for new directory structure

## Security Considerations
- Custom paths must not expose `storage/` or `bootstrap/cache/` to web access
- Path overrides must be validated in all environments to prevent environment-specific path bugs
- The Application instance must never be exposed to untrusted code

## Related Rules
- Always Call parent::__construct() When Extending Application (05-rules.md)
- Validate Custom Path Overrides Thoroughly (05-rules.md)
- Never Expose the Application Instance to Untrusted Code (05-rules.md)
- Run php artisan optimize in Production (05-rules.md)

## Related Skills
- Skill: Configure Application via Fluent API
- Skill: Establish Directory Conventions
- Skill: Register Service Providers

## Success Criteria
- Custom Application class correctly overrides only necessary path methods
- All framework components (Artisan, packages, providers) resolve paths correctly
- No business logic exists in the Application class
- Test suite covers all path-dependent operations
