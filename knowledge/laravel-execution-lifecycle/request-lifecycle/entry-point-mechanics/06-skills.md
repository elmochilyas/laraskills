# Skill: Optimize Entry Point Bootstrap for Production

## Purpose

Reduce request initiation overhead from 80ms+ to under 5ms by applying all available caches and autoloader optimizations at the entry point level.

## When To Use

During production deployment setup, CI/CD pipeline configuration, when diagnosing slow time-to-first-byte (TTFB), or when scaling to handle increased traffic.

## When NOT To Use

Development environments where files change frequently — caches require clearing on every change. Applications that dynamically modify configuration at runtime (e.g., multi-tenant config from database) must skip `config:cache` because cached config is immutable.

## Prerequisites

- Understanding of the 6 core bootstrappers and their costs
- Knowledge of Composer autoloader mechanics (PSR-4 vs classmap)
- Access to the deployment environment

## Inputs

- Deployment pipeline script or CI/CD configuration
- Composer.json package list

## Workflow

1. Run `composer install --no-dev --optimize-autoloader` in CI/CD — reduces autoloader overhead from 5-15ms to <2ms via classmap generation
2. Run `php artisan config:cache` — merges all 40-80 config files into a single cached file, eliminating ~15ms merge overhead per request
3. Run `php artisan route:cache` — serializes route collection, eliminating route file parsing (~5ms)
4. Run `php artisan event:cache` — flattens event listener registrations into a cached manifest
5. Run `php -l bootstrap/app.php` in deployment pipeline — validates syntax before workers restart, preventing complete application downtime from parse errors
6. Verify syntax and cache files exist after deployment with `php artisan optimize` or manual checks
7. Monitor bootstrap duration in production — alert if bootstrap exceeds 50ms, indicating a cache miss or provider bloat

## Validation Checklist

- [ ] `composer dump-autoload -o` or `--optimize-autoloader` flag is present in deployment script
- [ ] `config:cache`, `route:cache`, `event:cache` run in deployment (unless dynamic config is required)
- [ ] `php -l bootstrap/app.php` passes in deployment pipeline
- [ ] Bootstrap duration is under 5ms in production with caches enabled
- [ ] Cache invalidation strategy exists for deployments (e.g., `php artisan optimize:clear` on deploy)
- [ ] Application does not dynamically modify config at runtime (if using `config:cache`)

## Common Failures

- Skipping `composer dump-autoload -o` — PSR-4 filesystem fallback adds 10-30ms per request
- Running `config:cache` on multi-tenant apps — cached config is immutable, dynamic tenant settings are ignored
- Not invalidating caches between deployments — stale route/config files cause 404s or wrong behavior
- Syntax error in `bootstrap/app.php` not caught pre-deploy — complete application downtime until manual fix

## Decision Points

- If the application uses dynamic config (multi-tenant, env-based per request), skip `config:cache` but still run `route:cache` and `event:cache`
- If bootstrap duration exceeds 50ms despite caches, audit provider count and bootstrapper cost
- If using Octane, caches are still beneficial — they reduce the one-time bootstrap per worker start

## Performance Considerations

Each cache independently reduces bootstrap time: config cache ~15ms saved, route cache ~5ms, event cache ~3ms, optimized autoloader ~10ms. Combined savings: 30-80ms per request. In Octane, these savings apply once per worker start rather than per request.

## Security Considerations

Cached config files in `bootstrap/cache/` contain all environment values including secrets. Ensure filesystem permissions restrict access. Never commit `bootstrap/cache/` to version control. The `config:cache` command serializes all config values, so any runtime config modifications (e.g., `config(['app.key' => '...'])`) are ignored after caching.

## Related Rules

- Cache Configuration And Routes In Production (entry-point-mechanics:5)
- Optimize The Composer Autoloader In Deployment (entry-point-mechanics:5)
- Validate bootstrap/app.php Syntax In Deployment Pipeline (entry-point-mechanics:5)

## Related Skills

- Configure ApplicationBuilder in bootstrap/app.php (entry-point-mechanics:6)
- Profile and Optimize Kernel Bootstrap Time (http-kernel-dispatch:6)

## Success Criteria

Bootstrap duration under 5ms in production with all caches enabled. Deployment pipeline validates `bootstrap/app.php` syntax and runs all caches. 30-80ms per-request savings confirmed via before/after profiling.

---

# Skill: Configure ApplicationBuilder in bootstrap/app.php

## Purpose

Set up routing, middleware, exception handling, and service providers using the Laravel 11+ `ApplicationBuilder` fluent API in `bootstrap/app.php`, keeping the entry point lean and configuration explicit.

## When To Use

When creating a new Laravel 11+ application, migrating from Laravel 10's `App\Http\Kernel` and `App\Exceptions\Handler` to the new `bootstrap/app.php` configuration model, or when reviewing existing configuration.

