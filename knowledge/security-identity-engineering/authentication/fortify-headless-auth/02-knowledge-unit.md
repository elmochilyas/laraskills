# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Fortify headless auth backend
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Fortify is a frontend-agnostic authentication backend that provides routes, controllers, and actions for login, registration, password reset, email verification, and two-factor authentication — without imposing any UI. It decouples auth logic from presentation, allowing SPAs, mobile apps, or traditional server-rendered apps to share a single auth backend. As of early 2026, Fortify v1.37+ ships built-in passkey (WebAuthn) support. It is the backend engine powering all Laravel Starter Kits and Jetstream.

---

# Core Concepts

- **Headless Backend**: Fortify provides the backend (routes, controllers, validation, responses) but returns JSON or redirects — it never renders HTML views. You build the frontend.
- **Features Array**: `config/fortify.php` has a `features` array that toggles which auth features are enabled. Each feature registers its own routes and controllers.
- **Actions Pattern**: Fortify uses invokable action classes for every operation (e.g., `\App\Actions\Fortify\CreateNewUser`, `\App\Actions\Fortify\UpdateUserPassword`). Each action is a single-responsibility class with an `__invoke` method. You customize behavior by modifying these action classes, not by forking controllers.
- **Authentication Pipeline**: Login requests flow through a configurable pipeline of middleware-like classes defined by `Fortify::authenticateThrough()`. Default pipeline includes: `RedirectIfTwoFactorAuthenticatable`, `AttemptToAuthenticate`, `PrepareAuthenticatedSession`.
- **Response Customization**: Fortify dispatches `LoginResponse`, `RegisterResponse`, `PasswordResetResponse` contracts — you override these via the service container to customize JSON responses, redirect targets, or additional user setup.
- **Sanctum Integration**: Fortify expects a `StatefulGuard` (typically the `web` guard). For SPA auth, it pairs with Sanctum's cookie-based session authentication. As of 2026, third-party packages like `everware/laravel-fortify-sanctum` bridge Fortify with Sanctum token-based auth for stateless API contexts.

---

# Mental Models

- **API for Authentication**: Think of Fortify as an authentication API — your frontend calls `/login`, `/register`, etc. and gets back success/failure. The frontend never touches the `Auth` facade directly.
- **Pipeline Architecture**: Authentication is a series of steps (validate → authenticate → prepare session → respond). Fortify lets you insert, remove, or replace steps.
- **Action as Contract**: Each Fortify action is a contract point — you override the action to change behavior without touching the framework code. The boot method wires it up.

---

# Internal Mechanics

- **Route Registration**: `FortifyServiceProvider::boot()` calls `$this->configureRoutes()` which conditionally registers route groups based on enabled features. Routes are registered to the `web` middleware group by default.
- **Login Pipeline**: `Laravel\Fortify\Http\Controllers\AuthenticatedSessionController@store` calls `Fortify::authenticateThrough()` which returns an array of classes. The controller pipes the request through these classes (via `PipeLine` facade), each calling `$next($request)`. The last class in the pipeline returns the response.
- **Two-Factor Flow**: When `two-factor-authentication` feature is enabled, Fortity intercepts login via `RedirectIfTwoFactorAuthenticatable` in the pipeline. If the user has 2FA enabled, the pipeline redirects to `/two-factor-challenge`. The `TwoFactorAuthenticatedSessionController` validates the TOTP code or recovery code.
- **Profile Information Update**: Uses a `$request->validate()` approach — the action class receives validated data and updates the model. No form request classes by default.
- **Password Validation Rules**: Configured via `Fortify::password()` in `FortifyServiceProvider` — returns a `Password` rule object with configurable length, mixed case, letters, numbers, symbols, and uncompromised check.

---

# Patterns

## Action Customization Pattern
- **Purpose**: Override Fortify behavior without forking.
- **Implementation**: After `fortify:install` publishes actions to `app/Actions/Fortify/`, modify the `__invoke` method. For new actions not yet published, use `Fortify::createUsersUsing(CreateNewUser::class)`.
- **Benefits**: Upgrade-safe customization; clear separation of auth logic.

## Response Contract Pattern
- **Purpose**: Customize redirects or JSON responses.
- **Implementation**: Bind a custom implementation of `LoginResponse` or `RegisterResponse` in the container: `app()->singleton(LoginResponse::class, CustomLoginResponse::class)`.
- **Benefits**: No middleware hacks to change redirect behavior.

