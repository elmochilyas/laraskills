# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Passport vs Sanctum decision framework
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

The Passport vs Sanctum decision is binary: use Sanctum unless you need to be an OAuth2 provider. Sanctum covers 80%+ of authentication use cases (first-party SPAs, mobile apps, simple API tokens) with minimal complexity. Passport is required only when third-party clients need to authorize via your app — your app becomes an OAuth2 authorization server. The two packages are not interchangeable; they solve fundamentally different problems. Using Passport "because it's more enterprise" is a common anti-pattern that adds unnecessary infrastructure (RSA keys, client management, grant types) with no benefit for first-party auth.

---

# Core Concepts

- **Sanctum's Domain**: First-party authentication. Your SPA, your mobile app, your CLI tool. Token auth + cookie session auth. Simple ability scopes. No OAuth2 grants. No client concept.
- **Passport's Domain**: Third-party authorization. Other apps authenticating via your app. Full OAuth2 grants (Authorization Code, Client Credentials, etc.). Scope negotiation. Client registration and management.
- **The Overlap**: Both can issue tokens. Both support scope-like restrictions. Both can authenticate API requests. But they use fundamentally different token models (Sanctum: opaque DB tokens; Passport: JWT or opaque OAuth2 tokens).
- **Hybrid Pattern**: Some apps use both — Sanctum for first-party frontend auth, Passport for third-party API access. This requires dual-guard configuration and careful route separation.

---

# Mental Models

- **Locksmith vs Notary**: Sanctum is a locksmith — you own the building, you make keys for yourself. Passport is a notary — other people come to you to verify identities.
- **Use Case First, Package Second**: Don't ask "should I use Sanctum or Passport?" Ask "do I need to issue tokens to apps I don't control?" If yes, Passport. If no, Sanctum.

---

# Decision Framework

## Use Sanctum When:
- Authenticating your own SPA (cookie-based session auth)
- Issuing API tokens to your own mobile app or CLI
- Simple ability-based scoping is sufficient
- You do not need delegated authorization ("app X acts on behalf of user Y")
- You want the simplest possible setup

## Use Passport When:
- Third-party developers need to build apps against your API
- You need OAuth2 grant types (Authorization Code, Client Credentials)
- You need standard OAuth2 scope negotiation
- Your API is consumed by services in different security domains
- You need to be an identity provider for a microservice mesh

## Use Both When:
- You have first-party SPAs AND third-party API consumers
- Sanctum for SPA cookie auth; Passport for external client tokens
- Requires separate route groups for Sanctum-protected and Passport-protected endpoints

---

# Architectural Decisions

| Decision | Sanctum | Passport |
|---|---|---|
| Token storage | `personal_access_tokens` table (SHA-256 hash) | `oauth_access_tokens` table (JWT or opaque) |
| Token revocation | Delete from DB (immediate) | Delete from DB or add to blacklist (with JWT) |
| Scopes | Simple string array (`['read', 'write']`) | Defined in `Passport::tokensCan()` with descriptions |
| Client concept | No | Yes — `oauth_clients` table |
| Grant types | None | Authorization Code + PKCE, Client Credentials, Personal Access, Password |
| SPA auth | Built-in (cookie session) | Not supported — use Sanctum alongside or build custom |
| Setup complexity | Minimal (install, migrate, add trait) | Medium (install, keys, client seed, grant config) |
| Maintenance | Low | Medium (key rotation, client management, token pruning) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Sanctum: Minimal setup, covers 80% of use cases | No OAuth2 compliance | Cannot onboard third-party developers needing OAuth2 |
| Passport: Full OAuth2 provider | 10x configuration and key management complexity | Overkill for first-party apps; adds attack surface (client secrets, grant types) |
| Both: Can coexist for hybrid scenarios | Route/guard management complexity | Must be careful about which guard protects which route |
| Sanctum: Cookie auth for SPAs (XSS-safe) | No refresh token pattern | Long-lived sessions or complex SPA token management |

---

# Performance Considerations

- Sanctum overhead per request: 1 DB query (token lookup) for token auth; 0 DB queries for SPA session auth.
- Passport overhead per request: 0 DB queries (JWT signature verify) or 1 DB query (opaque token lookup).
- Sanctum token table indexes: `token` column is VARCHAR(64) with SHA-256 hash — indexes well. `tokenable_id` and `tokenable_type` for user token listing.
- Passport token tables: `oauth_access_tokens` grows fast with active clients. Purge regularly. Add composite index on `(user_id, client_id, revoked)`.

---

# Production Considerations

- **Default to Sanctum**: Start every project with Sanctum. Only add Passport if an explicit OAuth2 requirement emerges.
- **Hybrid Authentication**: If using both, separate routes by guard. Sanctum routes use `auth:sanctum`; Passport routes use `auth:api`. Different middleware groups, different token resolution paths.
- **Migration from Sanctum to Passport**: Non-trivial. Existing users' Sanctum tokens must be migrated to Passport clients and tokens. Consider running both during transition.

---

# Common Mistakes

- **Choosing Passport "for scalability"**: OAuth2 does not make your app more scalable. JWT token validation may be slightly faster than DB lookup, but the operational cost of Passport far outweighs any performance gain.
- **Building SPA auth with Passport**: Passport is not designed for SPA session auth. You still need Sanctum (or manual session auth) for browser-based logins.
- **Using both without understanding guard separation**: If a route is behind `auth:api` (Passport) and the SPA sends its Sanctum cookie, the request is unauthenticated. Routes must explicitly pick the right guard.
- **Assuming Sanctum's token abilities are Passport scopes**: Sanctum abilities are simple arrays checked via `in_array`. Passport scopes are registered, described, and can be requested/approved during authorization. They are not drop-in replacements.

---

# Related Knowledge Units

- Prerequisites: Sanctum SPA vs Token auth, Passport OAuth2 server (grants, scopes, keys)
- Related: Auth guards/providers architecture (multi-guard setup), API authentication patterns
- Advanced Follow-up: Hybrid Sanctum + Passport architecture patterns, Migration strategies from Sanctum to Passport

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

## Failure Modes

- **Authentication bypass**: Missing middleware on route groups allows unauthenticated access to protected endpoints. Use route grouping with consistent middleware application. Test authentication requirements in every deployment.
- **Session fixation**: Without session regeneration after login, an attacker can fixate a session ID and hijack the authenticated session. Always call session()->regenerate() after successful authentication.
- **Token leakage**: API tokens in URL parameters, logs, or error responses expose credentials. Use Authorization header exclusively for token transmission. Sanitize tokens from log output.
- **CSRF bypass**: Missing or misconfigured CSRF token verification allows cross-site request forgery. Ensure VerifyCsrfToken middleware is applied to all state-changing routes.
- **Rate limit exhaustion**: Legitimate users blocked by aggressive rate limiting. Monitor rate limit hit rates and adjust thresholds based on actual traffic patterns. Use tiered rate limiting (guest vs. authenticated vs. admin).
- **Security header misconfiguration**: Incorrect CSP directives can block legitimate resources or leave vulnerabilities open. Use reporting endpoints (eport-uri/eport-to) to monitor CSP violations without blocking content.
