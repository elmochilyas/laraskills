# Anti-Patterns: Middleware Ordering and Priority

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Middleware Ordering and Priority |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Auth After SubstituteBindings | Security | Critical |
| 2 | Rate Limiting After Auth | Security | High |
| 3 | CSRF Before Session | Security | Critical |
| 4 | Complete Priority Override Without Framework Middleware | Maintenance | High |
| 5 | Not Adding Custom Middleware to Priority When Position Matters | Reliability | Medium |

---

## Anti-Pattern 1: Auth After SubstituteBindings

### Category
Security

### Description
Middleware ordering where `Authenticate` runs after `SubstituteBindings` (route model binding), so user authentication state is not available when route models are bound.

### Why It Happens
The default Laravel priority chain places `SubstituteBindings` after auth. If a developer overrides the priority array and inadvertently moves auth after bindings, or if a custom middleware insertion reorders them.

### Warning Signs
- Route model binding queries do not have access to the authenticated user
- Implicit or explicit binding resolves models without tenant/user scoping
- All users can access all resources regardless of ownership
- Scoped bindings that rely on `Auth::user()` fail silently (no error, but wrong data)
- Comment in code: "We need to manually check Auth in the controller after binding"

### Why Harmful
Route model binding is a powerful feature that resolves models before the controller runs. If auth runs after binding, the binding cannot scope queries by the authenticated user. All users see all resources. Tenant isolation, ownership checks, and data scoping in binding are impossible.

### Real-World Consequences
- `Route::get('/orders/{order}', ...)` with implicit binding loads ALL orders
- Binding is not scoped: `Order::find($id)` instead of `Order::where('user_id', Auth::id())->find($id)`
- Auth runs after binding; `Auth::user()` is null during binding
- Users can access any order by guessing IDs
- Security incident: order data exposed before auth runs

### Preferred Alternative
Ensure `SubstituteBindings` runs AFTER auth in the priority chain. The default order is `Auth → SubstituteBindings`. Maintain this when customizing priority.

```php
// Correct priority order
$middleware->priority([
    // ... cookies, session, CSRF, throttle ...
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    // ... other middleware ...
]);
```

### Refactoring Strategy
1. Verify current priority order: auth must come before SubstituteBindings
2. If using custom priority, ensure `Authenticate` is before `SubstituteBindings`
3. Add route model binding scoping using `Auth::user()` (it should now be available)
4. Test: unauthorised user cannot access scoped models
5. Document: auth must always precede SubstituteBindings in priority

### Detection Checklist
- [ ] `Authenticate` runs before `SubstituteBindings` in priority chain
- [ ] Route model binding queries can access `Auth::user()`
- [ ] Scoped bindings (tenant, ownership) work correctly
- [ ] Unauthenticated users cannot access resources through URL manipulation
- [ ] Default priority chain order is maintained

### Related Rules/Skills/Trees
- Rule: Auth after SubstituteBindings means user info is not available during binding
- Rule: Auth before SubstituteBindings — authenticated user available for scoped binding
- Related KU: Route Model Binding (scoped bindings)

---

## Anti-Pattern 2: Rate Limiting After Auth

### Category
Security

### Description
`ThrottleRequests` (rate limiting) middleware running after `Authenticate`, so unauthenticated requests (login attempts, password resets) are not throttled.

### Why It Happens
The default priority chain places auth before throttle. Developers assume this order is correct for all routes without considering that authentication endpoints need throttling more than authenticated routes.

### Warning Signs
- Login endpoint has no rate limiting (unlimited brute-force attempts)
- Password reset endpoint can be called unlimited times
- Public registration endpoint allows unlimited account creation
- Auth short-circuits on login page (user is not authenticated); throttle never runs
- Monitoring shows thousands of login attempts with no rate limit enforcement

### Why Harmful
Authentication endpoints are the most critical to rate limit. If throttle runs after auth, unauthenticated requests (which are the bulk of login attempts) never reach the throttle middleware. Attackers can brute-force credentials, spam registration forms, and abuse password reset without limitation.

### Real-World Consequences
- Login page has 0 rate limiting; attacker tries 10,000 passwords per minute
- No throttle because: auth middleware runs before throttle and short-circuits (user not logged in → redirect)
- Throttle middleware never executes for unauthenticated requests to login
- Brute-force attack succeeds after 2 hours of continuous attempts
- Solution: apply throttle specifically to login route with priority before auth

