# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: SAML 2.0 SSO via SocialiteProviders
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

SAML 2.0 Single Sign-On in Laravel is implemented via the `socialiteproviders/saml2` package, which extends Socialite with SAML protocol support. It enables your Laravel app to act as a SAML Service Provider (SP), authenticating users through enterprise Identity Providers (IdPs) like Azure AD, Okta, Keycloak, or ADFS. The SAML protocol is XML-based, uses signed assertions for security, and supports IdP-initiated and SP-initiated SSO flows. Unlike OAuth2's JSON tokens, SAML uses XML signatures, making the implementation substantially different from Socialite's OAuth2 drivers.

---

# Core Concepts

- **Service Provider (SP)**: Your Laravel application. Trusts assertions from the IdP.
- **Identity Provider (IdP)**: The enterprise system (Azure AD, Okta) that authenticates users and issues SAML assertions.
- **SAML Assertion**: XML document containing user identity (name ID, attributes) signed by the IdP's private key. The SP verifies the signature using the IdP's public certificate.
- **SP-Initiated SSO**: User clicks "Login with SSO" → SP generates `AuthnRequest` → redirects to IdP → IdP authenticates → IdP POSTs `SAMLResponse` to SP's ACS URL → SP validates assertion → user logged in.
- **IdP-Initiated SSO**: User accesses IdP dashboard → IdP POSTs `SAMLResponse` to SP's ACS URL → SP validates assertion → user logged in.
- **Metadata Exchange**: XML document describing both SP and IdP endpoints, certificates, and supported bindings. Used for configuration.
- **Name ID**: Unique user identifier from the IdP. Typically email or a persistent identifier. Acts as the user key in your database.
- **Binding**: How SAML messages are transported. HTTP-Redirect (GET), HTTP-POST, HTTP-Artifact.

---

# Mental Models

- **XML and Certificates**: Think of SAML as "OAuth2 but with XML and more ceremony." Instead of JSON tokens, assertions are XML documents wrapped in digital signatures. The protocol is older, more verbose, and less developer-friendly than OIDC but remains the enterprise standard.
- **Trust Fabric**: SAML is built on pre-established trust. The SP and IdP must exchange metadata (certificates, endpoints) out-of-band before any authentication can happen. This is not "discoverable" like OIDC's well-known endpoint.

---

# Internal Mechanics

- **SocialiteProviders/SAML2** wraps the `onelogin/php-saml` library (or `lightSAML` in some versions) to provide SAML protocol handling behind Socialite's `Provider` interface.
- **Configuration**: `config/services.php` — `'saml2' => [ 'sp' => [...], 'idp' => [...], 'strict' => true ]` — includes SP entity ID, ACS URL, certificate, private key, and IdP metadata.
- **Flow**: `Socialite::driver('saml2')->redirect()` → generates `AuthnRequest` → redirects to IdP with SAMLRequest parameter → IdP processes → POSTs `SAMLResponse` to ACS route → `Socialite::driver('saml2')->user()` → parses assertion, verifies signature, returns `SAML2User`.
- **Assertion Validation**: Checks signature (XMLDSig), confirms Audience (SP entity ID), confirms Recipient (ACS URL), checks timestamps (NotBefore/NotOnOrAfter), verifies SubjectConfirmation.
- **Session Handling**: SAML can send `SessionIndex` in the assertion, enabling single logout (SLO) — the IdP can notify all SPs to log out the user.

---

# Patterns

## Tenant-Specific IdP Pattern
- **Purpose**: Multi-tenant apps where each tenant has their own IdP.
- **Implementation**: Dynamic SAML configuration per tenant, stored in database. Resolve the correct IdP metadata based on tenant domain or user email domain.
- **Benefits**: Each enterprise customer uses their own SSO.
- **Tradeoffs**: Dynamic configuration adds complexity; IdP metadata must be stored and managed per tenant.

## Just-In-Time (JIT) Provisioning Pattern
- **Purpose**: Auto-create user accounts on first SAML login.
- **Implementation**: After assertion validation, find user by Name ID or email. If not found, create a new user with attributes from the assertion (email, firstName, lastName, groups).
- **Benefits**: No user pre-provisioning needed; users log in and accounts are created automatically.
- **Tradeoffs**: Group mapping for authorization requires careful setup; users without required attributes may break.