## Feature Toggle Pattern
- **Purpose**: Enable/disable auth features from config.
- **Implementation**: The `features` array in `config/fortify.php` acts as a feature flag registry. Each feature maps to route groups in `FortifyServiceProvider`.
- **Benefits**: Single source of truth for available auth capabilities; easy A/B testing.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Fortify vs manual auth | Any app needing auth without UI coupling | Use Fortify — it handles edge cases (rate limiting, password reset throttling, email verification timing) that manual implementations frequently miss |
| Fortify + Sanctum vs Fortify + Passport | SPA vs third-party API clients | Fortify + Sanctum for first-party apps; Fortify + Passport only when you need OAuth2 provider |
| Fortify + Starter Kit vs standalone Fortify | Need pre-built UI vs custom frontend | Starter Kits for rapid prototyping; standalone Fortify for production SPAs with custom designs |
| Published actions vs service container binding | Need to modify default behavior | Published actions for customization; container binding only when modifying behavior before actions exist in `app/Actions/Fortify/` |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Decouples auth logic from UI | Must build and maintain frontend auth views | More initial effort but cleaner architecture |
| Feature toggles simplify config | Some features have implicit dependencies (passkey requires Sanctum) | Can get 500 errors if required packages are missing |
| Action pattern is upgrade-safe | Actions assume Eloquent/DB store — heavy customization requires forking | Non-standard user stores may require custom provider instead of Fortify |
| Pipeline is configurable | Pipeline classes are not documented as thoroughly as middleware | Developers often don't realize they can customize the pipeline |

---

# Performance Considerations

- Fortify routes are standard Laravel routes — no special performance overhead.
- The authentication pipeline runs multiple middleware-like classes per login request, but total overhead is negligible (<5ms).
- Password hashing (bcrypt) dominates login response time — Fortify does not add meaningful overhead beyond the hash itself.
- Two-factor challenge adds one TOTP validation query per attempt.

---

# Production Considerations

- **Rate Limiting**: Fortify applies `Illuminate\Routing\Middleware\ThrottleRequests` to login and two-factor routes with 5 attempts per minute by default. Configure via `config/fortify.php` `'limiters'` array.
- **Session Configuration**: Fortify requires a functioning session driver. For API-only setups without sessions, use the Everware bridge package to make Fortify stateless.
- **Passkeys**: Since v1.37, Fortify integrates `laravel/passkeys`. Enable via the `'passkeys'` feature in config. Requires Sanctum for the credential creation/authentication endpoints.
- **Email Verification**: The `'email-verification'` feature checks `MustVerifyEmail` contract. Ensure mail configuration and queue driver are set up for verification emails.

---

# Common Mistakes

- **Enabling all features without understanding dependencies**: Passkey feature requires Sanctum and `laravel/passkeys`; two-factor requires a `TwoFactorAuthenticatable` trait on User model.
- **Overriding actions without calling parent**: Custom actions must implement the full logic (create user, assign defaults, fire events). The published action stubs are starting points, not middleware wrappers.
- **Modifying `config/fortify.php` directly without checking for environment overrides**: Some settings like `home` redirect path can be set via `.env`.
- **Expecting Sanctum tokens from Fortify login**: Fortify authenticates via session (StatefulGuard). For Sanctum tokens, you need to intercept the login response and call `$user->createToken()`.

---

# Failure Modes

- **Login pipeline never terminates**: If a pipeline class does not call `$next($request)` and does not return a response, the request hangs indefinitely.
- **Two-factor redirect loop**: If `RedirectIfTwoFactorAuthenticatable` redirects to `/two-factor-challenge` but that route is not registered (feature disabled), users with 2FA enabled get stuck in a redirect loop.
- **Missing response binding**: If a custom `LoginResponse` binding throws an exception in the constructor, every successful login returns a 500 error.
- **Session not started for API-only Fortify**: Fortify uses the `web` middleware group which includes `StartSession`. If used with `api` middleware group, `Auth::check()` always returns false.

---

# Ecosystem Usage

- **Laravel Starter Kits** (React/Vue/Svelte/Livewire): All built on Fortify. The starter kit's `fortify.php` config enables features matching the kit's UI capabilities.
- **Jetstream**: Wraps Fortify with Teams management, profile management UI, and Inertia/Livewire stacks.
- **WorkOS**: WorkOS AuthKit can sit alongside or replace Fortify for enterprise SSO scenarios.
- **Everware/laravel-fortify-sanctum**: Third-party bridge enabling Fortify to issue Sanctum tokens on login instead of session cookies.

---

# Related Knowledge Units

- Prerequisites: Auth guards/providers architecture, Service providers, Middleware pipeline
- Related: Sanctum SPA cookie auth, MFA/TOTP with Fortify, First-party Passkeys/WebAuthn
- Advanced Follow-up: Fortify action pipeline deep customization, Response contract binding patterns, Stateless Fortify for mobile backends

---

# Research Notes

- Fortify v1.37.0 (April 2026) dropped PHP 8.1 and Laravel 10 support, added passkey support, and fixed compatibility with `FormRequest::failOnUnknownFields()`.
- The `Fortify::authenticateThrough()` pipeline modifier is one of the most underused Fortify features — it allows injecting login hooks (e.g., "warn if last login was from a new IP") in five lines of code.
- Fortify does NOT handle OAuth2 — it's purely first-party authentication. For social login, combine Fortify + Socialite.
- The headless nature of Fortify makes it uniquely suitable for AI-agent-based authentication, where the agent's frontend needs API endpoints for auth.

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
