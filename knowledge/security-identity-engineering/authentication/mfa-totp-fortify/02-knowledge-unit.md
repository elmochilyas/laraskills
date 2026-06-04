# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: MFA/TOTP with Fortify
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Fortify provides full server-side support for TOTP-based multi-factor authentication, including setup, confirmation, challenge, and recovery codes. When the `two-factor-authentication` feature is enabled in `config/fortify.php`, Fortify registers routes for enabling 2FA (generating QR code + setup key), confirming 2FA (first TOTP verification), challenging 2FA (verifying TOTP on login), and using recovery codes. The flow integrates with Fortify's authentication pipeline via `RedirectIfTwoFactorAuthenticatable`. The User model needs the `TwoFactorAuthenticatable` trait, and the `users` table must include `two_factor_secret`, `two_factor_recovery_codes`, and `two_factor_confirmed_at` columns. TOTP uses 30-second time windows with a 1-step drift margin.

---

# Core Concepts

- **TOTP (Time-based One-Time Password)**: RFC 6238 — generates 6-digit codes based on HMAC-SHA1 of the current 30-second time window. Shared secret between server (Fortify) and authenticator app (Google Authenticator, Authy, 1Password).
- **Recovery Codes**: 8-digit single-use codes generated when 2FA is enabled. Stored as encrypted JSON. Each code has a 50% chance of being consumed when used (random selection from pool). After all recovery codes are used, the user is locked out unless they have another method.
- **Two-Factor Challenge Flow**: On login, `RedirectIfTwoFactorAuthenticatable` checks if the user has `two_factor_confirmed_at` set → if yes, redirects to `/two-factor-challenge` → user enters TOTP code or recovery code → verified via `TwoFactorLoginRequest` → session authenticated.
- **Confirmation**: After enabling 2FA, the first TOTP code must be provided to confirm setup. Until confirmed, the secret is stored but 2FA is not enforced on login.
- **Encryption**: `two_factor_secret` and `two_factor_recovery_codes` are encrypted at rest using Laravel's encryption (`Crypt::encrypt` / `Crypt::decrypt`). Rotating `APP_KEY` invalidates them.

---

# Mental Models

- **Shared Secret Model**: 2FA is based on a shared secret between the server and the user's authenticator app. The server stores it encrypted; the authenticator app stores it locally. Both derive the same 6-digit code from the current time.
- **Window-Based Validation**: The time window (30 seconds) plus 1-step drift means each code is valid for a 90-second window (previous, current, next). This tolerates slight clock skew but means a stolen code is usable for ~1 minute.
- **Recovery as Safety Net**: Recovery codes are the only way back in if the authenticator app is lost. Users must be prompted to save them during setup.

---

# Patterns

## Mandatory 2FA for Admin Pattern
- **Purpose**: Enforce 2FA for admin users only.
- **Implementation**: Custom `FortifyServiceProvider` boot method — check user role after login, if admin and 2FA not enabled, redirect to 2FA setup page instead of dashboard.
- **Benefits**: Higher security for privileged accounts without burdening all users.
- **Tradeoffs**: Additional logic in login flow; admin users may be locked out if they lose their authenticator device.

## Grace Period Pattern
- **Purpose**: Allow users to postpone 2FA setup.
- **Implementation**: Track `two_factor_confirmed_at` and `two_factor_skipped_at`. Allow login for N days after first prompt before enforcing.
- **Benefits**: Gradual adoption without blocking users.
- **Tradeoffs**: Security gap during grace period.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Fortify 2FA vs custom TOTP | Need headless 2FA | Fortify 2FA is the standard; custom only needed for non-standard 2FA methods (WebAuthn as second factor, SMS) |
| Recovery codes vs backup methods | Provide multiple recovery paths | Recovery codes + email-based recovery (send code to email) — never rely only on recovery codes |
| Encrypted secret vs hashed secret | Encryption allows recovery; hashing prevents secret recovery | Fortify encrypts — allows the server to re-display the setup key if needed. Understand the `APP_KEY` dependency |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Built into Fortify — no additional packages | TOTP only — no SMS, no push notification | Users who cannot use authenticator apps (accessibility) need alternative paths |
| Recovery codes provide account recovery path | Recovery codes are finite and often lost | Users without saved recovery codes AND lost authenticator = support ticket |
| Encrypted secrets can be migrated | `APP_KEY` rotation invalidates all 2FA secrets | Plan 2FA secret rotation when rotating `APP_KEY`. Users must re-enable 2FA |

