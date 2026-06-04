# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: OIDC integration (jwks validation, nonce, discovery)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

OpenID Connect (OIDC) integration in Laravel is typically achieved through custom Socialite drivers (e.g., `jeffersongoncalves/laravel-oidc`) or direct integration with OIDC-compatible identity providers (Keycloak, Azure AD, Okta) via standard Socialite plus OIDC-specific configuration. OIDC extends OAuth2 with an ID token (a signed JWT containing user identity claims), a userinfo endpoint, and a discovery document (`.well-known/openid-configuration`) for dynamic provider configuration. The key engineering concerns are JWKS (JSON Web Key Set) retrieval and caching for token signature verification, nonce validation for replay protection, and per-provider discovery document parsing.

---

# Core Concepts

- **ID Token**: A JWT from the IdP containing claims about the user (`sub`, `email`, `name`, `iss`, `aud`, `exp`, `nonce`). Signed with the IdP's private key (RS256 by default). Verified by the client (your Laravel app) using the IdP's public keys from the JWKS endpoint.
- **JWKS (JSON Web Key Set)**: Endpoint (e.g., `https://idp.example.com/.well-known/jwks.json`) returning an array of public keys (JSON Web Keys) used to verify ID token signatures. Keys have a `kid` (key ID) matching the `kid` header in the JWT.
- **Discovery Document**: `https://idp.example.com/.well-known/openid-configuration` — JSON document listing all OIDC endpoints (authorization, token, userinfo, JWKS, end_session, etc.).
- **Nonce**: A single-use, random value sent in the initial authorization request and verified in the ID token. Prevents replay attacks. Socialite's OIDC driver must generate, persist, and validate the nonce.
- **Scopes**: OIDC uses specific scopes: `openid` (required), `profile`, `email`, `address`, `phone`. The `openid` scope triggers the ID token response.
- **Userinfo Endpoint**: Returns additional user claims when called with the access token. Used when ID token claims are insufficient.

---

# Mental Models

- **OAuth2 + Identity**: OIDC is OAuth2 with a standard way to get user identity. OAuth2 gives you access; OIDC tells you who the user is. The ID token is the "identity assertion."
- **Stateless Trust**: Unlike SAML's certificate exchange, OIDC trust is established dynamically via the discovery document and JWKS endpoint. The client fetches the public key from the IdP's JWKS at runtime — no out-of-band key exchange needed.

---

# Internal Mechanics