## SAML + Local Password Fallback Pattern
- **Purpose**: Allow local password login when IdP is unreachable.
- **Implementation**: Separate login paths — `/login` (local) and `/login/saml2` (SSO). The local path validates against the application's user provider.
- **Benefits**: Resilience against IdP downtime.
- **Tradeoffs**: Two authentication paths to maintain; users may confuse which one to use.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| SAML vs OIDC | Enterprise IdP capabilities | Prefer OIDC if the IdP supports it (simpler protocol, JSON, better developer experience). SAML if IdP only supports SAML 2.0 |
| Single IdP vs per-tenant IdP | Multi-enterprise SaaS | Start with single IdP. Add per-tenant IdP only when customer demands their own SSO |
| SP certificate management | Self-signed vs CA-signed | Self-signed is standard for SAML — the IdP trusts specific certificates, not CA chain |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Enterprise-standard SSO (supported by all major IdPs) | Complex XML protocol, difficult to debug | Debugging SAML requires XML signature inspection and metadata comparison — specialized knowledge |
| JIT provisioning enables zero-touch onboarding | No automatic de-provisioning when user leaves IdP | Must implement SCIM for automated user deactivation, or rely on IdP-initiated SLO (if supported) |
| Single Logout (SLO) enables centralized session management | Most implementations are unreliable (IdP or SP may fail to propagate logout) | SLO is often disabled because cross-domain logout failures cause confusing user states |

---

# Performance Considerations

- SAML authentication requires XML signature parsing and verification — ~10-50ms server-side per assertion, depending on key size.
- The HTTP-POST binding requires the IdP to POST to your ACS URL. If multiple SPs share the same host, ensure adequate request handling capacity.
- SAML metadata files are typically <10KB. Fetching IdP metadata from a URL adds one network call during IdP initialization.

---

# Production Considerations

- **Certificate Rotation**: IdP certificates expire. Monitor expiration dates and rotate before expiry. SAML has a window where both old and new certificates can be accepted (`x509cert` and `x509certNew` in some implementations).
- **ACS URL Stability**: The ACS URL is registered with the IdP. Changing it requires updating the IdP configuration — a coordination effort with enterprise IT.
- **Clock Synchronization**: SAML assertions have `NotBefore` and `NotOnOrAfter` timestamps. If the server clock is more than a few minutes off from the IdP's clock, valid assertions are rejected. Use NTP synchronization.
- **Metadata Expiry**: IdP metadata XML often includes a `validUntil` attribute. Monitor and refresh before expiry or metadata becomes invalid.
- **Logging**: Log the full SAML response in debug mode. Without it, assertion errors are impossible to diagnose.

---

# Common Mistakes

- **Clock skew not accounted for**: Server clock off by 5 minutes causes "assertion expired" errors. Solution: NTP sync + allow a few minutes of `NotBefore` tolerance.
- **Using the wrong binding**: HTTP-Redirect for `AuthnRequest` (GET with `SAMLRequest` parameter), HTTP-POST for `SAMLResponse`. Mixing them causes protocol errors.
- **Not persisting the SAML relay state**: `RelayState` is a parameter for post-auth redirect. If lost, the user redirects to the default page instead of the intended destination.
- **Configuring ACS URL with trailing slash when IdP expects no trailing slash**: URL matching is strict. Mismatch breaks the assertion.
- **Storing SAML private key in the repository**: SP private key (used for signing/authn requests) must be in a secure store, not in version control.
- **Not handling Name ID format mismatches**: IdP sends `emailAddress` format but SP expects `persistent` format. The Name ID extraction fails, and user lookup returns null.

---

# Failure Modes

- **Signature Validation Failure**: If the IdP rotates their certificate without updating metadata on the SP, all SAML responses fail signature validation until metadata is updated.
- **Audience Mismatch**: If the SP entity ID changes (e.g., domain rename), the Audience condition in assertions fails. Must update entity ID in IdP configuration.
- **Missing Attribute**: If the application expects a `groups` attribute but the IdP doesn't send it, JIT provisioning creates users with no group/role mapping.
- **POST Body Limit**: For IdP-initiated SSO with large SAML responses (many user attributes, group memberships), the HTTP-POST body may exceed server `post_max_size` or `max_input_vars`. Response truncated → invalid XML → auth failure.

---

# Related Knowledge Units

- Prerequisites: Socialite OAuth1/OAuth2 client, XML signature basics
- Related: OIDC integration (jwks validation, nonce, discovery), WorkOS enterprise SSO
- Advanced Follow-up: Multiple IdP configuration management, SAML Single Logout implementation, Dynamic SAML metadata generation

---

# Research Notes

- The `socialiteproviders/saml2` package relies on `onelogin/php-saml` which is a mature library but has different behavior across PHP versions. Test thoroughly with your specific PHP version.
- WorkOS's Enterprise SSO product can abstract away the SAML complexity — it handles the SAML protocol as a proxy and returns the user data as JSON to your Laravel app. This trades SAML complexity for a third-party dependency.
- Azure AD sends SAML assertions via HTTP-POST binding only. Okta supports both HTTP-Redirect and HTTP-POST. Test with your target IdP.
- SAML does not have a standard "logout" that works reliably across all IdPs. The SLO (Single Logout) endpoint is optional and many enterprise IdPs do not implement it correctly.

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
