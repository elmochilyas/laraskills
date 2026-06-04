# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Laravel Auth guards and providers architecture
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's authentication system is a factory-managed, contract-driven architecture built on two abstractions: Guards (how authentication state is maintained per request) and Providers (how users are retrieved from storage). The `AuthManager` resolves Guard instances by name; each Guard delegates to a named Provider to fetch user records. This decoupling allows mixing session-based auth for web routes with token-based auth for APIs, custom providers for LDAP/legacy databases, and custom guards for stateless API patterns — all from a single `config/auth.php` configuration.

---

# Core Concepts

- **Guard** (`Illuminate\Contracts\Auth\Guard`): Defines how users are authenticated per request. Tracks whether a user is logged in and how to retrieve the authenticated user. Built-in: `SessionGuard` (session/cookie state), `TokenGuard` (API token header), `RequestGuard` (closure-based for Sanctum).
- **Provider** (`Illuminate\Contracts\Auth\UserProvider`): Defines how users are retrieved from persistent storage. Built-in: `EloquentUserProvider` (model-based), `DatabaseUserProvider` (query builder).
- **AuthManager**: Factory that resolves guards by name, lazy-loads and caches them. Handles custom driver registration via `extend()`, custom provider registration via `provider()`.
- **Authenticatable** (`Illuminate\Contracts\Auth\Authenticatable`): Contract every user object must implement. Methods: `getAuthIdentifier()`, `getAuthPassword()`, `getRememberToken()`, etc.
- **Configuration**: `config/auth.php` defines `defaults` (default guard, password broker), `guards` (named with driver and provider), `providers` (named with driver and model/table).

---

# Mental Models

- **Key-Lock Pattern**: Guards are locks (how to check credentials), providers are key-makers (where to find keys). You can change the lock without changing the key-maker.
- **Middleware Pipeline**: The `auth` middleware resolves the guard by name, calls `guard->check()`, and if false, redirects/aborts. The middleware never touches the provider directly.
- **Stack of Named Instances**: Think of `Auth::guard('web')`, `Auth::guard('api')` as separate login silos. A user can be authenticated on one guard and not another — they maintain independent state.

---

# Internal Mechanics

- **Resolution Flow**: `Auth::guard('web')` → `AuthManager->guard('web')` → checks if guard is already resolved in `$this->guards` array → if not, calls `resolve('web')` → reads `config/auth.php` for guard config → factory method (`createSessionDriver`, `createTokenDriver`, or custom via `extend()`) → resolves the provider by name → returns guard instance.
- **SessionGuard Login**: `attempt($credentials)` fires `Attempting` event → calls provider `retrieveByCredentials()` → calls provider `validateCredentials()` via `Hash::check()` → if successful, calls `login()` → regenerates session ID → fires `Login` event → updates `remember_token` if requested. The authenticated user is stored in session by identifier.
- **SessionGuard per-request resolution**: `StartSession` middleware reads session ID from cookie → hydrates session → `auth` middleware calls `guard->user()` → `SessionGuard` retrieves user ID from session → calls `provider->retrieveById()`. No password check per request.
- **TokenGuard**: Reads `Authorization: Bearer <token>` header → extracts token value → calls `provider->retrieveByToken()`.
- **EloquentUserProvider**: `retrieveByCredentials()` filters out `password` key, builds `where()` clauses for each remaining credential field, calls `first()`. `validateCredentials()` delegates to `Hash::check()`. `rehashPasswordIfRequired()` checks `Hash::needsRehash()` and updates password if needed (since Laravel 11).
- **AuthManager** is a `Manager` pattern: it resolves drivers lazily, allows extending via `extend()` and `provider()`, and supports `viaRequest()` for simple closure-based custom guards.

---

# Patterns

## Named Guards Pattern
- **Purpose**: Isolate authentication contexts (web admins vs API users vs customers).
- **Benefits**: Separate session state, different providers, independent middleware.
- **Tradeoffs**: Configuration complexity; must remember to specify guard in middleware.

## Custom Provider Pattern
- **Purpose**: Authenticate against non-Eloquent sources (APIs, LDAP, files).
- **Benefits**: Full `Auth::attempt()` compatibility without changing application code.
- **Tradeoffs**: Must implement all `UserProvider` methods; some features depend on Eloquent model behaviors (mutators, relationships).