- **Flow**: Client redirects to IdP's authorization endpoint with `scope=openid%20email%20profile&nonce=random` → User authenticates → IdP redirects back with `code` → Client exchanges code for tokens at token endpoint → Response includes `id_token` (JWT) + `access_token` + `refresh_token` → Client decodes and verifies ID token.
- **ID Token Verification**: 1. Fetch JWKS from discovery URL. 2. Extract `kid` from JWT header. 3. Find matching JWK. 4. Verify JWT signature using JWK public key. 5. Check `iss` (issuer) matches expected. 6. Check `aud` (audience) is your client ID. 7. Check `exp` (expiration) not passed. 8. Check `nonce` matches stored value. 9. Optionally check `auth_time`, `acr` (authentication context class reference).
- **JWKS Caching**: JWKS keys should be cached with a TTL (typically 1 hour or based on `Cache-Control` / `expires` headers from the JWKS response). The `kid` in JWTs changes only when the IdP rotates keys.
- **Discovery Document**: Fetched once and cached. Contains `issuer`, `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, `scopes_supported`, `response_types_supported`, `subject_types_supported`, `id_token_signing_alg_values_supported`.

---

# Patterns

## Dynamic Provider Discovery Pattern
- **Purpose**: Support multiple OIDC providers without hardcoding endpoints.
- **Implementation**: Store only the issuer URL per tenant. Fetch discovery document at runtime. All endpoints are derived from the discovery document.
- **Benefits**: Adding a new OIDC provider requires only the issuer URL.
- **Tradeoffs**: Discovery adds one HTTP request per provider on first use. Cache aggressively.

## JWKS Rotation Handling Pattern
- **Purpose**: Handle IdP key rotation without downtime.
- **Implementation**: On JWT verification failure with current key, refresh JWKS cache and retry. If the IdP rotated keys between the token being issued and the verification, the cached key may be stale.
- **Benefits**: Transparent key rotation.
- **Tradeoffs**: Double verification on rotation events (one failed, one successful after refresh).

## Nonce Persistence Pattern
- **Purpose**: Secure nonce state across the OAuth redirect.
- **Implementation**: Generate random nonce, store in session, include in authorization request. On callback, retrieve stored nonce and compare with `nonce` claim in ID token. Clear after use.
- **Benefits**: Prevents CSRF and replay attacks on the authorization code exchange.
- **Tradeoffs**: Session must survive the redirect (stateless mode breaks nonce). Use custom mechanism for stateless OIDC.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Custom Socialite OIDC driver vs generic OIDC integration | Need Socialite interface vs full control | Custom driver (`jeffersongoncalves/laravel-oidc`) for Socialite compatibility; direct library (e.g., `jumbojett/openid-connect-php`) for custom flows |
| JWKS caching TTL | Short vs long cache | 1 hour default; shorter for high-security contexts where key rotation must propagate quickly |
| Nonce validation in stateless mode | API-driven OIDC without sessions | Use encrypted nonce stored in the initial redirect URL (returned in callback state parameter) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Dynamic discovery — no IdP-side configuration changes needed | Discovery adds startup latency and external dependency | If discovery endpoint is down, new IdP onboarding fails (cached providers continue working) |
| JWTs can be verified without hitting the IdP (stateless) | JWKS cache window means revocation is delayed | Revoked user still has valid JWT until expiry — implement token blacklist or short token TTL |
| Standardized claims (sub, email, name) | Provider-specific claims require custom mapping | Azure AD uses `preferred_username` instead of `email`; mapping must account for provider differences |

---

# Performance Considerations

- JWKS retrieval: one HTTP request per cache miss. Cache keys for 1-hour TTL. At scale, pre-warm on deployment.
- JWT signature verification: RS256 (RSA) ~5-10ms per verification. ES256 (ECDSA) ~1-3ms. Multiple verifications per request if supporting multiple IdPs.
- No additional DB queries for session-based OIDC flows.

---

# Production Considerations

- **JWKS Endpoint Availability**: If the IdP's JWKS endpoint is unreachable during verification, new tokens silently fail. Monitor JWKS endpoint availability and cache health.
- **Client Credentials for OIDC**: Your client needs both `client_id` and `client_secret` (confidential client). For SPAs (public clients), use PKCE + OIDC.
- **Multiple IdP Support**: Use the `iss` claim to route users to the correct provider configuration. Store provider config by issuer URL.
- **Logout**: OIDC provides an `end_session_endpoint` in the discovery document for RP-initiated logout. Call this endpoint when the user logs out of your app.
- **Hybrid Flow**: Some applications use the `code id_token` response type (hybrid flow) for immediate identity while the token exchange happens asynchronously. Adds complexity.

---

# Common Mistakes

- **Not validating the `aud` claim**: If your app accepts ID tokens intended for a different client, another app's tokens can authenticate in yours. Always validate `aud` matches your `client_id`.
- **Not caching JWKS**: Fetching JWKS on every request adds 50-200ms to each authentication. Cache with 1-hour TTL. Clear cache on verification failure to handle key rotation.
- **Ignoring the `nonce`**: The nonce is the primary defense against ID token replay. Without nonce validation, an attacker who obtains an ID token can reuse it.
- **Using the wrong JWK for verification**: When a JWKS response has multiple keys, match by `kid` from JWT header. Using the wrong key silently returns invalid signature error.
- **Not handling clock skew**: JWT `exp`, `iat`, `nbf` claims are time-based. Allow 30-60 seconds of clock skew between the IdP and your server.

---

# Failure Modes

- **JWKS Rotation Without Cache Clear**: If the IdP rotates keys and the JWKS cache has stale keys, all verifications fail until cache expires or is purged. Implement automatic cache invalidation on first verification failure.
- **Discovery Document Change**: If the IdP changes its token endpoint URL (e.g., domain migration), the cached discovery document returns a stale URL. All authorizations that hit the old URL fail. Force cache refresh on persistent failures.
- **Nonce Collision**: The nonce is a random value. The chance of collision is negligible with 128-bit nonces, but if session storage is shared across users (misconfiguration), one user's nonce could overlap with another's.
- **Issuer Mismatch**: `iss` claim in ID token does not match the configured issuer URL. This happens if the IdP uses multiple issuer URLs for different types of tokens. Verify the exact `iss` from the IdP's discovery document.

---

# Related Knowledge Units

- Prerequisites: OAuth2 fundamentals, JWT structure and verification, Socialite OAuth client
- Related: SAML 2.0 SSO (enterprise SSO alternative), WorkOS enterprise SSO (abstraction for OIDC/SAML)
- Advanced Follow-up: OIDC backchannel logout, OIDC claims mapping and transformation, OIDC for service-to-service auth (client credentials + OIDC)

---

# Research Notes

- The `jeffersongoncalves/laravel-oidc` driver is maintained by a single contributor — monitor its health before relying on it in production.
- Keycloak provides both a SocialiteProvider (keycloak) and its own OIDC endpoints. The SocialiteProvider approach is easier for standard OIDC; direct Keycloak admin API integration is needed for user management.
- Azure AD v2.0 endpoints support OIDC with the standard `openid` scope. Azure AD v1.0 uses a non-standard format — prefer v2.0 for OIDC compliance.
- Most OIDC providers set a 1-hour `exp` on ID tokens. Access tokens vary from 1 hour (Google) to 24 hours (some IdPs). Implement token refresh for longer sessions.
- OIDC's `claims` parameter allows requesting specific claims in the ID token directly, avoiding a separate userinfo call. Use when you need minimal latency.

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
