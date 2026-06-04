# Skill: Audit Default Middleware Composition

## Purpose
Identify and understand every default middleware class in the global, web, and api stacks to make informed decisions about customization, removal, or replacement.

## When To Use
- Before modifying default middleware configuration
- After upgrading Laravel to a new major version
- When debugging unexpected behavior (CSRF errors, session issues, CORS problems)
- When optimizing an API-only application

## When NOT To Use
- When running a standard web app with no middleware customization
- When you already know the default middleware composition

## Prerequisites
- Laravel project with HTTP routing
- Access to `bootstrap/app.php` or `App\Http\Kernel`
- Ability to run Artisan commands

## Inputs
- Laravel version (for version-specific defaults)
- Application type (web-only, API-only, hybrid)

## Workflow
1. Run `php artisan route:list -v` on a representative web route and an API route to see resolved middleware stacks
2. List all middleware classes appearing in the global stack from `bootstrap/app.php` or `App\Http\Kernel::$middleware`
3. List all middleware classes in the `web` group from `bootstrap/app.php` or `App\Http\Kernel::$middlewareGroups['web']`
4. List all middleware classes in the `api` group from `bootstrap/app.php` or `App\Http\Kernel::$middlewareGroups['api']`
5. For each middleware class, read its `handle()` method source to understand its purpose
6. Identify which middleware is essential for your app type (session/cookie for web, throttle/bindings for API)
7. Document the dependency chain: `EncryptCookies` -> `StartSession` -> `ShareErrorsFromSession` -> `VerifyCsrfToken` -> `SubstituteBindings`
8. Flag middleware that performs I/O (session read/write, cookie encryption) for performance auditing

## Validation Checklist
- [ ] Global stack middleware listed and understood
- [ ] Web group middleware listed and understood
- [ ] API group middleware listed and understood
- [ ] Dependency chain documented
- [ ] I/O-heavy middleware identified
- [ ] `route:list -v` confirms resolved stacks

## Common Failures
- Assuming defaults are the same across Laravel versions
- Not recognizing that `SubstituteBindings` is required for route model binding
- Missing that `ShareErrorsFromSession` also flashes old input
- Overlooking that `TrimStrings` affects JSON API payloads

## Decision Points
- Is this a web app, API app, or hybrid? -> Determines which defaults are necessary
- Does the app use cookies/sessions? -> Determines if `EncryptCookies`, `StartSession`, `VerifyCsrfToken` are needed

## Performance Considerations
- Session middleware performs file/Redis I/O on every web route
- Cookie encryption/decryption runs on every request
- `SubstituteBindings` triggers DB queries per bound parameter

## Security Considerations
- Removing `VerifyCsrfToken` opens POST routes to CSRF attacks
- Removing `StartSession` breaks all session-based auth
- Removing `SubstituteBindings` breaks route model binding
- Removing `TrustProxies` causes incorrect IP detection behind load balancers

## Related Rules
- Never Remove `SubstituteBindings` from Any Group
- Audit Default Middleware for API-Only Applications
- Understand Each Default Middleware's Purpose Before Customization

## Related Skills
- Configure Global Middleware Stack
- Create and Manage Middleware Groups
- Audit Middleware Exclusion in Routes

## Success Criteria
- You can list every default middleware from memory
- You know which defaults are essential vs optional for your app type
- You have documented the dependency chain
- You have identified which defaults to remove for performance optimization

---

# Skill: Optimize Default Middleware for API-Only App

## Purpose
Remove unnecessary session, cookie, and CSRF default middleware for API-only or stateless Laravel applications to eliminate unnecessary I/O overhead on every request.

## When To Use
- Building a stateless API (token-based auth, no sessions)
- Converting a web+API hybrid app to API-only
- Optimizing API response times by removing middleware overhead
- After creating a new project with `laravel new` that defaults to full web stack

## When NOT To Use
- Traditional web apps that use session-based auth
- Hybrid apps serving both web views and API routes from the same instance
- Apps that rely on CSRF protection or encrypted cookies

## Prerequisites
- Laravel 11+ project with `bootstrap/app.php` (or `App\Http\Kernel` for <11)
- Confirmation that the app is API-only (no Blade views, no session-based auth)
- Alternative auth mechanism (token, Sanctum, Passport, JWT)

## Inputs
- Current middleware configuration in `bootstrap/app.php`
- List of default middleware to remove

## Workflow
1. Confirm the application is API-only: no Blade views, no session-based auth, CSRF not needed
2. Open `bootstrap/app.php` and locate the `->withMiddleware(function (Middleware $middleware) { ... })` callback
3. Remove session middleware: `$middleware->remove(\Illuminate\Session\Middleware\StartSession::class)`
4. Remove cookie encryption: `$middleware->remove(\App\Http\Middleware\EncryptCookies::class)`
5. Remove CSRF: `$middleware->remove(\App\Http\Middleware\VerifyCsrfToken::class)`
6. Remove error sharing: `$middleware->remove(\Illuminate\View\Middleware\ShareErrorsFromSession::class)`
7. Remove queued cookies: `$middleware->remove(\Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class)`
8. Run `php artisan route:list -v` to verify the middleware stack is lean
9. Run `php artisan optimize` to cache configuration

## Validation Checklist
- [ ] Session middleware removed from global and web group
- [ ] Cookie encryption middleware removed
- [ ] CSRF middleware removed
- [ ] `route:list -v` shows no session/cookie/CSRF middleware on any route
- [ ] API authentication still works (token-based)
- [ ] Configuration cached after changes

## Common Failures
- Removing `SubstituteBindings` by mistake (breaks route model binding)
- Keeping session middleware in the `api` group after removal from global
- Not verifying that no web views depend on session data
- Removing middleware but not re-caching (stale config still runs in production)

## Decision Points
- Is this truly API-only? -> If Blade views exist, keep `web` group intact
- Keep `EncryptCookies` if using encrypted cookies? -> Remove only if no cookies needed

## Performance Considerations
- Removing session middleware saves 1 file/Redis read + 1 write per request
- Removing cookie encryption saves decryption overhead on every request
- Total savings: ~5-20ms per request depending on session driver
- Essential for high-traffic API endpoints

## Security Considerations
- Ensure API auth (token/Sanctum) works without sessions
- CSRF is not needed for token-based API auth
- Cookie encryption is unnecessary if cookies are not used
- Session removal breaks `Auth::check()` if relying on session guard

## Related Rules
- Audit Default Middleware for API-Only Applications
- Understand Each Default Middleware's Purpose Before Customization

## Related Skills
- Configure Global Middleware Stack
- Configure Middleware in Bootstrap
- Audit Default Middleware Composition

## Success Criteria
- API routes have no session or cookie middleware in their stack
- API authentication works correctly with token-based auth
- `route:list -v` shows a clean, minimal middleware stack on API routes
- Response times improved by eliminating unnecessary I/O
