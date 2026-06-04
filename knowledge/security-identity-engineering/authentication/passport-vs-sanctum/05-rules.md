# Rules: Passport vs Sanctum Decision Framework

## Default to Sanctum for API Authentication
---
## Category
Architecture
---
## Rule
Start with Sanctum for all API authentication needs. Only introduce Passport when third-party OAuth2 provider requirements are confirmed and cannot be met by Sanctum.
---
## Reason
Sanctum covers approximately 80% of API authentication use cases with minimal complexity. Passport introduces OAuth2 client management, grant types, RSA key infrastructure, and multiple database tables. Adopting Passport preemptively adds significant maintenance overhead without benefit for first-party auth.
---
## Bad Example
```php
// Installing Passport for a first-party SPA and mobile app
composer require laravel/passport
```
---
## Good Example
```php
// Start with Sanctum — add Passport only when third-party OAuth2 is required
composer require laravel/sanctum
```
---
## Exceptions
Applications known from day one to be an OAuth2 provider for third-party developers.
---
## Consequences Of Violation
Unnecessary OAuth2 complexity, hours of setup time, maintenance burden without benefit.
---

## Use Sanctum for First-Party, Passport for Third-Party OAuth2
---
## Category
Architecture
---
## Rule
Use Sanctum for first-party clients (your own SPA, mobile app) and Passport for third-party OAuth2 delegation. Both can coexist with separate guards.
---
## Reason
Sanctum is designed for first-party authentication — simple token model, cookie-based SPA auth, ability scoping. Passport handles the full OAuth2 protocol for third-party delegated authorization. Using each for its intended purpose provides the right level of complexity for each use case.
---
## Bad Example
```php
// Forcing Sanctum to handle third-party OAuth2 — unsupported
```
---
## Good Example
```php
'guards' => [
    'api' => ['driver' => 'sanctum', 'provider' => 'users'], // First-party
    'oauth' => ['driver' => 'passport', 'provider' => 'users'], // Third-party
],
```
---
## Exceptions
Applications that only need first-party authentication (no dual setup needed).
---
## Consequences Of Violation
Sanctum cannot do delegated authorization; Passport over-complicates first-party auth.
---

## Use Sanctum Cookie Auth for Same-Domain SPAs
---
## Category
Security
---
## Rule
Use Sanctum's cookie-based SPA mode for browser applications on the same domain. Reserve Bearer tokens for mobile, cross-domain, and non-browser clients.
---
## Reason
Cookie auth provides better browser security — `httpOnly` session cookies prevent XSS-based token theft, CSRF protection via `Same-Site` cookies, and no token storage in JavaScript-accessible storage. Bearer tokens stored in `localStorage` or `sessionStorage` are accessible to any JavaScript on the page.
---
## Bad Example
```php
// Using Bearer tokens for same-domain SPA
$user->createToken('spa-token')->plainTextToken;
// Stored in localStorage — XSS-vulnerable
```
---
## Good Example
```php
// SPA cookie auth — httpOnly session cookie, CSRF protected
// /sanctum/csrf-cookie -> session cookie set automatically
```
---
## Exceptions
Cross-domain SPAs where cookie auth is not feasible — use Bearer tokens with secure storage.
---
## Consequences Of Violation
XSS vulnerability exposing tokens, session theft.
---

## Avoid Dual Setup Unless Third-Party OAuth2 Is Confirmed
---
## Category
Architecture
---
## Rule
Do not install Passport alongside Sanctum unless third-party OAuth2 requirements are explicitly confirmed. Start with Sanctum alone.
---
## Reason
Running both Sanctum and Passport adds complexity: two sets of token tables, two authentication guards, two configuration files. Passport's client management UI, OAuth2 routes, and RSA key infrastructure remain unused if only first-party auth is needed.
---
## Bad Example
```php
// Both installed "just in case" — unnecessary complexity
composer require laravel/sanctum laravel/passport
```
---
## Good Example
```php
// Start with Sanctum; add Passport only when needed
composer require laravel/sanctum
```
---
## Exceptions
Applications designed as an API platform where third-party OAuth2 is planned from launch.
---
## Consequences Of Violation
Unnecessary infrastructure, maintenance debt, unused OAuth2 tables.
---

## Configure SPA Routes With Sanctum, Not Passport
---
## Category
Architecture
---
## Rule
Protect first-party SPA routes with Sanctum's `auth:sanctum` guard. Reserve Passport-protected routes for third-party OAuth2 clients.
---
## Reason
Sanctum's SPA cookie auth is simpler and more secure for first-party browser apps. Passport's Authorization Code + PKCE flow is designed for third-party delegated access. Using Passport for first-party SPA auth forces users through an unnecessary OAuth2 authorization dialog.
---
## Bad Example
```php
// First-party SPA using Passport Authorization Code flow
Route::middleware('auth:oauth')->group(function () { ... });
```
---
## Good Example
```php
// First-party SPA using Sanctum cookie auth
Route::middleware('auth:sanctum')->group(function () { ... });
```
---
## Exceptions
No common exceptions — Sanctum is the correct choice for first-party SPAs.
---
## Consequences Of Violation
Unnecessary OAuth2 dialog, complex flow, poor UX.
---

## Never Use Password Grant in Sanctum or Passport
---
## Category
Security
---
## Rule
Do not implement the Password Grant flow in either Sanctum or Passport. Sanctum does not need grants; Passport's Password Grant is deprecated.
---
## Reason
Password Grant exposes the user's credentials to the client application, does not support MFA, and is deprecated in OAuth2 security best practices. Sanctum's token model issues tokens directly without grants. Passport's Password Grant was removed or deprecated in recent versions.
---
## Bad Example
```php
// Password Grant — deprecated
$response = $http->post('/oauth/token', [
    'grant_type' => 'password',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'username' => $email,
    'password' => $password,
]);
```
---
## Good Example
```php
// Sanctum: direct token creation
$token = $user->createToken('mobile-app', ['read'])->plainTextToken;

// Passport: Authorization Code + PKCE for third-party clients
// Use the OAuth2 authorization flow instead
```
---
## Exceptions
No common exceptions — Password Grant is deprecated and should not be used.
---
## Consequences Of Violation
Credential exposure, no MFA support, deprecated security practice.