## Guard Chain via `Auth::shouldUse()`
- **Purpose**: Set the default guard for the current request context.
- **Benefits**: Controllers can switch auth context without rewriting middleware.
- **Tradeoffs**: Only affects facade resolution; does not prevent explicit guard specification.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Single guard vs multi-guard | Simple apps vs admin/API separation | Start with single guard; split only when auth models diverge |
| Custom provider vs extending User model | Legacy/third-party user stores | Custom provider for non-Eloquent sources; extend User model if adding columns/relationships |
| Session vs Token guard | Web vs API routes | Session for browser; Token for API. Sanctum combines both via the `sanctum` guard |
| Extend vs viaRequest | Complex custom guard vs simple callback | `extend()` for full Guard implementation; `viaRequest()` for simple header/query checks |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Decoupled guards/providers makes custom auth easy | Configuration indirection makes debugging harder | You trace through factory → guard → provider chain to understand auth flow |
| Guards cache resolved instance per request | In-memory state can leak between requests under Octane | Must reset guard state or use singleton-aware patterns |
| Multiple guards allow auth isolation | Developers must specify correct guard everywhere | Common bug: using default guard for admin routes, getting null user |

---

# Performance Considerations

- Guard resolution happens once per request (cached in `AuthManager->guards` array).
- `SessionGuard->user()` triggers one provider `retrieveById()` call per request.
- TokenGuard triggers one provider `retrieveByToken()` call per request.
- EloquentProvider queries hit the database each request unless the user model is already loaded in the ORM cache.
- Octane/Swoole: Guard instances persist across requests. The `AuthManager` must be configured to flush guards between requests via `forgetGuards()`.

---

# Production Considerations

- **Octane**: Set `config('octane.cache.auth')` to control guard state flushing. Unauthenticated guard state must not leak between requests.
- **Horizon**: Queued jobs use `Auth::id()` or pass user ID explicitly — never serialize the entire guard instance.
- **Testing**: `$this->actingAs($user)` sets the user on the default guard. Use `$this->actingAs($user, 'api')` for multi-guard apps.
- **Multiple providers**: Each provider can have its own database connection for user isolation.

---

# Common Mistakes

- **Assuming all guards share state**: A user logged in via `web` is not automatically logged in on `api`. Must authenticate separately or use Sanctum's shared guard pattern.
- **Forgetting to register custom drivers in a service provider**: Calling `Auth::extend()` in `AppServiceProvider::boot()` not `register()`.
- **Not implementing `rehashPasswordIfRequired`**: Old custom providers break when `Hash::needsRehash()` triggers and the provider has no rehash method.
- **Using `Auth::user()` in multi-guard context without specifying guard**: Returns null if the default guard is not the one with the authenticated user.

---

# Failure Modes

- **Guard Resolution Failure**: Misconfigured `driver` key → `InvalidArgumentException: Authentication guard [x] is not defined.`
- **Provider Resolution Failure**: Misconfigured `model` key or missing Eloquent model → `LogicException: Provider [x] must have a model`
- **Authenticatable Contract Violation**: Custom user class not implementing `Authenticatable` → `TypeError` when guard calls `getAuthIdentifier()` on non-object
- **Session Guard Logout Not Cleared**: If the user is deleted from the database after login, `retrieveById()` returns null, but the guard still has the session. `$user = Auth::user()` returns null, but `Auth::check()` triggers another DB call — can cause infinite redirect loops.

---

# Ecosystem Usage

- **Laravel Framework**: `SessionGuard` (Illuminate/Auth/SessionGuard.php), `TokenGuard` (Illuminate/Auth/TokenGuard.php), `EloquentUserProvider`, `AuthManager`.
- **Sanctum**: Registers the `sanctum` guard via `AuthManager::viaRequest()` — a `RequestGuard` closure that checks for either session cookie or Bearer token.
- **Passport**: Registers its own stateless guard that validates OAuth2 bearer tokens via token and scope checks.
- **Jetstream/Fortify**: Configure default guard in `config/fortify.php`; must be a `StatefulGuard` for session management
- **Spatie Permission**: Uses `Auth::guard()` to detect the default guard; integrates via `Gate::before()`.

---

# Related Knowledge Units

- Prerequisites: Eloquent ORM basics, service providers, middleware pipeline, config files
- Related: Sanctum SPA vs Token auth (dual resolution path), Passport OAuth2 guard (stateless token guard), Fortify action pipeline (uses guards internally)
- Advanced Follow-up: Custom Guard implementation, Multi-guard architecture patterns, Octane auth state management, Guard event listener patterns

---

# Research Notes

- The `rehashPasswordIfRequired` method was added to `UserProvider` contract in Laravel 11 — custom providers must implement it or get a runtime error.
- `EloquentUserProvider` has a `withQuery()` callback since Laravel 11, allowing provider-level query modification (soft delete filtering, tenant scoping).
- Sanctum's dual-resolution pattern (session first, token fallback) is unique in the ecosystem — most frameworks pick one or the other.
- Passport uses a completely separate token validation path through `league/oauth2-server` — it does not use Laravel's Guard/Provider system for token validation.
- The `AuthManager` supports `forgetGuards()` to clear resolved guard instances — essential for Octane request lifecycle management.

