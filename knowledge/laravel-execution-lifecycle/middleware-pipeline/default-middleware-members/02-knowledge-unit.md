# Default Middleware Members
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Laravel ships with a set of default middleware that handle essential HTTP concerns. These are organized into the global stack, the `web` group, and the `api` group. Understanding what each default middleware does is critical for debugging, optimization, and customization. The defaults cover encryption, sessions, CSRF, CORS, rate limiting, authentication, route model binding, maintenance mode, and trusted proxy/host validation.

## Core Concepts
Default middleware can be categorized by concern: **Security** (CSRF, CORS, encryption), **Session** (start, persist, share errors), **Infrastructure** (maintenance mode, trusted proxies, trusted hosts), **Routing** (substitute bindings, throttle), and **Authentication** (auth, guest). Each middleware class lives in either `Illuminate\Foundation\Http\Middleware` or `Illuminate\Routing\Middleware`. Understanding the role of each helps when customizing the middleware stack.

## Mental Models
**Pre-installed Appliances:** Default middleware is like the appliances in a new house — refrigerator, stove, dishwasher, washer/dryer. They come standard and handle essential daily tasks. You can replace them or add new ones, but most installations keep the defaults.

**Standard Tool Kit:** A new car comes with a spare tire, jack, and basic tools. Default middleware is the Laravel equivalent — the essential tools every application needs.

## Internal Mechanics
The default middleware list is defined in `Illuminate\Foundation\Http\Kernel` and inherited by `App\Http\Kernel`. In Laravel 11+, it's defined in the framework's default configuration. The `web` group includes: `EncryptCookies`, `AddQueuedCookiesToResponse`, `StartSession`, `ShareErrorsFromSession`, `ValidateCsrfToken`, `SubstituteBindings`. The `api` group includes: `SubstituteBindings`, `ThrottleRequests:api`. Global middleware includes: `TrustProxies`, `TrustHosts`, `HandleCors`, `PreventRequestsDuringMaintenance`, `ValidatePostSize`, `TrimStrings`, `ConvertEmptyStringsToNull`.

```php
// Default web group middleware
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ],
];
```

## Patterns
- **Layered Concerns:** Each middleware handles a single cross-cutting concern.
- **Pipeline Chain:** Default middleware forms a chain where later middleware depends on earlier ones.
- **Group Specialization:** `web` group handles stateful concerns; `api` group handles stateless concerns.

## Architectural Decisions
The separation of `web` and `api` groups reflects the architectural decision that stateful web applications and stateless APIs have fundamentally different middleware needs. Session middleware is excluded from `api` because APIs authenticate via tokens, not cookies. The global stack includes infrastructure that should not be bypassable (maintenance mode, trusted proxies).

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Secure defaults out of the box | Default middleware may be unnecessary for some routes | Performance overhead if not trimmed |
| Clear group separation (web vs api) | Misplaced routes get wrong middleware | API routes in web group get session overhead |
| Comprehensive infrastructure handling | Many middleware to understand and maintain | Learning curve for new Laravel developers |

## Performance Considerations
The `EncryptCookies` middleware decrypts every cookie on every request — unnecessary if your app doesn't use cookies. `StartSession` reads/writes session storage on every web route. For high-traffic applications, consider which default middleware your routes actually need.

## Production Considerations
Before production deployment, audit the default middleware stack. Strip middleware that your application doesn't use. Add custom middleware at the appropriate level (global vs group vs route). Use `php artisan route:list -v` to verify the full stack per route.

## Common Mistakes
**Why it happens:** Developers assume default middleware is optional and remove entries they don't understand. **Why it's harmful:** Removing `EncryptCookies` without understanding it breaks session-based authentication. **Better approach:** Add custom middleware to your stack; remove defaults only after confirming they are not needed.

## Failure Modes
- **Missing SubstituteBindings:** Route model binding fails — controllers receive raw IDs instead of model instances.
- **Missing StartSession:** Auth checks fail because user data cannot be loaded from session.
- **Missing ValidateCsrfToken:** All POST requests fail with 419 errors.

## Ecosystem Usage
- **Laravel Breeze/Jetstream:** Rely on the full `web` group for session-based auth.
- **Laravel Passport:** Adds its own middleware to the `api` group for token auth.
- **Laravel Horizon:** Uses default web group for its dashboard authentication.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (pipe ordering and chaining)
- Global Middleware Stack (outermost default middleware layer)
- Middleware Groups (web/api group composition)

### Related Topics
- Middleware Aliases (default alias registrations for built-in middleware)
- Middleware Priority (ordering constraints among default middleware)
- Pre-and-Post-Middleware Code (how default middleware uses pre/post patterns)

### Advanced Follow-up Topics
- Middleware Configuration in Bootstrap (overriding defaults in Laravel 11+)
- Service Container (middleware resolution from container)
- Boot Order Timing (when default middleware is selected and ordered)

## Research Notes
**Source Analysis:** `Illuminate\Foundation\Http\Kernel::$middleware` and `$middlewareGroups` for default definitions.
**Key Insight:** The default set is carefully ordered: `EncryptCookies` runs before `StartSession` because session IDs are stored in encrypted cookies.
**Version-Specific Notes:** Laravel 11 changed the default trust proxy to `TrustProxies` from the framework rather than a stub in App.
