# Anti-Patterns: Auth Guards and Providers Architecture

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Laravel Auth Guards and Providers Architecture |
| Audience | Architects, Developers, Platform Engineers |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-AG-01 | Single Guard Monolith | Critical | High | Medium |
| AP-AG-02 | Implicit Guard Ambiguity | High | High | Low |
| AP-AG-03 | Web Guard Modification | High | Medium | Medium |
| AP-AG-04 | Orphaned Guard Configuration | Critical | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Copy-Paste Auth Configs**: Reusing the same auth.php without adjusting guard configurations per environment
- **Provider Misalignment**: Provider driver says `eloquent` but custom provider class registered — silent fallback to Eloquent
- **Missing Guard Tests**: No integration tests verifying each guard authenticates correctly under its intended strategy

---

## 1. Single Guard Monolith

### Category
Architecture · Security

### Description
Defining a single guard for all user types and authentication strategies, forcing web users, API clients, and admins through the same authentication mechanism.

### Why It Happens
Developers follow the default Laravel auth scaffolding without considering multi-user-type requirements. Starter kits ship a single `web` guard, and teams don't refactor as the app grows.

### Warning Signs
- `config/auth.php` has only one guard defined despite having both web and API routes
- API routes are protected with `auth` middleware (no guard specified) but use session driver
- Mobile or SPA clients cannot authenticate because the guard expects session cookies
- Admin and public routes share the same guard, making it impossible to use different User models

### Why Harmful
A single guard forces one authentication strategy across all route groups. Session-based guards expose API endpoints to CSRF and session fixation attacks. Token-based guards on web routes break redirect-based authentication flows. This architectural coupling prevents evolving auth strategies independently.

### Real-World Consequences
- Mobile API clients receive session cookies they cannot use, causing authentication failures
- Admin panel routes expose internal sessions to API consumers, creating a guard confusion vulnerability
- Adding a new user type (e.g., tenant) requires rewriting the entire guard rather than adding a new one
- Security audits flag mixed auth strategies as a high-risk finding

### Preferred Alternative
Define separate guards per user type with appropriate drivers:
```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'admin' => ['driver' => 'session', 'provider' => 'admins'],
    'api' => ['driver' => 'sanctum', 'provider' => 'users'],
],
```

### Refactoring Strategy
1. Audit all user types and their auth requirements
2. Create new guards for each distinct user type in `config/auth.php`
3. Define corresponding providers
4. Update route middleware to use explicit guard names (`auth:admin`, `auth:sanctum`)
5. Update Auth::check() and Auth::user() calls to reference the correct guard
6. Write integration tests verifying each guard authenticates independently

### Detection Checklist
- [ ] Run `php artisan auth:clear-resets` and inspect `config/auth.php` for guard count vs user types
- [ ] Search for `middleware('auth')` without guard specification in route files
- [ ] Check if API routes use `session` driver
- [ ] Verify admin routes have their own guard with separate provider

### Related Rules/Skills/Trees
- Use Separate Guards Per User Type (05-rules.md)
- Configure Auth Guards and Providers (06-skills.md)
- Guard Driver Selection decision tree (07-decision-trees.md)

---

## 2. Implicit Guard Ambiguity

### Category
Security · Maintainability

### Description
Relying on the default guard in route middleware and `Auth` facade calls without explicitly specifying which guard to use, creating ambiguity about which authentication strategy applies.

### Why It Happens
The default guard works during initial development when only one user type exists. As the app grows, developers add routes and auth calls without updating guard references, assuming the default always applies correctly.

### Warning Signs
- Widespread use of `auth` middleware without colon-suffixed guard name
- `Auth::check()`, `Auth::user()`, `Auth::id()` called without `guard()` in controllers serving multiple contexts
- API routes inconsistently authenticate depending on whether the request has a session cookie
- Adding a new guard causes existing routes to silently switch authentication

### Why Harmful
The default guard creates a hidden coupling between unrelated route groups. Changing the default to accommodate a new user type can break authentication for all routes that implicitly rely on it. Security reviews cannot determine which guard protects which route without tracing middleware resolution.

### Real-World Consequences
- API clients suddenly cannot authenticate after a default guard change from `web` to `sanctum`
- Admin routes protected by `auth` middleware accidentally authenticate public users against the admin provider
- Session fixation attacks succeed on API endpoints that implicitly use the `web` guard
- Penetration testers report "auth bypass — guard not enforced on route"

### Preferred Alternative
Always specify the guard explicitly in route middleware:
```php
Route::middleware('auth:sanctum')->group(function () {
    // API routes - explicitly Sanctum
});
Route::middleware('auth:admin')->group(function () {
    // Admin routes - explicitly admin guard
});
```

### Refactoring Strategy
1. Identify every route group and middleware call in `routes/` files
2. Replace `auth` with `auth:{guard_name}` for each group
3. Search all controllers for `Auth::check()`, `Auth::user()` and add `Auth::guard('...')` where ambiguous
4. Set `'defaults' => ['guard' => 'web']` as a known fallback, never changed
5. Add a CI lint rule forbidding middleware('auth') without guard specification

### Detection Checklist
- [ ] `grep -r "middleware('auth')" routes/` — count occurrences without guard
- [ ] `grep -r "Auth::user()" app/` — count calls without explicit guard
- [ ] Check if changing `defaults.guard` in auth.php breaks any routes
- [ ] Verify API integration tests pass when no session cookie is sent