## Ecosystem Usage
- **Laravel Sanctum**: Token-based API authentication with ability scoping; integrates via HasApiTokens trait and AuthManager guard registration using iaRequest(). Sanctum provides a dual SPA/token resolution path.
- **Laravel Passport**: Full OAuth2 server implementation using league/oauth2-server; provides Passport guards, token validation middleware, and scope-based authorization. Used for third-party API access delegation.
- **Laravel Fortify**: Headless authentication backend implementing register, login, password reset, email verification, and two-factor authentication. Designed for integration with Vue/React SPAs via API routes.
- **Laravel Jetstream**: Application starter kit combining Fortify, Livewire/Inertia, teams, and Sanctum/Telescope integration. Provides pre-built authentication views.
- **Laravel Breeze**: Minimal authentication scaffolding using Blade or Inertia/Vue/React; provides a lighter alternative to Jetstream with simple authentication views.
- **Spatie Laravel Passkeys**: Adds WebAuthn/passkey support using Laravel's authentication system; registers passkeys as an additional authentication factor compatible with Sanctum and session guards.
- **Socialite**: OAuth1/OAuth2 social login provider for Laravel; supports 20+ providers (Google, GitHub, Facebook, etc.) and allows custom provider implementations via Socialite::extend().
- **WorkOS**: Enterprise SSO integration using SAML and OIDC protocols; provides a Laravel-specific package for directory sync and SSO authentication flows.

## Research Notes
- Sanctum's dual-path resolution (session cookie first, Bearer token fallback) is unique in the PHP ecosystem — most libraries choose one authentication mode exclusively. This dual mode introduces subtle behavior differences: SPA auth supports ability checking, token auth does not.
- Passport 12+ dropped support for password grants in favor of the Authorization Code Grant with PKCE, aligning with OAuth2 Security Best Current Practices (BCP) and deprecating the resource owner password flow.
- Fortify's action-based architecture (actions for login, register, password reset, etc.) allows complete customization of authentication behavior without forking framework code — each action can be overridden via Fortify::loginView() or custom action classes.
- WebAuthn and passkey support in Laravel (via spatie/laravel-passkeys and community packages) relies on PHP's gmp or cmath extensions for cryptographic operations — servers without these extensions cannot validate WebAuthn assertions.
- OIDC integration in Laravel uses Socialite as the primary abstraction for provider interaction, but production SSO systems should use league/oauth2-client directly for better control over provider configuration and token handling.
- SAML SSO for Laravel (via community packages like lightsaml/lightsaml) requires XML signature verification using PHP's openssl extension — the assertion processing pipeline handles XML security, signature verification, and session mapping.
- The uth.guards.providers architecture decouples authentication method from user storage — this enables LDAP, OIDC, SAML, and database-backed authentication to coexist within a single application.
- MFA TOTP (via pragmarx/google2fa-laravel or Fortify's built-in 2FA) generates time-based one-time passwords using HMAC-SHA1 with 30-second windows — the recovery codes provide backup access when the authenticator device is lost.

## Internal Mechanics
- **AuthManager Resolution**: Auth::guard('web') → AuthManager->guard('web') → checks if guard is already resolved in $this->guards array → if not, calls esolve('web') → reads config/auth.php for guard config → factory method (createSessionDriver, createTokenDriver, or custom via extend()) → resolves the provider by name → returns guard instance.
- **SessionGuard Login**: ttempt() fires Attempting event → calls provider etrieveByCredentials() → calls provider alidateCredentials() via Hash::check() → if successful, calls login() → regenerates session ID → fires Login event → updates emember_token if requested. The authenticated user is stored in session by identifier.
- **SessionGuard per-request resolution**: StartSession middleware reads session ID from cookie → hydrates session → uth middleware calls guard->user() → SessionGuard retrieves user ID from session → calls provider->retrieveById(). No password check per request.
- **Sanctum dual-path resolution**: For SPA requests (cookie-based), Sanctum uses the StartSession middleware's session state; for token requests (Bearer), Sanctum uses a RequestGuard closure that reads the token from the Authorization header and validates it against the personal_access_tokens table.
- **Fortify action pipeline**: Each authentication action (login, register, password reset) is a Laravel action class implementing __invoke(). Fortify dispatches through a middleware pipeline before each action, with default middleware handling rate limiting, validation, and authentication.
- **Passport token validation**: Passport registers a custom guard that intercepts the Authorization header, decodes the JWT via league/oauth2-server, validates the token signature, expiry, and scopes, then resolves the authenticated user from the token's sub claim.
