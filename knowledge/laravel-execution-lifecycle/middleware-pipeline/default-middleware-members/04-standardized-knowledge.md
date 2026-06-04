# Default Middleware Members

## Metadata
- **ID:** ku-06-global-middleware
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Laravel ships with a set of default middleware that handle essential HTTP concerns. These are organized into the global stack, the `web` group, and the `api` group. Understanding what each default middleware does is critical for debugging, optimization, and customization. The defaults cover encryption, sessions, CSRF, CORS, rate limiting, authentication, route model binding, maintenance mode, and trusted proxy/host validation.

## Core Concepts
- **Security Middleware**: CSRF, CORS, encryption, trusted proxies, trusted hosts.
- **Session Middleware**: Start session, persist session data, share errors from session.
- **Infrastructure Middleware**: Maintenance mode, validate post size, trim strings, convert empty strings to null.
- **Routing Middleware**: Substitute bindings (route model binding), throttle requests.
- **Authentication Middleware**: Auth guard resolution, guest redirect, email verification.
- **Group Specialization**: `web` group handles stateful concerns; `api` group handles stateless concerns; global stack handles non-bypassable infrastructure.

## Default Middleware Reference

### Global Stack
| Middleware | Purpose |
|---|---|
| `TrustProxies` | Configures trusted proxies for correct IP detection behind load balancers |
| `TrustHosts` | Validates the request Host header against allowed hosts |
| `HandleCors` | Handles CORS preflight and adds CORS headers |
| `PreventRequestsDuringMaintenance` | Blocks requests when app is in maintenance mode |
| `ValidatePostSize` | Rejects requests exceeding `post_max_size` |
| `TrimStrings` | Trims whitespace from incoming string request data |
| `ConvertEmptyStringsToNull` | Converts empty strings to null in request data |

### Web Group
| Middleware | Purpose |
|---|---|
| `EncryptCookies` | Encrypts/decrypts cookies transparently |
| `AddQueuedCookiesToResponse` | Adds cookies queued during the request to the response |
| `StartSession` | Starts the session and makes session data available |
| `ShareErrorsFromSession` | Shares validation errors from session to view |
| `VerifyCsrfToken` | Validates CSRF token on state-changing requests |
| `SubstituteBindings` | Replaces route parameters with Eloquent models (route model binding) |

### Api Group
| Middleware | Purpose |
|---|---|
| `SubstituteBindings` | Route model binding |
| `ThrottleRequests:api` | Rate limiting configured for API routes |

## When To Use
- **New Laravel projects**: Default middleware works out of the box — understand what each does before customizing.
- **Debugging unexpected behavior**: CSRF errors, session issues, CORS problems — trace to the relevant default middleware.
- **Performance optimization**: Audit which default middleware your routes actually need — remove unnecessary defaults.
- **Security hardening**: Understand the security guarantees provided by defaults before modifying them.

## When NOT To Use
- **Removing without understanding**: Removing `EncryptCookies` breaks session-based auth; removing `StartSession` breaks login.
- **Modifying defaults for convenience**: Adding custom middleware to default groups instead of creating custom groups.
- **Ignoring defaults during upgrade**: Framework updates may change default middleware — review changes during upgrades.
- **Assuming defaults are optional**: Some middleware (`SubstituteBindings`) is required for route model binding to work.

## Best Practices (WHY)
- **Audit default middleware before production**: The default stack includes session middleware which performs I/O on every web route. For API-only apps, remove session middleware from global. *Why: Defaults are designed for traditional web apps — API-only apps don't need cookies, sessions, or CSRF.*
- **Understand the ordering dependency chain**: `EncryptCookies` must run before `StartSession` because session IDs are stored in encrypted cookies. *Why: The default order is carefully designed — changing it breaks framework functionality.*
- **Don't remove `SubstituteBindings`**: This middleware enables route model binding — removing it breaks controllers that type-hint models in route parameters. *Why: Route model binding is a core Laravel feature — SubstituteBindings is the mechanism.*
- **Use `php artisan route:list -v` to see default middleware per route**: Verify which defaults apply to each route before making changes. *Why: Middleware inheritance through groups is invisible in route files — `route:list -v` reveals the full stack.*

