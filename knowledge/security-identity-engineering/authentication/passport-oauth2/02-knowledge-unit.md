# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Passport OAuth2 server (grants, scopes, keys)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Passport provides a full OAuth 2.0 server implementation built on `league/oauth2-server`. It enables your Laravel application to act as an OAuth2 authorization server, issuing access tokens to third-party clients via standard grants (Authorization Code + PKCE, Client Credentials, Password, Personal Access Tokens). Passport manages RSA key pairs for token signing, token scopes for granular access, and client credentials for third-party app registration. As of Laravel 12/13, Passport is headless (no UI — routes/controllers only) and requires explicit client management. Passport is the correct choice only when your application needs to be an OAuth2 provider — not for first-party API authentication.

---

# Core Concepts

- **Clients**: Third-party applications registered in the `oauth_clients` table. Each client has an ID, secret, redirect URL, and grant type(s). Clients are either "confidential" (can keep secrets) or "public" (cannot, e.g., SPAs).
- **Grants**: Authorization Code + PKCE (recommended for third-party apps), Client Credentials (server-to-server), Password Grant (deprecated — legacy clients), Personal Access Tokens (first-party development).
- **Scopes**: Permission strings defined in `config/passport.php`. Unlike Sanctum abilities, Passport scopes can be requested by clients during authorization and are validated against the token.
- **Tokens**: Access tokens (JWT by default, or opaque). Refresh tokens (optional per grant). Each token is associated with a client, a user (if user-bound grant), and set of scopes.
- **RSA Keys**: `passport:keys` Artisan command generates RSA private/public key pair stored in `storage/`. The private key signs tokens; the public key is exposed via the `/oauth/token` and `/oauth/.well-known/jwks.json` endpoints.
- **Middleware**: `scopes` and `scope` middleware for route-level scope enforcement, similar to Sanctum's `abilities` / `ability`.

---

# Mental Models

- **Identity Provider**: Passport makes your app an identity provider (IdP) — other apps rely on your app to authenticate users and authorize access.
- **Client as App, Not as User**: OAuth2 is about app-to-app delegation, not user login. The "client" is the third-party app, not a user. Even when a user authorizes access, the client is the entity that receives the token.
- **Key Infrastructure as Security Boundary**: The RSA private key is the crown jewel. Whoever holds the private key can mint valid tokens for any client. It belongs in a secure store, not in the repository.

---

# Internal Mechanics

**Authorization Code + PKCE Flow**: Client redirects user to `/oauth/authorize?response_type=code&client_id=...&scope=...&code_challenge=...` → user authenticates and authorizes → Passport generates authorization code (short-lived) → client receives code at redirect URL → client calls `POST /oauth/token` with code, code_verifier, client_secret → Passport verifies PKCE challenge, issues access + refresh token.

**Token Validation**: Requests with `Authorization: Bearer <token>` hit Passport's middleware → Passport extracts token → decrypts/verifies JWT signature using public key → checks scopes → checks token expiry → retrieves or resolves user via `BearerTokenValidator` → sets user on request.

**Scope Enforcement**: `scopes:read,write` middleware checks ALL scopes present. `scope:read` middleware checks ANY scope matches. Uses `Passport::scopeIds()` to validate against configured scopes.

**Key Rotation**: The `oauth_access_tokens` table stores JWT tokens (unless opaque mode). Key rotation invalidates all existing tokens unless using opaque tokens (stored in DB). Opaque tokens use `league/oauth2-server`'s `AccessTokenRepository` for validation.

---

# Patterns

## Client Credentials for Microservices
- **Purpose**: Server-to-server auth between internal services.
- **Implementation**: Each microservice registers as a confidential client. Uses Client Credentials grant. Scopes restrict which internal APIs each service can call.
- **Benefits**: No user context needed; machine-to-machine auth with audit trail.
- **Tradeoffs**: No user attribution for rate limiting or logging (use "acting as" patterns).

## Personal Access Tokens (PAT) for Developers
- **Purpose**: Developer API tokens similar to GitHub PATs.
- **Implementation**: `Passport::personalAccessClient()` configures a dedicated client. Users create PATs with selected scopes.
- **Benefits**: Familiar developer experience; user-created and managed tokens.
- **Tradeoffs**: Bypasses OAuth2 authorization flow; not suitable for third-party apps.