### Preferred Alternative
Apply rate limiting middleware specifically to authentication routes, with priority before auth. Use route-level throttle for login endpoints.

```php
// Apply throttle specifically to auth endpoints (before auth middleware)
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1'); // 5 attempts per minute

// Ensure throttle runs before auth on these routes
// Use priority or route-level middleware order
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \Illuminate\Routing\Middleware\ThrottleRequests::class,
);
```

### Refactoring Strategy
1. Identify all authentication endpoints (login, register, password reset, verify email)
2. Apply route-level `throttle` middleware to each with appropriate limits
3. Ensure throttle runs before auth on these routes (priority or explicit route order)
4. Test: rapid login attempts return 429 before reaching auth
5. Monitor rate limit hit rate on auth endpoints

### Detection Checklist
- [ ] Login endpoint has rate limiting that runs before auth
- [ ] Password reset endpoint is throttled
- [ ] Registration endpoint has per-IP rate limiting
- [ ] Unauthenticated requests to auth endpoints are rate-limited
- [ ] Brute-force attack triggers 429, not login redirect

### Related Rules/Skills/Trees
- Rule: Rate limiting should be applied BEFORE auth on authentication endpoints
- Rule: Unauthenticated requests are never throttled if throttle runs after auth
- Related KU: Rate Limiting (authentication endpoint throttling)

---

## Anti-Pattern 3: CSRF Before Session

### Category
Security

### Description
CSRF verification middleware (`ValidateCsrfToken`) executing before session middleware (`StartSession`), so the CSRF token cannot be read from the session and every POST request fails.

### Why It Happens
If custom priority ordering places CSRF before session, or if CSRF is registered in a group that runs before session middleware. The error is immediate and obvious (all POST requests fail), so it is usually caught quickly.

### Warning Signs
- All POST forms return 419 (CSRF token mismatch)
- Page load works but form submission fails
- Session data is not available when CSRF middleware runs
- Error log: CSRF token validation fails for every POST request
- Priority array shows CSRF before session

### Why Harmful
CSRF protection requires an active session to store and validate the CSRF token. Without the session, the middleware cannot compare the submitted token against the stored token. Every POST request fails, making the application completely non-functional for form submission.

### Real-World Consequences
- Custom priority override places `ValidateCsrfToken` before `StartSession`
- All POST requests return 419 CSRF token mismatch
- Login form, registration, profile update — everything fails
- Emergency rollback of middleware priority change
- Fix: move CSRF after session in priority chain

### Preferred Alternative
Ensure session middleware runs before CSRF middleware. The default Laravel priority chain already has this order.

```php
// Correct priority order
$middleware->priority([
    \Illuminate\Session\Middleware\StartSession::class,
    // ...
    \App\Http\Middleware\ValidateCsrfToken::class,
    // ... throttle, auth, bindings ...
]);

// Or use prepend/append for targeted insertion
$middleware->prependToPriorityList(
    before: \App\Http\Middleware\VerifyCsrfToken::class,
    prepend: \Illuminate\Session\Middleware\StartSession::class,
);
```

### Refactoring Strategy
1. Verify priority order: session must be before CSRF
2. If using custom priority array, ensure `StartSession` precedes any CSRF middleware
3. Test: page load → form submission → success (no 419)
4. Review any group-level CSRF registration for session dependency
5. Document: CSRF requires session

### Detection Checklist
- [ ] Session middleware runs before CSRF middleware
- [ ] All POST forms work (no 419 CSRF mismatch)
- [ ] CSRF token can be validated against session
- [ ] Default priority chain maintains session-before-CSRF
- [ ] Custom priority arrays respect session-before-CSRF

### Related Rules/Skills/Trees
- Rule: CSRF before session means CSRF token cannot be read from session
- Rule: CSRF requires session — session must start before CSRF validation
- Related KU: CSRF Protection (session dependency)

---

## Anti-Pattern 4: Complete Priority Override Without Framework Middleware

### Category
Maintenance

### Description
Overriding the entire `$middleware->priority([...])` array without including all framework middleware, causing new or omitted middleware to run at the end (non-priority).

### Why It Happens
Developers customize the priority array for their application's middleware and copy only the middleware they know about. New framework versions may add middleware to the default priority list.

### Warning Signs
- Priority array contains only custom and a few framework middleware
- New Laravel version introduced middleware that is not in the priority array
- The omitted middleware runs after all priority middleware
- Version-specific behavior breaks (features that depend on omitted middleware order)
- Comment in priority array: "Only listing middleware we care about"