## Architecture Guidelines
- **Security defaults out of the box**: CSRF, encryption, CORS, trusted proxies — secure by default.
- **Group specialization**: `web` for stateful, `api` for stateless, global for non-bypassable infrastructure.
- **Layered concerns**: Each middleware handles a single cross-cutting concern.
- **Dependency chain**: Defaults are ordered to satisfy dependencies — cookie → session → auth.

## Performance
- **Session I/O overhead**: `StartSession` reads/writes session storage on every web route — significant I/O.
- **Cookie encryption**: `EncryptCookies` decrypts every cookie on every request — unnecessary if app doesn't use cookies.
- **CSRF token verification**: `VerifyCsrfToken` validates tokens on every POST/PUT/DELETE — small overhead but adds up.
- **API optimization**: `api` group excludes session and cookie middleware — stateless routes avoid unnecessary overhead.

## Security
- **Missing `SubstituteBindings`**: Route model binding fails — controllers receive raw IDs instead of model instances.
- **Missing `StartSession`**: Auth checks fail because user data cannot be loaded from session.
- **Missing `VerifyCsrfToken`**: All POST requests fail with 419 errors.
- **Missing `TrustProxies`**: `request()->ip()` returns load balancer IP instead of client IP.
- **Missing `HandleCors`**: Browser CORS preflight fails — API requests from frontends blocked.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Removing default middleware without understanding | Assuming it's optional | Breaks session, auth, or CSRF | Understand each default before removing |
| Moving middleware from web to api without adjusting priority | Different group ordering | SubstituteBindings may run in wrong order | Check priority when restructuring groups |
| Assuming defaults are the same across Laravel versions | Not reviewing upgrade changes | Unexpected behavior after upgrade | Check changelog for middleware changes |
| Adding custom middleware to default groups | Convenience | Affects all routes in that group | Create custom groups for custom middleware |

## Anti-Patterns
- **Blindly removing all web group middleware for "performance"**: Removing session middleware from web routes breaks authentication entirely.
- **Adding heavy middleware to default groups**: Adding DB-dependent middleware to the `web` group — affects every page load.
- **Not verifying middleware composition**: Assuming defaults without checking `route:list -v` — middleware may have changed after upgrade.
- **Copying defaults from older Laravel projects**: Default middleware changes across versions — copying old config may miss new middleware.

## Examples

```php
// Remove unnecessary defaults for API-only app
->withMiddleware(function (Middleware $middleware) {
    // Remove global middleware not needed for API
    $middleware->remove(\Illuminate\Foundation\Http\Middleware\TrimStrings::class);
    $middleware->remove(\Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class);
    
    // Remove session middleware from api group
    $middleware->api(remove: [
        \Illuminate\Session\Middleware\StartSession::class,
    ]);
})

// Add custom middleware to web group
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\LogWebRequests::class,
    ]);
})
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe ordering and chaining.
- **Global Middleware Stack**: Outermost default middleware layer.
- **Middleware Groups**: Web/api group composition.
- **Middleware Aliases**: Default alias registrations for built-in middleware.
- **Middleware Priority**: Ordering constraints among default middleware.

## AI Agent Notes
- Default middleware definitions are in `Illuminate\Foundation\Http\Kernel::$middleware` and `$middlewareGroups`.
- The default set is carefully ordered: `EncryptCookies` before `StartSession` because session IDs are stored in encrypted cookies.
- Laravel 11 changed the default trust proxy to `TrustProxies` from the framework rather than a stub in App.
- `php artisan route:list -v` shows the full resolved middleware stack including defaults.

## Verification
- [ ] List all default global, web group, and api group middleware
- [ ] Understand the purpose of each default middleware
- [ ] Run `route:list -v` for a web route and identify all default middleware
- [ ] Remove `VerifyCsrfToken` from a test route — verify POST requests work without token
- [ ] Remove `StartSession` — verify auth stops working
- [ ] For an API-only app, strip session/cookie middleware and verify performance improvement
