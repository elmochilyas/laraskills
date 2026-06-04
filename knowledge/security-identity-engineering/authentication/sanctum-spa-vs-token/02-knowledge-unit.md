# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: Sanctum SPA cookie auth vs token auth
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel Sanctum provides two distinct authentication mechanisms within a single package: cookie-based session authentication for first-party SPAs (same domain/subdomain) and Bearer token authentication for third-party clients (mobile apps, APIs, CLI tools). The `sanctum` guard automatically resolves which mechanism to use based on the request origin — checking stateful domains first, falling back to token auth. These mechanisms differ fundamentally in how credentials are stored, how CSRF is handled, how abilities are scoped, and how tokens are revoked. Choosing the wrong mode for your client type is the single largest source of Sanctum-related production bugs.

---

# Core Concepts

- **SPA Cookie Auth**: Uses Laravel's standard `SessionGuard` (session ID in HttpOnly cookie, CSRF via `XSRF-TOKEN` cookie/header). No tokens stored client-side. Session state is server-side. CSRF protection via double-submit cookie pattern.
- **Token Auth**: Opaque Bearer tokens (SHA-256 hashed in DB, plain text returned once at creation). Client stores the token (Keychain, Keystore, env var). No CSRF needed. Token can have scoped abilities.
- **Resolution Logic**: Sanctum's guard first checks `SANCTUM_STATEFUL_DOMAINS` (trusted first-party origins). If the request Origin matches, it authenticates via session cookie. If not, it looks for `Authorization: Bearer <token>`.
- **Configuration**: `SANCTUM_STATEFUL_DOMAINS` env var, `cors.php` `supports_credentials => true`, and `config/sanctum.php` `stateful` array must be aligned. Missing one breaks SPA auth silently.
- **Shared Guard**: Both modes use the `sanctum` guard (`auth:sanctum` middleware). The route protection middleware does not distinguish the mode — it works with whichever mechanism the request provides.

---

# Mental Models

- **Wristband vs Passport**: SPA cookie auth is like a theme park wristband — issued once, checked visually, limited to the park. Token auth is like a passport — presented explicitly, works across borders, can be revoked independently.
- **Origin Decides**: The request's `Origin` header is the gatekeeper. Sanctum doesn't ask "what mode do you want?" — it reads the Origin, decides session vs token, and authenticates accordingly.
- **HttpOnly as Security Boundary**: SPA cookies are HttpOnly — JavaScript cannot read them. Token auth requires JavaScript to send the header, meaning the token is accessible to JS (XSS vulnerability). This is the single most important security distinction.

---

# Internal Mechanics

- **SPA Auth Flow**: Client calls `GET /sanctum/csrf-cookie` → Laravel sets `XSRF-TOKEN` cookie → Client reads cookie, sends `X-XSRF-TOKEN` header with next request → Client POSTs to `/login` with credentials → `web` guard authenticates, session cookie set → Subsequent requests send session cookie → Sanctum guard checks `EnsureFrontendRequestsAreStateful` → Origin matches `stateful` domains → delegates to `web` guard session → returns user.
- **Token Auth Flow**: Client sends `Authorization: Bearer <token>` → Sanctum guard checks Origin — not a stateful domain or no Origin header → extracts token from header → queries `personal_access_tokens` where `token = SHA-256(token)` → if found and not expired, retrieves the associated `tokenable` (User) model → authenticates as that user.
- **EnsureFrontendRequestsAreStateful Middleware**: In the `api` middleware group, this middleware sets `config('sanctum.guard')` to `web` for stateful requests. It compares the request's Origin header against the `stateful` config array. If match found, the middleware runs `StartSession` and `EncryptCookies`.
- **Token Expiration**: Configured via `SANCTUM_TOKEN_EXPIRATION`. Sanctum adds the expiration to the `personal_access_tokens.expires_at` column. Expired tokens return 401. No automatic refresh — implement a separate token refresh endpoint.

---

# Patterns

## Same-Domain SPA Pattern
- **Purpose**: First-party SPA on same domain as Laravel.
- **Implementation**: Configure `stateful` with the SPA domain, enable CORS credentials, use `auth:sanctum` middleware.
- **Benefits**: HttpOnly cookie (XSS-safe), automatic CSRF protection, immediate session revocation.
- **Tradeoffs**: Only works on same domain or subdomains (session cookie SameSite restrictions).

## Cross-Domain SPA Pattern (Token fallback)
- **Purpose**: SPA on completely different domain (no shared parent domain).
- **Implementation**: Use token auth even for first-party SPA.
- **Benefits**: Works across any domain.
- **Tradeoffs**: Token accessible to JS (XSS risk), no built-in CSRF protection, must implement token refresh.

## Mobile App Token Pattern
- **Purpose**: Native mobile app or CLI tool.
- **Implementation**: Login endpoint returns `plainTextToken`, stored in OS Keychain/Keystore. Sent in Authorization header.
- **Benefits**: Per-device revocation, ability scoping, works offline cache.
- **Tradeoffs**: Token visible in transit (use HTTPS), must implement refresh/rotation in app.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| SPA same-origin | Frontend and backend on same domain | SPA cookie auth — always prefer for security |
| SPA subdomain | app.example.com → api.example.com | SPA cookie auth with `SESSION_DOMAIN=.example.com` |
| SPA cross-origin | Different domains entirely | Token auth with short-lived tokens and refresh mechanism |
| Mobile app | iOS, Android, React Native | Token auth stored in Keychain/Keystore |
| Third-party API consumer | External service calling your API | Token auth with restrictive ability scoping |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| SPA cookie auth: HttpOnly cookie protects against XSS token theft | Only works for stateful domains | Cross-origin SPAs must use token auth with higher XSS risk |
| Token auth: works from any client without CORS complexity | Token is accessible to JS in browser contexts | One XSS vulnerability can leak all tokens |
| SPA cookie auth: server-side session, immediate revocation | Higher server storage cost for sessions | Scale requires Redis session driver |
| Token auth: per-token ability scoping | SPA cookie auth has no ability scoping | SPAs get full user access — no way to restrict with abilities |
| Token auth: no CSRF risk (Bearer header not auto-sent) | Must implement token refresh | Refresh token rotation adds complexity |

