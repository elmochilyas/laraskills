# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Spatie Passkeys Livewire components
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`spatie/laravel-passkeys` is the mature, production-hardened alternative to first-party `laravel/passkeys`, specifically built for Livewire applications. It ships ready-to-use Livewire components for passkey registration, authentication, and management — alongside custom Artisan commands and a full WebAuthn implementation based on `web-auth/webauthn-lib`. Battle-tested in production at Mailcoach and other Spatie products. It trades stack-agnosticism (first-party) for deep Livewire integration and pre-built UI.

---

# Core Concepts

- **Livewire Components**: Registration component, login component, and credential management.
- **`web-auth/webauthn-lib`**: Underlying WebAuthn library handling the cryptographic ceremonies. Spatie builds on top of this rather than implementing WebAuthn from scratch.
- **Credential Management UI**: User profile page component for adding, renaming, and removing passkeys without writing custom Livewire components.
- **`php artisan passkeys:install --with-views`**: Publishes config, migration, and optional Livewire views. Minimal setup.
- **Relying Party Configuration**: Similar to first-party — `name`, `id`, `origin`. Configured in `config/passkeys.php`.

---

# Mental Models

- **WebAuthn as Trait**: `Spatie\Passkeys\Concerns\HasPasskeys` trait on User model enables all passkey functionality — similar to how `HasRoles` enables permissions. Drop-in, convention-driven.
- **Livewire-First**: Spatie Passkeys is designed for the Livewire stack. If your app uses React/Vue/Svelte, the first-party package is a better fit (works with any frontend).

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Spatie Passkeys vs first-party `laravel/passkeys` | Livewire vs stack-agnostic | Spatie for Livewire apps; first-party for React/Vue/Svelte or stacks without Livewire |
| Spatie Passkeys vs Laragear WebAuthn | Need UI vs need flexibility | Spatie for pre-built Livewire UI; Laragear for full control (no UI assumptions) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Pre-built Livewire components (zero frontend code) | Livewire-only — does not serve React/Vue SPAs | Choosing Livewire stack locks you into Spatie Passkeys if you want the full UI |
| Battle-tested in production (Mailcoach) | Larger dependency footprint (Livewire, `web-auth/webauthn-lib`) | More packages to keep updated |
| Artisan command auto-configures everything | Less flexibility in ceremony customization | Deep WebAuthn customization requires dropping down to `web-auth/webauthn-lib` directly |

---

# Production Considerations

- Before installing, ensure Livewire 3.x is already set up in the application. Spatie Passkeys does not install Livewire as a dependency — it expects it to already be present.
- The package includes a CSP-compatible nonce integration — outbound Livewire responses include the CSP nonce for inline scripts.
- Credential management UI assumes the User model uses the standard `HasPasskeys` trait with Spatie's migration schema. Custom credential storage requires forking or extending.

---

# Related Knowledge Units

- Prerequisites: WebAuthn ceremonies (attestation, assertion), Livewire component architecture
- Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), WebAuthn ceremonies
- Advanced Follow-up: Custom WebAuthn ceremony flows with `web-auth/webauthn-lib`

---

# Research Notes

- Spatie Passkeys is the recommended choice when using the Livewire + Tall stack (Tailwind, Alpine, Laravel, Livewire) — it aligns with Spatie's overall Livewire ecosystem (Media Library, Permission, Tags).
- The production maturity (Mailcoach uses it) means it's well-tested, but the package API may diverge from the first-party package as both evolve independently.
- `spatie/laravel-passkeys` has no official integration with Fortify — it works alongside Fortify but does not hook into the Fortify pipeline. For Fortify + Livewire + Passkeys, you may need to bridge both packages.

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

## Patterns

- **Defense in depth**: Multiple overlapping security controls (authentication + authorization + encryption + auditing + rate limiting) ensure no single failure compromises the system. Each layer provides backup protection if an outer layer is bypassed.
- **Principle of least privilege**: Grant the minimum permissions necessary for each component. Users get only needed scopes, services get only needed API keys, processes run with minimum OS privileges.
- **Authentication delegation**: Use dedicated authentication services (Fortify, Sanctum, Passport, WorkOS) that handle credential verification, token issuance, and session management. Application code should never handle passwords directly.
- **Authorization as middleware**: Enforce access control at the route/middleware level using gates, policies, and middleware before controller logic executes. This prevents authorization gaps when controllers are called from multiple entry points.
- **Secure defaults**: Configuration should default to the most secure option (HSTS enabled, HTTPS enforced, encryption at rest enabled). Developers must explicitly opt into less secure configurations.

## Performance Considerations

- **Authentication overhead**: Each authentication request adds 5-50ms for credential verification, session creation, and token generation. Cache session data in Redis to reduce database load.
- **Authorization check cost**: Policy and gate checks execute on every request. Policy auto-discovery adds negligible overhead (cached after first resolution). For high-throughput endpoints, cache permission results with user-based cache keys.
- **Encryption performance**: Encryption/decryption operations add 0.1-2ms per field. For high-throughput APIs, encrypt only sensitive fields rather than entire payloads.
- **Rate limiting overhead**: In-memory rate limiting (Cache::driver('array')) is faster than Redis-backed limiting. Use Redis-based limiting for distributed deployments; array-based for single-server setups.
- **Session storage**: File-based sessions degrade under high concurrency. Use Redis or database sessions for production deployments with multiple web servers.
- **Header processing**: Security headers (CSP, HSTS, etc.) are set once per response and add negligible overhead. However, CSP policy size affects browser parsing time. Keep CSP directives focused on actual requirements.

## Common Mistakes

- **Hardcoding secrets**: Storing API keys, database passwords, or encryption keys in source code or configuration files committed to version control. Use environment variables or a secrets manager (Vault, AWS Secrets Manager).
- **Overly permissive CORS**: Setting Access-Control-Allow-Origin: * exposes the API to any website. Restrict CORS to specific origins that need access.
- **Missing input validation**: Trusting user input without validation leads to injection attacks (SQLi, XSS, command injection). Validate and sanitize all input at the boundary.
- **Insufficient password policies**: Allowing weak passwords (short length, no complexity requirements) undermines authentication security. Enforce minimum password strength requirements.
- **Neglecting HTTPS**: Sending credentials or tokens over unencrypted HTTP connections exposes them to interception. Enforce HTTPS for all authenticated traffic.
- **Overlooking error messages**: Verbose error messages can leak system information (stack traces, database details, file paths). Use generic error messages in production and log detailed errors securely.

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
