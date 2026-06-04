# Skill: Optimize Bootstrap Performance

## Purpose
Reduce application bootstrap time in production by enabling all caches (config, route, event) and deferring unused service providers.

## When To Use
- Setting up production deployment scripts
- Debugging slow application response times
- Before production launch of any Laravel application

## When NOT To Use
- In development environments (caching prevents changes from taking effect)
- During active development where configuration changes frequently

## Prerequisites
- Deployable application on a production server
- Access to the Artisan CLI in the target environment
- Understanding of the 6 bootstrap steps and their relative cost

## Inputs
- Deployment script or CI pipeline configuration
- List of service providers and their usage frequency
- Current bootstrap time baseline (optional, for verification)

## Workflow
1. Run `php artisan config:cache` to merge all config files into `bootstrap/cache/config.php`
2. Run `php artisan route:cache` to serialize all routes into `bootstrap/cache/routes-v7.php`
3. Run `php artisan event:cache` to compile event listeners into `bootstrap/cache/events.php`
4. Run `php artisan optimize` to compile the deferred provider manifest and facade aliases
5. Run `composer dump-autoload -o` to generate an optimized classmap autoloader
6. Audit service providers: identify services used on <80% of requests and mark them as deferred (`protected $defer = true`) with a `provides()` method
7. Verify: check that `bootstrap/cache/` contains config.php, routes-v7.php, events.php, packages.php, and services.php
8. Measure: compare response times before and after optimization

## Validation Checklist
- [ ] `config:cache` produces `bootstrap/cache/config.php` without errors
- [ ] `route:cache` produces `bootstrap/cache/routes-v7.php` without errors
- [ ] `event:cache` produces `bootstrap/cache/events.php` without errors
- [ ] `php artisan optimize` completes without errors
- [ ] `composer dump-autoload -o` generates classmap for all namespaces
- [ ] Deferred service providers all implement `provides()` returning their bound abstracts
- [ ] Deferred providers are not used on >80% of requests (profile to verify)
- [ ] Application behaves identically before and after caching in production
- [ ] Deployment script includes cache commands in correct order

## Common Failures
- `config:cache` fails due to `env()` calls outside config files — fix by moving `env()` to config files only
- `route:cache` fails due to non-serializable route closures — convert closures to controller classes
- `event:cache` fails due to non-serializable event listeners — ensure listeners are class names, not closures
- Deferred provider without `provides()` — service resolves with `BindingResolutionException`
- Skipping `config:clear` before `config:cache` — stale config persists

## Decision Points
- Which providers to defer? Profile service resolution frequency; defer if <80% of requests resolve it
- Closure vs controller routes? Controllers must be used for route caching to work
- When to rebuild cache? Every deployment that changes config, routes, events, or providers

## Performance Considerations
- Config caching: reduces config loading from 3-8ms to <0.5ms
- Route caching: eliminates route registration overhead entirely
- Deferred providers: reduces bootstrap time by 30-70% for large applications
- Optimized autoloader: eliminates PSR-4 filesystem lookups

## Security Considerations
- Cached config files contain resolved secrets (API keys, passwords) — protect `bootstrap/cache/` with filesystem permissions
- Stale cache after deployment can serve old configuration — always rebuild cache on deploy
- Route cache bypasses route service provider — ensure no security middleware depends on route registration order

## Related Rules
- Run php artisan optimize in Every Production Deployment (05-rules.md)
- Defer Providers for Services Not Used on Every Request (05-rules.md)
- Always Run config:cache in Production (05-rules.md)
- Validate Environment Variables at Bootstrap (05-rules.md)

## Related Skills
- Skill: Debug Bootstrap Issues
- Skill: Implement Deferred Service Providers
- Skill: Configure Deployment Pipeline

## Success Criteria
- All caches (config, route, event) are generated and verified
- Deferred providers are implemented for infrequently used services
- Bootstrap time is reduced by 50-80% compared to uncached baseline
- Production deployment script includes all cache commands