---

# Performance Considerations

- TOTP verification is a single HMAC operation — <1ms.
- Recovery code verification scans and updates the encrypted JSON column — minimal overhead.
- The 2FA challenge redirect adds one extra HTTP request to the login flow.

---

# Production Considerations

- **Backup Codes Display**: Recovery codes must be shown to the user exactly once (after enabling 2FA). After that, they are encrypted and inaccessible via UI. Download or print prompt is critical.
- **Rate Limiting**: 2FA challenge routes should be rate limited (5 attempts per minute). Brute-forcing TOTP has a 1-in-30,000 chance per attempt — rate limiting makes brute force impractical.
- **Time Synchronization**: TOTP relies on accurate server time. Run NTP sync. If the server clock drifts by more than 30 seconds, valid codes are rejected.
- **`APP_KEY` Warning**: Since `two_factor_secret` is encrypted with `APP_KEY`, rotating the app key without decrypting/re-encrypting 2FA secrets invalidates all user 2FA configurations. Script the rotation process.

---

# Common Mistakes

- **Not confirming 2FA after enabling**: Enabling 2FA creates the secret. Confirming 2FA sets `two_factor_confirmed_at`. Without confirmation, 2FA is not enforced. Users think they have 2FA but don't.
- **Losing recovery codes**: Users close the browser tab after setup without saving recovery codes. No way to display them again without support intervention (calling `decrypt($user->two_factor_recovery_codes)` from a support tool).
- **Assuming 2FA works without `TwoFactorAuthenticatable` trait**: The User model must use the trait and the migration columns must exist. Missing trait → `BadMethodCallException` on login.
- **Using same APP_KEY for dev and prod**: If dev 2FA secrets were created with one APP_KEY and the database is copied to prod, the secrets cannot be decrypted with the prod APP_KEY.

---

# Failure Modes

- **`APP_KEY` Rotation Without 2FA Migration**: After `php artisan key:generate`, all stored 2FA secrets are undecryptable. Users get an error when trying to log in with 2FA. Mitigation: decrypt all 2FA secrets with old key before rotation, re-encrypt with new key.
- **Clock Drift on Server**: If the server clock is off by >30 seconds, all TOTP codes fail. Authenticator apps are typically synced to phone network time; the server must be within 30 seconds of real time.
- **Recovery Code Exhaustion**: User uses all 10 recovery codes and loses authenticator. Account recovery requires admin intervention. Implement an email-based backup code as alternative.
- **2FA Secret Loss During Encryption Migration**: Changing encryption algorithm (`AES-256-CBC` → `AES-256-GCM`) invalidates encrypted 2FA secrets if the old key cannot decrypt.

---

# Related Knowledge Units

- Prerequisites: Fortify headless auth backend, Auth guards/providers architecture
- Related: First-party Passkeys/WebAuthn (alternative 2FA method), Fortify action pipeline
- Advanced Follow-up: Custom TOTP implementation with `pragmarx/google2fa`, WebAuthn as second factor, `APP_KEY` rotation procedures for encrypted data

---

# Research Notes

- Fortify uses `pragmarx/google2fa-laravel` under the hood for TOTP generation and verification, with Laravel's encryption for storing secrets.
- Recovery codes use a clever algorithm: each code has a "valid" flag determined by a hash of the code. This allows checking if a code has been used without storing a list of consumed codes — the code is hashed, and the hash array has the code's position marked as consumed.
- The `two_factor_recovery_codes` field stores an encrypted JSON array of recovery codes (10 by default). Each code looks like `AAAA-BBBB-CCCC-DDDD`.
- Many apps now support WebAuthn as a second factor (hardware security keys). This is more phishing-resistant than TOTP. Consider offering both.

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
