# Rules: Auth Guards and Providers Architecture

## Use Separate Guards Per User Type
---
## Category
Architecture
---
## Rule
Create distinct guards for each user type (web, admin, API) instead of using one guard for all authentication strategies.
---
## Reason
A single guard forces all user types into the same authentication strategy, causing session auth on API routes or token auth on web routes, leading to guard confusion and auth bypass vulnerabilities.
---
## Bad Example
```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'api' => ['driver' => 'session', 'provider' => 'users'], // API routes use session
],
```
---
## Good Example
```php
'guards' => [
    'web' => ['driver' => 'session', 'provider' => 'users'],
    'admin' => ['driver' => 'session', 'provider' => 'admins'],
    'api' => ['driver' => 'sanctum', 'provider' => 'users'],
],
```
---
## Exceptions
Stateless microservices without user authentication may not need multiple guards.
---
## Consequences Of Violation
Auth bypass, wrong strategy applied to routes, session leakage to API endpoints.
---

## Explicitly Specify Guard in Route Middleware
---
## Category
Security
---
## Rule
Always specify the guard name in route middleware (`auth:admin`, `auth:sanctum`) instead of relying on the default guard.
---
## Reason
The default guard applies when no guard is specified. If the default is `web`, API routes will incorrectly attempt session authentication, creating an auth bypass for token-based clients and exposing session vulnerabilities.
---
## Bad Example
```php
Route::middleware('auth')->group(function () {
    // Uses default guard — ambiguous which strategy applies
});
```
---
## Good Example
```php
Route::middleware('auth:admin')->group(function () {
    // Explicit admin guard
});
Route::middleware('auth:sanctum')->group(function () {
    // Explicit Sanctum API guard
});
```
---
## Exceptions
When all routes in the application use the same guard and the default is correctly configured for that strategy.
---
## Consequences Of Violation
Ambiguous auth strategy, wrong guard applied to routes, session fixation on API endpoints.
---

## Never Modify the Web Guard's Driver or Provider
---
## Category
Maintainability
---
## Rule
Keep the `web` guard using the `session` driver and its default provider. Create a new guard instead of modifying `web` to change user retrieval or authentication strategy.
---
## Reason
The `web` guard is assumed by Laravel's internal middleware, Fortify, and Starter Kits to use the session driver. Changing its driver or provider breaks framework conventions, causes unpredictable auth behavior, and breaks upgrade compatibility.
---
## Bad Example
```php
'web' => ['driver' => 'sanctum', 'provider' => 'admins'], // Changed driver and provider
```
---
## Good Example
```php
'web' => ['driver' => 'session', 'provider' => 'users'],
'admin' => ['driver' => 'session', 'provider' => 'admins'], // New guard for admins
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Broken Starter Kit auth, unpredictable middleware behavior, upgrade failures.
---

## Pair Every Guard With a Corresponding Provider
---
## Category
Architecture
---
## Rule
Define a provider for every guard in `config/auth.php`. Guards and providers must be explicitly paired.
---
## Reason
A guard without a provider cannot retrieve users. Laravel will throw a runtime error when authentication is attempted. Orphaned guard configurations silently degrade to unauthenticated responses.
---
## Bad Example
```php
'guards' => [
    'admin' => ['driver' => 'session', 'provider' => 'admins'], // 'admins' provider not defined
],
```
---
## Good Example
```php
'guards' => [
    'admin' => ['driver' => 'session', 'provider' => 'admins'],
],
'providers' => [
    'admins' => ['driver' => 'eloquent', 'model' => App\Models\Admin::class],
],
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Runtime errors during authentication, silent failures returning unauthenticated users.
---

## Implement UserProvider Contract for Non-DB User Storage
---
## Category
Architecture
---
## Rule
Implement `Illuminate\Contracts\Auth\UserProvider` when user data comes from LDAP, REST API, file storage, or any non-Eloquent/non-DB source.
---
## Reason
Default providers (`eloquent`, `database`) assume relational database storage. Custom data sources require a provider implementation that translates the custom storage's user representation into an `Authenticatable` contract. Without it, authentication silently fails.
---
## Bad Example
```php
// Using eloquent provider for LDAP users — never works
'ldap' => ['driver' => 'eloquent', 'model' => User::class],
```
---
## Good Example
```php
// Register custom provider
Auth::provider('ldap', function ($app, array $config) {
    return new LdapUserProvider($app->make(LdapConnection::class));
});

'providers' => [
    'ldap' => ['driver' => 'ldap'],
],
```
---
## Exceptions
Small internal tools where the custom source can be periodically imported into a database table.
---
## Consequences Of Violation
Authentication always fails for non-DB sources, forcing workarounds.
---

## Set Default Guard to Match Primary Use Case
---
## Category
Architecture
---
## Rule
Configure the default guard in `auth.php` to match the application's primary authentication use case — `web` for traditional web apps, `sanctum` for API-first apps.
---
## Reason
The default guard is used by `Auth::check()`, `Auth::user()`, and the `auth` middleware when no guard is specified. A mismatched default causes every implicit auth call to use the wrong strategy, requiring verbose guard overrides everywhere.
---
## Bad Example
```php
// API-first app with default 'web'
'defaults' => ['guard' => 'web'],
```
---
## Good Example
```php
// API-first app defaulting to Sanctum
'defaults' => ['guard' => 'sanctum'],
```
---
## Exceptions
Applications with balanced web and API usage may keep `web` as default and explicitly guard API routes.
---
## Consequences Of Violation
Every implicit auth call uses wrong strategy, requiring manual guard specification everywhere.
---

## Cache Session Storage With Redis in Multi-Server Deployments
---
## Category
Performance
---
## Rule
Use Redis or database session drivers for production deployments with multiple web servers. Never use the `file` session driver in distributed environments.
---
## Reason
File sessions are stored on individual server filesystems. A request handled by server A creates a session file that server B cannot read, causing random session losses, forced logouts, and authentication failures when load-balanced.
---
## Bad Example
```php
// config/session.php
'driver' => env('SESSION_DRIVER', 'file'), // Default — broken with load balancers
```
---
## Good Example
```php
'driver' => env('SESSION_DRIVER', 'redis'), // Shared across all servers
```
---
## Exceptions
Single-server production deployments may use file sessions with caution.
---
## Consequences Of Violation
Intermittent session loss, user logouts, cache stampede on session regeneration.