---

# Skill: Debug Bootstrap Issues

## Purpose
Identify and resolve bootstrap-related failures caused by service provider ordering, missing bindings, or incorrect lifecycle phase usage.

## When To Use
- Application crashes with white screen (no HTTP response)
- "Class not found" or binding resolution errors during application startup
- Unexpected behavior that only occurs in certain environments
- After adding or modifying service providers

## When NOT To Use
- Runtime errors that occur after bootstrap completes (look in middleware or controller layer)
- View/Blade rendering errors (check template files)
- Database query errors (check connection configuration)

## Prerequisites
- Access to application error logs (`storage/logs/`)
- Understanding of the 6 bootstrap steps and two-phase provider contract
- Debugging environment (not production)

## Inputs
- Error message or stack trace
- Recent changes to service providers, composer dependencies, or kernel configuration
- Environment configuration (APP_ENV, APP_DEBUG)

## Workflow
1. Check `storage/logs/laravel.log` for bootstrap-phase exceptions (framework, bootstrap, provider errors)
2. Identify which bootstrap step the error originates from:
   - `LoadEnvironmentVariables`: missing/wrong `.env` file or `APP_ENV` value
   - `LoadConfiguration`: syntax error in config file, `env()` call outside config, missing config file
   - `HandleExceptions`: exception handler registration fails
   - `RegisterFacades`: class_alias collision, missing facade class
   - `RegisterProviders`: provider class not found, binding resolution in `register()` method
   - `BootProviders`: runtime exception in provider `boot()` method
3. For `RegisterProviders` errors: check that all providers in `config/app.php` exist and are autoloadable
4. For service resolution failures during bootstrap: verify the service is not being resolved in `register()` — move resolution to `boot()`
5. For provider ordering issues: ensure providers do not depend on each other's boot-time side effects; convert order-dependent code to use `resolving` callbacks
6. Test with cached and uncached configuration: `php artisan config:clear` to detect caching-related issues

## Validation Checklist
- [ ] Error log identifies the exact bootstrap step and exception message
- [ ] No service resolution occurs inside `register()` methods
- [ ] No provider depends on the boot-time side effects of another provider
- [ ] All providers listed in `config/app.php` exist and are autoloadable
- [ ] Config files do not contain runtime code that throws during `LoadConfiguration`
- [ ] Facade aliases do not collide with existing class names
- [ ] Application boots successfully with `APP_DEBUG=true` and `APP_ENV=local`
- [ ] Errors are reproducible and not environment-specific (if environment-specific, check `.env` file)

## Common Failures
- Error in `register()` appears to be a "class not found" but is actually a service resolution issue — check for `$this->app->make()` in register methods
- Provider works in development but fails in production — difference is often config caching; check `env()` usage
- Intermittent bootstrap failure — likely provider ordering issue; convert to `resolving` callbacks
- White screen with no log — enable `APP_DEBUG` and check PHP error reporting

## Decision Points
- Fix bootstrap error vs disable provider? Fix the error; disabling providers masks the problem
- Convert to deferred or fix eager provider? Defer if the service is not used on most requests
- Break circular dependency: use method injection, `afterResolving` callbacks, or redesign the dependency graph

## Related Rules
- Never Resolve Services in register() (05-rules.md)
- Never Rely on Service Provider Boot Order (05-rules.md)
- Never Add Business Logic to Bootstrappers (05-rules.md)
- Validate Environment Variables at Bootstrap (05-rules.md)

## Related Skills
- Skill: Optimize Bootstrap Performance
- Skill: Implement Deferred Service Providers
- Skill: Register Service Providers

## Success Criteria
- Root cause of bootstrap failure is identified by step and resolved
- Application boots successfully in all target environments
- No service resolution occurs in `register()` methods
- No order-dependent provider behavior exists