### Related Rules/Skills/Trees
- Explicitly Specify Guard in Route Middleware (05-rules.md)
- Set Default Guard to Match Primary Use Case (05-rules.md)
- Guard Driver Selection decision tree (07-decision-trees.md)

---

## 3. Web Guard Modification

### Category
Architecture · Maintainability

### Description
Changing the `web` guard's driver from `session` or modifying its provider to use a different model, breaking Laravel framework conventions.

### Why It Happens
Developers see the `web` guard as just another configuration entry and modify it directly when they need a different auth strategy or user model for their web routes, rather than creating a new guard.

### Warning Signs
- `web` guard configured with `driver => 'sanctum'` or `driver => 'token'`
- `web` guard's provider points to a model other than `App\Models\User`
- Starter kit authentication (Fortify, Jetstream, Breeze) fails with obscure middleware errors
- `php artisan make:auth`-based scaffolding silently broken

### Why Harmful
Laravel's internal middleware, Fortify, Jetstream, Breeze, and countless packages assume the `web` guard uses `session` driver with a standard user provider. Changing this coupling breaks framework internals. The `auth` middleware, guest redirect, password confirmation, and email verification all hardcode references to the `web` guard.

### Real-World Consequences
- Fortify login returns 500 errors because it calls `Auth::guard('web')->attempt()` against a non-session driver
- Password reset links validate against the wrong guard, allowing cross-user-type password resets
- Framework upgrades introduce subtle auth bugs because internal assumptions about `web` guard are violated
- Community packages that check `Auth::guard('web')->check()` silently fail

### Preferred Alternative
Create a new guard for each distinct user type or auth strategy:
```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'admin' => ['driver' => 'session', 'provider' => 'admins'],
    'api' => ['driver' => 'sanctum', 'provider' => 'users'],
],
```

### Refactoring Strategy
1. Restore `web` guard to `session` driver with `users` provider
2. Create new guards for auth strategies that do not match the session+users pattern
3. Update all route middleware and Auth facade calls to reference the new guards
4. Verify framework features work (password reset, email verification, Fortify login)
5. Remove any custom service provider code that modifies the `web` guard at runtime

### Detection Checklist
- [ ] Compare `config/auth.php` guards.web against Laravel defaults
- [ ] Test starter kit features (login, register, password reset) — do they work?
- [ ] Run `php artisan route:list` — check if web routes use middleware that references `auth:web`
- [ ] Check service providers for `Auth::guard('web')->...` modifications

### Related Rules/Skills/Trees
- Never Modify the Web Guard's Driver or Provider (05-rules.md)
- Use Separate Guards Per User Type (05-rules.md)
- Single vs Multi-Guard Setup decision tree (07-decision-trees.md)

---

## 4. Orphaned Guard Configuration

### Category
Architecture · Reliability

### Description
Defining a guard that references a provider which is not defined in the `providers` array, or removing a provider while its guard remains configured, creating a runtime error on authentication attempt.

### Why It Happens
During refactoring, teams modify guard names or remove provider entries but forget to update the corresponding configuration. Guard configurations are not validated at boot time — errors only surface when authentication is attempted.

### Warning Signs
- `config/auth.php` has guards referencing provider names not found in the providers array
- Authentication returns `Unauthenticated` errors without clear explanation
- Custom provider classes are renamed or deleted but auth config still references old class names
- Only some user types can authenticate while others fail with opaque errors

### Why Harmful
An orphaned guard configuration degrades silently — Laravel does not validate guard-provider pairing at boot. The error message when authentication fails is `Unauthenticated`, which is indistinguishable from legitimate credential failure. Developers waste hours debugging why a guard that "should work" always returns null users.

### Real-World Consequences
- New team members add a guard without adding its provider, then file bugs about "auth not working"
- After refactoring providers from `eloquent` to custom, guards still reference the old driver — all attempts fail
- Multi-tenant setup breaks because the tenant guard references a provider deleted in a recent PR
- Production incidents where admin users cannot log in after a "harmless" config change

### Preferred Alternative
Every guard must map to a defined provider, and every provider must have a configured driver:
```php
'guards' => [
    'admin' => ['driver' => 'session', 'provider' => 'admins'],
],
'providers' => [
    'admins' => ['driver' => 'eloquent', 'model' => App\Models\Admin::class],
],
```

### Refactoring Strategy
1. Write a unit test that iterates `config('auth.guards')` and asserts every guard's provider exists in `config('auth.providers')`
2. Run this test in CI to prevent orphaned guards from reaching production
3. For each orphaned guard found, either add the missing provider or remove the guard
4. Consider creating an `AuthServiceProvider` boot-time check for development environments

### Detection Checklist
- [ ] Write a PHPUnit test: `foreach (config('auth.guards') as $name => $config) { $this->assertArrayHasKey($config['provider'], config('auth.providers')); }`
- [ ] Manual inspection: compare guard provider names against provider keys
- [ ] Test each guard's authentication endpoint individually
- [ ] Check for removed provider classes still referenced in config

### Related Rules/Skills/Trees
- Pair Every Guard With a Corresponding Provider (05-rules.md)
- Configure Auth Guards and Providers (06-skills.md)
- Provider Type Selection decision tree (07-decision-trees.md)
