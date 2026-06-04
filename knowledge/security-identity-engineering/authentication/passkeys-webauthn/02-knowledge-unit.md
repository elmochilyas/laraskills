# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: First-party Passkeys/WebAuthn (laravel/passkeys)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

First-party `laravel/passkeys` (v0.2.x, April 2026) brings WebAuthn passwordless authentication directly into the Laravel ecosystem, integrated with Fortify and Sanctum. It provides server-side support for the WebAuthn protocol — credential registration (attestation) and authentication (assertion) — using platform authenticators (Face ID, Touch ID, Windows Hello, hardware security keys). The paired `@laravel/passkeys` npm package provides the browser-side WebAuthn API calls. This is an emerging, pre-1.0 package that represents the ecosystem's move toward passwordless-first authentication, but currently requires careful version pinning and attention to breaking changes.

---

# Core Concepts

- **WebAuthn Protocol**: W3C standard for passwordless authentication using public-key cryptography. The server generates a challenge; the authenticator (biometric, PIN, or security key) signs it with a private key; the server verifies with the stored public key. The private key never leaves the device.
- **Relying Party**: The Laravel application that registers and authenticates users via WebAuthn. Configured with a name, ID (domain), and expected origin(s).
- **Credential**: A public key + credential ID pair stored in the database, associated with a user. Each device/authenticator can register one credential. Multiple credentials per user.
- **Attestation**: Registration ceremony — user creates a new passkey on their device. Server stores the public key and credential ID.
- **Assertion**: Authentication ceremony — user proves they possess the private key by signing a challenge. Server verifies the signature with the stored public key.

---

# Mental Models

- **Biometric-Signed Challenge**: Think of a passkey as "prove you are you by signing this document with your device's fingerprint." The server never sees the fingerprint — only the signature.
- **Device as Token**: Each device (phone, laptop, security key) registers its own credential. Losing a device means losing that passkey — users need backup methods (multiple passkeys, passwords, recovery codes).
- **Passwordless-Additive, Not Passwordless-Replacement**: Passkeys are additive authentication. The 2026 best practice is to offer passkeys alongside password auth, not replace passwords entirely. This supports non-WebAuthn-capable devices and account recovery.

---

# Internal Mechanics

- **Package Structure**: `laravel/passkeys` (server) provides controllers, actions, and a `HasPasskeys` trait for the User model. `@laravel/passkeys` (npm) provides `createCredential()`, `getCredential()`, and `authMiddleware` for the client.
- **Registration Flow**: Frontend calls `passkeys/credentials/options` (returns challenge + relying party config from server) → Frontend calls `navigator.credentials.create()` with this data → Authenticator prompts user (Face ID, etc.) → Returns credential (public key + credential ID + attestation) → Frontend POSTs to `passkeys/credentials` → Server validates attestation → Stores public key + credential ID + counter in `passkey_credentials` table.
- **Authentication Flow**: Frontend calls `passkeys/assertion/options` (returns challenge) → Frontend calls `navigator.credentials.get()` → Authenticator prompts user → Returns assertion (credential ID + signature) → Frontend POSTs to `passkeys/assertion` → Server verifies signature against stored public key → Signs in user.
- **Integration with Fortify**: Fortify v1.37+ has a `passkeys` feature. Enable in `features` array. Fortify registers passkey routes and integrates with the `laravel/passkeys` package.
- **Relying Party Config**: Set in `config/passkeys.php` — `name`, `id` (domain), `origin` (expected origin URL), `timeout` for ceremonies.

---

# Patterns

## Passkey-First with Password Fallback Pattern
- **Purpose**: Prioritize passkeys but allow password authentication.
- **Implementation**: Login page shows passkey button prominently, "sign in with password" as link. Registration offers "add a passkey" after account creation.
- **Benefits**: Gradual adoption; users can add passkeys at their own pace.
- **Tradeoffs**: Two authentication paths to maintain and secure.

## Cross-Device Passkey Pattern
- **Purpose**: Users authenticate on a new device using a passkey from their phone.
- **Implementation**: `navigator.credentials.get({'mediation': 'conditional'})` — the browser prompts for a passkey stored on the phone (via iCloud Keychain, Google Password Manager, or 1Password).
- **Benefits**: Seamless multi-device experience without re-registration.
- **Tradeoffs**: Cross-device authentication relies on cloud sync services; not all platforms support it.