## When NOT To Use

Laravel 10 and earlier applications that still use `App\Http\Kernel` and `App\Exceptions\Handler` classes — unless actively migrating. Do not place initialization logic (service resolution, provider booting) in `bootstrap/app.php`.

## Prerequisites

- Understanding of the ApplicationBuilder fluent API
- Knowledge of middleware groups, routing channels, and exception handling strategies

## Inputs

- Application middleware requirements (global, group, route-specific)
- Routing channels needed (web, api, channels, etc.)
- Exception handling strategy
- Service provider registration list

## Workflow

1. Open `bootstrap/app.php` and verify the `Application::configure()` call is present
2. Configure routing using `->withRouting()`:
   - Pass `web: __DIR__.'/../routes/web.php'` for web routes
   - Pass `api: __DIR__.'/../routes/api.php'` for API routes
   - Pass `commands: true` or a closure for console commands
   - Pass `channels: __DIR__.'/../routes/channels.php'` for broadcasting
   - Pass `health: '/up'` for the health check endpoint
3. Configure middleware using `->withMiddleware(function (Middleware $middleware) { ... })`:
   - Append global middleware via `$middleware->append()`
   - Configure middleware groups via `$middleware->group('web', [...])`
   - Set priority via `$middleware->priority([...])`
   - Configure alias via `$middleware->alias([...])`
   - Configure trusted proxies via `$middleware->trustProxies(at: ...)`
4. Configure exception handling using `->withExceptions(function (Exceptions $exceptions) { ... })`:
   - Register reportable callbacks via `$exceptions->reportable()`
   - Custom HTTP responses via `$exceptions->renderable()`
   - Level-based ignoring via `$exceptions->dontReport()`
5. Register providers using `->withProviders([...])` if non-default providers are needed
6. Verify no application logic (service resolution, database calls, business rules) exists in `bootstrap/app.php`

## Validation Checklist

- [ ] `bootstrap/app.php` contains `Application::configure()` with fluent method chain
- [ ] Routing channels are configured with correct file paths
- [ ] Global middleware are in app-level arrays, not inline closures
- [ ] Middleware priority is configured for dependent middleware (Session before Auth, Auth before SubstituteBindings)
- [ ] Trusted proxies are configured for production proxy/CDN setup
- [ ] Exception handling uses `reportable()`/`renderable()` — not inline try/catch
- [ ] No service resolution, business logic, or heavy I/O exists in `bootstrap/app.php`
- [ ] No captured mutable state in closures that could leak across Octane requests

## Common Failures

- Mixing initialization logic (calling services, resolving container bindings) into `bootstrap/app.php` — creates circular dependencies
- Forgetting to include `->withExceptions(...)` — exception handling falls back to defaults
- Using `->withCommands(load(...))` for all environments — directory scanning on every artisan call adds overhead
- Placing `trustProxies` configuration only for development — production proxy setup is missed

## Decision Points

- If middleware configuration is extensive, consider keeping it in a dedicated service provider rather than inline in `->withMiddleware()`
- If the application has no API routes, omit `api` from `->withRouting()`
- For Octane, ensure no mutable state is captured in closures passed to `ApplicationBuilder` methods

## Performance Considerations

`ApplicationBuilder` configuration itself runs once during application construction — negligible cost. The significant performance impact comes from what is configured: directory scanning for commands (`load()`) adds 5-10ms per artisan call, and excessive middleware adds per-request pipeline overhead.

## Security Considerations

Trusted proxies configured in `->withMiddleware()` affect IP resolution for all security mechanisms (rate limiting, IP allowlists, geolocation). Restrict maintenance mode bypass IPs to internal networks only. CORS and CSP middleware should be configured in middleware, not hardcoded in `bootstrap/app.php`.

## Related Rules

- Keep Entry Point Files Lean (entry-point-mechanics:5)
- Separate Configuration From Initialization In Entry Files (entry-point-mechanics:5)
- Never Instantiate Application Outside The Entry Point (entry-point-mechanics:5)
- Audit bootstrap/app.php For Octane State Initialization (entry-point-mechanics:5)
- Configure Trusted Proxies For Accurate Request Data (entry-point-mechanics:5)

## Related Skills

- Optimize Entry Point Bootstrap for Production (entry-point-mechanics:6)
- Trace Request Flow Through the HTTP Kernel (http-kernel-dispatch:6)
- Configure Middleware Pipeline with Correct Priority (http-kernel-dispatch:6)

## Success Criteria

`bootstrap/app.php` contains a clean `Application::configure()` chain with no application logic. All routing channels, middleware, exception handling, and trusted proxy configuration are declared via the fluent API. Mutable state is never captured in closures. The file passes `php -l`.