### Why Harmful
Framework middleware that is omitted from the custom priority array runs at the end of the pipeline (non-priority, after all priority items). This may break version-specific behavior that depends on the middleware running at a specific position.

### Real-World Consequences
- Laravel 12 adds `HandlePrecognitiveRequests` to the default priority list
- Application overrides priority array without including it
- `HandlePrecognitiveRequests` runs at the end (after all priority middleware)
- Precognitive requests are processed after other middleware expected them to run
- Feature breaks silently: precognitive validation works but behaves differently
- Debugging: "Why does precognitive validation not run before auth?"

### Preferred Alternative
Use targeted priority insertion (`prependToPriorityList`, `appendToPriorityList`) instead of full override. If full override is necessary, include ALL framework middleware from the default priority list.

```php
// Preferred: targeted insertion
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \App\Http\Middleware\EnsureUserIsActive::class,
);

// If full override required: include ALL framework middleware
$middleware->priority([
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    // ... ALL other framework middleware ...
    \App\Http\Middleware\CustomMiddleware::class,
]);
```

### Refactoring Strategy
1. Check if a custom priority override exists
2. Compare against Laravel's default priority list (from framework source)
3. Switch to targeted insertion to avoid full override
4. If full override is needed, include all framework middleware
5. Add upgrade review: check priority array completeness after Laravel upgrades

### Detection Checklist
- [ ] Full priority override includes all framework middleware
- [ ] Targeted insertion is preferred over full override
- [ ] No framework middleware runs at non-priority position unintentionally
- [ ] Laravel version upgrade includes priority array review
- [ ] New framework middleware is added to priority array when needed

### Related Rules/Skills/Trees
- Rule: Do NOT override the entire priority array without including all framework middleware
- Rule: Omitted framework middleware runs at the end (non-priority)
- Related KU: Laravel 11 vs 10 Registration (priority API)

---

## Anti-Pattern 5: Not Adding Custom Middleware to Priority When Position Matters

### Category
Reliability

### Description
Creating custom middleware that must run before or after specific framework middleware but not adding it to the priority array, so its position depends on arbitrary merge order.

### Why It Happens
Developers register middleware in the group array and assume the order in the array determines execution order. They do not realize the priority array overrides registration order.

### Warning Signs
- Custom middleware must run before auth (e.g., `EnsureUserIsActive`)
- Custom middleware is only registered in the group array, not in priority
- The middleware sometimes works, sometimes not (depends on merge order)
- Comment: "This middleware should run before auth but we haven't tested if it does"
- Priority array contains only framework middleware, no custom middleware

### Why Harmful
Without priority placement, custom middleware runs after all priority middleware (including auth). A middleware that must run before auth (to block inactive users from authenticating) runs after auth has already authenticated them. The middleware executes but its guard logic is useless.

### Real-World Consequences
- `EnsureUserIsActive` middleware registered in `web` group array
- Priority array has `auth` in first position; `EnsureUserIsActive` not in priority
- Pipeline: auth runs first (priority), user is authenticated successfully
- `EnsureUserIsActive` runs after auth: checks if user is active
- User is inactive but already authenticated; guard has already passed
- Inactive user can access authenticated routes for the duration of the request

### Preferred Alternative
Add custom middleware to the priority array if its position relative to framework middleware matters.

```php
// Wrong: custom middleware not in priority, runs after auth
$middleware->group('web', [
    \App\Http\Middleware\EnsureUserIsActive::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
]);

// Correct: add to priority so it runs before auth
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \App\Http\Middleware\EnsureUserIsActive::class,
);
```

### Refactoring Strategy
1. Identify custom middleware whose position relative to framework middleware matters
2. Use prepend/append to priority list for targeted positioning
3. Verify execution order with a test or debug output
4. Document why each custom middleware needs a specific position
5. Remove any workaround logic in the middleware that compensates for wrong position

### Detection Checklist
- [ ] Custom middleware with position requirements is in the priority array
- [ ] Middleware that must run before auth is placed before auth in priority
- [ ] Execution order is verified by test
- [ ] No compensations in middleware for wrong position
- [ ] Priority position is documented

### Related Rules/Skills/Trees
- Rule: Add custom middleware to priority if position matters
- Rule: Without priority placement, it runs after all priority middleware
- Related KU: Custom Middleware (testing execution order)