---

# Performance Considerations

- SPA cookie auth: 0 DB queries per request after session is established (session stored in Redis/file). Session guard retrieves user only once per request via provider.
- Token auth: 1 DB query per request (lookup `personal_access_tokens` by SHA-256 hash). Can become a bottleneck at scale — consider caching token validity with short TTL.
- Token creation: `createToken()` inserts a row into `personal_access_tokens` per token. High-turnover token generation (e.g., per-login) can bloat the table. Implement scheduled pruning.
- The SHA-256 hash query on `personal_access_tokens.token` is a full column scan unless indexed. Add a composite index on `(token, expires_at)`.

---

# Production Considerations

- **SANCTUM_STATEFUL_DOMAINS** must include the full origin (protocol + host + port) for the SPA, comma-separated. Wildcards not supported.
- **CORS `supports_credentials`** must be `true` for SPA auth, and `Access-Control-Allow-Origin` must be the specific origin (not `*`).
- **Session Domain**: For subdomain SPAs, set `SESSION_DOMAIN=.example.com` (leading dot includes all subdomains).
- **Token Pruning**: Sanctum provides `sanctum:prune-expired` Artisan command. Schedule it to run daily.
- **Token Prefix**: `SANCTUM_TOKEN_PREFIX` env var adds a prefix to all tokens for identification.
- **Rate Limiting**: Stricter limits on login and token creation endpoints. Laxer limits on authenticated resource endpoints.

---

# Common Mistakes

- **Missing `SANCTUM_STATEFUL_DOMAINS`**: Most common SPA auth failure. Sanctum sees no matching Origin, treats SPA requests as non-stateful, never checks session cookie.
- **Missing `supports_credentials => true` in CORS config**: Browser blocks cookie from being sent. Preflight returns 204 without `Access-Control-Allow-Credentials`.
- **Not sending `withCredentials: true` from frontend**: Fetch/axios must enable credential inclusion. Otherwise cookies are not sent even if CORS allows them.
- **Using token auth for SPA on same domain**: Loses XSS protection, CSRF double-submit, and session management benefits.
- **Storing tokens in `localStorage`**: Any XSS vulnerability reads `localStorage.getItem('token')`. Use HttpOnly cookies (SPA mode) or OS Keychain (mobile apps).
- **Not implementing token expiration/rotation**: Long-lived tokens never expire in DB become a permanent compromise vector.
- **Confusing `api` guard with `sanctum` guard**: `auth:api` and `auth:sanctum` resolve differently. `auth:sanctum` uses Sanctum's dual-mode resolution; `auth:api` uses a regular `TokenGuard`.

---

# Failure Modes

- **Phantom 401s**: SPA sends correct cookie but gets 401. Root causes: (1) Origin not in stateful domains, (2) Session expired, (3) CSRF token mismatch from failed cookie sync, (4) CORS preflight not returning credentials header.
- **Token Not Found 401**: Client sends Bearer token but gets 401. Root causes: (1) Token expired, (2) Token pruned, (3) Token hashed incorrectly (SHA-256 expected), (4) Token deleted on user logout (revoked).
- **CSRF Token Mismatch**: SPA sends stale `XSRF-TOKEN` cookie after session timeout. The `XSRF-TOKEN` cookie is regenerated on each session start. Client must call `GET /sanctum/csrf-cookie` again.
- **Session Domain Mismatch**: SPA on `app.example.com`, API on `api.example.com`, no `SESSION_DOMAIN` set. The session cookie set by `api.example.com` is scoped to `api.example.com` and `app.example.com` cannot read it.

---

# Ecosystem Usage

- **Laravel Starter Kits**: All use Sanctum by default. React/Vue/Svelte kits use SPA cookie auth with Sanctum's stateful middleware.
- **Jetstream**: Wraps Sanctum for API token management UI. Users can create/manage tokens in their profile settings.
- **Fortify**: Pairs with Sanctum for SPA authentication backend. Fortify handles login/register; Sanctum handles the auth session.
- **WorkOS**: WorkOS can replace or augment Sanctum for enterprise SSO scenarios while preserving Sanctum for first-party auth.

---

# Related Knowledge Units

- Prerequisites: Auth guards/providers architecture, Session configuration, CORS configuration
- Related: Sanctum ability-based token scoping, CSRF token exchange and validation, Fortify headless auth backend
- Advanced Follow-up: Sanctum performance at scale (token table indexing, caching), Sanctum + Passport dual-guard patterns, Token rotation and refresh token architecture

---

# Research Notes

- The 2026 ecosystem consensus is: Sanctum SPA cookie auth for first-party apps, token auth for everything else. Do not use token auth for your own SPA.
- Sanctum's token is hashed with SHA-256 before storage — the plain text is returned exactly once. This is a security-by-design decision: a database breach does not expose usable tokens.
- The `EnsureFrontendRequestsAreStateful` middleware is the most misunderstood component. It does NOT authenticate — it checks origin and conditionally enables session middleware for stateful requests. Authentication is still handled by the `sanctum` guard.
- Token expiration in Sanctum is a simple timestamp check — there is no refresh token mechanism. If you need refresh tokens, implement a custom token endpoint.

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