## Post-Registration Passkey Prompt Pattern
- **Purpose**: Encourage passkey adoption after traditional registration.
- **Implementation**: After email/password registration, show a modal: "Add a passkey for faster login?" with a one-click registration flow.
- **Benefits**: Gradual passkey adoption without blocking initial registration.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| `laravel/passkeys` vs `spatie/laravel-passkeys` | Need minimal setup vs Livewire components | `laravel/passkeys` for stack-agnostic, Fortify-integrated apps; Spatie for Livewire apps needing pre-built UI |
| `laravel/passkeys` vs `laragear/webauthn` | First-party vs community maintained | `laravel/passkeys` for Canonical Stack alignment; Laragear for mature (v2.x), battle-tested WebAuthn without Fortify |
| Passkeys as primary vs additive | New app vs existing user base | Additive for existing apps; primary-only is risky (device loss = account loss) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| No passwords to store or leak | Device dependency — losing device loses passkey | Users without backup (password, recovery codes) lose account access |
| Phishing-resistant (origin-bound) | New device requires re-registration or cloud sync | Cross-device UX depends on platform ecosystem (Apple, Google, Microsoft) |
| Integrated with Fortify | Pre-1.0 package — API instability | Breaking changes in minor versions require migration work |

---

# Performance Considerations

- WebAuthn ceremonies involve multiple round trips (options → create/get → verify). Each is a separate HTTP request.
- Public key operations (signature verification) are fast on the server (~1-5ms for ECDSA).
- No passkey-related database query on regular authenticated requests — passkeys only used during registration and authentication.
- The challenge is stored temporarily (session or cache) — ensure challenge storage is available (file/database session may not work; Redis recommended).

---

# Production Considerations

- **Relying Party ID**: Must be the effective domain (no port, no scheme). Cannot change after users have registered credentials (origin binding). Plan your domain structure before deploying.
- **Origin Matching**: Laravel validates the origin from the WebAuthn response against the configured `origin`. Must exactly match the request origin including scheme and port.
- **User Verification**: Configurable — `required`, `preferred`, or `discouraged`. `required` forces biometric/PIN. `preferred` allows silent authentication if the device supports it.
- **Challenge Expiry**: Challenges have a configurable timeout (default 60 seconds). Set appropriate time for users with slower biometric readers.
- **Version Pinning**: `laravel/passkeys` is v0.2.x — pin exact versions in `composer.json` and `package.json`. Monitor changelog for breaking changes.

---

# Common Mistakes

- **Changing relying party ID after launch**: All existing passkeys stop working because the origin check fails. The RP ID is domain-locked.
- **Not configuring the origin correctly**: Common misconfiguration: origin without trailing slash vs with trailing slash. Must match exactly what the browser sends.
- **Storing challenges in file session**: WebAuthn challenges need to survive the redirect for the ceremony. File sessions may not be shared across multiple servers. Use database or Redis session driver.
- **Not handling user verification failures**: If biometric verification fails on the client, the `PublicKeyCredential` response may have `userVerified: false`. Handle this gracefully.

---

# Failure Modes

- **Passkey Lost on Device Reset**: User factory resets phone or laptop. All locally stored passkeys are gone. User cannot authenticate without password/recovery codes.
- **Privacy Pass Error**: If a user denies biometric/PIN during the ceremony, the browser throws an `AbortError` or `NotAllowedError`. The client must catch this and allow fallback auth.
- **Security Key Removed Mid-Ceremony**: If the user pulls out a hardware security key during the assertion ceremony, the request hangs until timeout. Implement client-side abort handling.
- **Challenge Expiry**: If `navigator.credentials.create()` or `get()` takes longer than the challenge timeout, the server rejects the response. Challenge timeout must be generous enough for slow authenticators.

---

# Ecosystem Usage

- **Fortify**: First-party integration since v1.37.0. Enables passkeys via feature flag. Fortify handles route registration and integrates passkey auth into the login pipeline.
- **@laravel/passkeys (npm)**: Provides `createCredential`, `getCredential` wrappers around the WebAuthn browser API. Handles challenge validation, credential parsing, and `authMiddleware` for route protection.
- **Laravel Starter Kits (L13+)**: New React/Vue/Svelte kits include passkey support in the login flow. Passkeys appear as an option alongside password login.
- **Spatie/laravel-passkeys**: Alternative with Livewire components. Ships ready-to-use Livewire components for passkey registration and authentication.

---

# Related Knowledge Units

- Prerequisites: WebAuthn ceremonies (attestation and assertion), Fortify headless auth backend, Sanctum SPA cookie auth
- Related: Spatie Passkeys Livewire components, WebAuthn ceremonies, MFA/TOTP with Fortify
- Advanced Follow-up: Cross-device passkey credential synchronization, WebAuthn user verification policies, Passkey-first authentication strategy

---

# Research Notes

- `laravel/passkeys` is v0.2.x as of June 2026 — pre-1.0. Expect API changes in minor and major versions before stable release.
- The package currently supports single-step registration only — bulk credential management and credential-level configuration are on the roadmap.
- The ecosystem is converging on Fortify + Passkeys as the canonical passwordless stack for Laravel 13.x.
- Passkeys are origin-scoped — a passkey registered on `app.example.com` cannot authenticate on `admin.example.com` (different origin). Plan domain architecture accordingly.
- WebAuthn uses ECDSA (P-256) by default. RSA also supported. ECDSA is faster to generate and verify on most platforms.

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