## Authorization Code + PKCE for SPAs
- **Purpose**: Public SPAs that cannot keep a client secret.
- **Implementation**: SPA registers as public client with PKCE. No client secret. `code_challenge_method=S256`.
- **Benefits**: Secure for SPAs without backchannel. PKCE prevents authorization code interception.
- **Tradeoffs**: Cannot use refresh tokens if the SPA cannot secure them (unless using Web Workers/Service Workers).

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Passport vs Sanctum | Need OAuth2 provider or just first-party API | Passport for OAuth2 provider; Sanctum for first-party API. Not interchangeable. |
| JWT vs Opaque tokens | Validate statelessly vs immediate revocation | JWT for performance at scale (no DB lookup); Opaque for immediate revocation control |
| Password Grant usage | Legacy mobile apps | Use Authorization Code + PKCE whenever possible. Password Grant deprecated in OAuth2.0 best practices. |
| Key storage | RSA keys in repo vs secure vault | Generate on production via `passport:keys`. Never commit to repository. |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Full OAuth2 compliance | Massive configuration surface | Misconfiguration (wrong grant, missing PKCE, exposed client secrets) is a security vulnerability |
| JWT tokens allow stateless validation | JWT cannot be immediately revoked | Must maintain a token blacklist for immediate revocations, negating stateless benefits |
| Scope system is robust | Scopes require client and user cooperation | If client does not request scope and user does not approve, the scope is empty — hard to debug |
| Multi-grant support | Each grant has different attack surface | PKCE vs plain authorization code: PKCE is required for public clients; missing it is a vulnerability |

---

# Performance Considerations

- JWT token validation is O(1) — no DB lookup per request. Signature verification with RSA-2048 takes ~0.5-1ms.
- Opaque token validation queries `oauth_access_tokens` table per request — add index on `id` and `expires_at`. At scale, cache token validity with Redis (TTL = min(token expiry, 15min)).
- Token creation is insert-heavy. The `oauth_access_tokens`, `oauth_refresh_tokens` tables grow fast. Implement scheduled pruning: `passport:purge`.
- Authorization code storage is ephemeral but can accumulate if clients fail to complete the flow. TTL is 10 minutes by default (configurable).

---

# Production Considerations

- **Key Management**: Run `php artisan passport:keys` on deployment. For key rotation, generate new keys, keep old keys for token validity overlap (`--grace` period concept from Locksmith).
- **Encryption Key**: Passport uses `APP_KEY` for encrypting client secrets. Rotating `APP_KEY` invalidates all stored client secrets.
- **Token Lifetimes**: Configure via `Passport::tokensExpireIn()`, `Passport::refreshTokensExpireIn()`, `Passport::personalAccessTokensExpireIn()`. Shorter lifetimes increase security but force more frequent refresh flows.
- **Client Management UI**: Passport has no UI for client registration since v13.x (headless). Either build one (authored by users) or seed clients via database migrations for internal services.
- **CORS**: The `/oauth/token` endpoint does not need CSRF protection (not cookie-based). But `/oauth/authorize` does — ensure it runs in `web` middleware group.

---

# Common Mistakes

- **Using Password Grant in new applications**: Password Grant is deprecated in the OAuth2 Security BCP. Use Authorization Code + PKCE or Client Credentials.
- **Not implementing PKCE for public clients**: Public clients (SPAs, mobile apps) without PKCE are vulnerable to authorization code interception attacks.
- **Committing RSA keys to version control**: The `storage/oauth-*.key` files must be in `.gitignore`. Generated once per environment.
- **Forgetting to configure scope model**: `Passport::tokensCan()` in `AppServiceProvider` must define all scopes. Undefined scopes may silently pass validation.
- **Using Password Grant with third-party clients**: Password Grant exposes user credentials to the client app. Never give third-party apps user passwords.

---

# Failure Modes

- **Key Rotation Outage**: If the RSA private key is deleted or replaced without keeping old keys, all active tokens become invalid. Users and third-party apps get 401 errors until they re-authorize.
- **Token Blacklist Bloat**: If using JWT with active revocation, the blacklist cache grows unbounded. Implement Redis with TTL equal to original token expiry.
- **Client Secret Exposure**: If a confidential client's secret is leaked, regenerate it via `passport:client --update` using the client ID. The old secret stops working immediately.
- **Scope Drift**: Adding or removing scopes in `Passport::tokensCan()` can cause clients that previously approved scopes to suddenly have missing or additional permissions. Existing tokens keep their originally assigned scope set.

---

# Ecosystem Usage

- **Laravel Framework**: Passport's middleware (`scopes`, `scope`) integrates with Laravel's authorization system. `$request->user()->tokenCan()` works identically to Sanctum's `tokenCan()`.
- **Jetstream**: Jetstream's API token management uses Personal Access Tokens via Passport or Sanctum depending on the stack configuration.
- **Internal Microservices**: Passport is often used as the internal IdP for service-to-service auth within a Laravel microservice architecture.

---

# Related Knowledge Units

- Prerequisites: OAuth2 protocol knowledge, Auth guards/providers architecture, RSA key management
- Related: Passport vs Sanctum decision framework, Sanctum token scoping (comparison), Socialite (OAuth client counterpart)
- Advanced Follow-up: Passport key rotation strategies, Hybrid Passport + Sanctum architecture, OAuth2 security best practices (BCP), JWK endpoint and key rotation

---

# Research Notes

- Passport should never be used for first-party API auth. The 2026 ecosystem consensus is clear: Sanctum for first-party, Passport only as OAuth2 provider.
- Passport v13.x dropped all UI. Client management is headless — build your own or seed via migrations.
- The PKCE requirement for public clients is enforced by `league/oauth2-server` only if the client is marked as public (no secret). Missing PKCE + confidential client with known secret = reduced security.

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
