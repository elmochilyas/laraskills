# Metadata

Domain: Security & Identity Engineering
Subdomain: Authentication Systems
Knowledge Unit: WebAuthn ceremonies (attestation, assertion)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

WebAuthn ceremonies are the cryptographic protocol steps that enable passwordless authentication. Attestation (registration) creates a new credential — the server sends a challenge, the authenticator generates a key pair and returns the public key. Assertion (authentication) proves ownership — the server sends a challenge, the authenticator signs it with the private key, the server verifies. The critical invariants: the private key never leaves the authenticator, the origin is bound to the credential, and the challenge prevents replay attacks. These ceremonies are handled transparently by `laravel/passkeys`, `spatie/laravel-passkeys`, and `laragear/webauthn`, but understanding the protocol is essential for debugging, custom implementations, and security reviews.

---

# Core Concepts

- **Attestation (Registration)**: 1. Server generates `PublicKeyCredentialCreationOptions` (challenge, relying party info, user info, pub key params) → 2. Client calls `navigator.credentials.create(options)` → 3. Authenticator generates key pair, returns `AuthenticatorAttestationResponse` (credential ID, public key, attestation statement) → 4. Server validates attestation, stores public key + credential ID + sign count.
- **Assertion (Authentication)**: 1. Server generates `PublicKeyCredentialRequestOptions` (challenge, relying party ID, allowed credentials) → 2. Client calls `navigator.credentials.get(options)` → 3. Authenticator signs challenge with private key, returns `AuthenticatorAssertionResponse` (credential ID, signature, authenticator data, client data) → 4. Server verifies signature against stored public key, checks sign count for clone detection.
- **Challenge**: Cryptographically random byte string (16+ bytes). One-time use. Tied to the session/cache. Protects against replay attacks.
- **Relying Party ID**: The domain (e.g., `example.com`). Controls which origins the credential can be used on. Cannot be changed after credential creation.
- **Authenticator Data**: Contains the RP ID hash, user presence/verification flags, sign counter, and optional extensions.
- **Client Data**: Contains the challenge hash, origin, and cross-origin status. Verified by the server against the expected values.

---

# Mental Models

- **Digital Signature Exchange**: Attestation is like giving someone your public key. Assertion is like signing a document to prove you have the private key. The server is the notary verifying signatures.
- **One-Time Challenge**: The challenge is like a nonce — a unique, single-use token that prevents an attacker from replaying an old authentication.
- **Origin Binding**: The credential is cryptographically bound to the origin (domain). A passkey registered on `evil.com` cannot authenticate on `example.com` because the origin check fails.

---

# Internal Mechanics

**Attestation Steps (Server)**:
1. Generate random challenge (32 bytes from `random_bytes()`).
2. Build `PublicKeyCredentialCreationOptions`: `rp` (name, id), `user` (id, name, displayName), `challenge`, `pubKeyCredParams` (alg: -7 for ES256, -257 for RS256), `authenticatorSelection` (residentKey, userVerification), `timeout`, `attestation`.
3. Store challenge in session/cache keyed by user ID.
4. Return options to client as JSON (base64url-encoded binary fields).

**Attestation Steps (Client)**:
1. Decode base64 fields in options.
2. Call `const credential = await navigator.credentials.create({ publicKey: options })`.
3. Encode response fields back to base64url.
4. POST to server: `{ id, rawId, type, response: { clientDataJSON, attestationObject, transports } }`.

**Attestation Steps (Server Verification)**:
1. Validate that challenge matches stored challenge (hash comparison).
2. Verify origin in `clientDataJSON` matches the relying party's expected origin.
3. Validate that the RP ID hash in `authenticatorData` matches `SHA256(rp.id)`.
4. Verify attestation signature based on attestation statement format (none, packed, fido-u2f, etc.).
5. Store credential: `credential_id` (base64url), `public_key` (COSE key bytes), `counter` (from authenticatorData), `user_id`, `transports`.

**Assertion Steps (Server)**:
1. For a known user or stored credentials: return options with `allowCredentials` (list of credential IDs). For "login with passkey" (discovery): return options without `allowCredentials`.
2. Generate random challenge, store against user session or credential ID.
3. Return options to client.

**Assertion Steps (Client)**:
1. Call `navigator.credentials.get({ publicKey: options })`.
2. User selects credential (if multiple) or uses biometric.
3. Return credential with `AuthenticatorAssertionResponse`: `authenticatorData`, `clientDataJSON`, `signature`, `userHandle`.

**Assertion Steps (Server Verification)**:
1. Verify the credential ID exists in the database.
2. Validate challenge match.
3. Verify origin in `clientDataJSON`.
4. Validate RP ID hash.
5. Verify `signature` against stored `public_key` using the signed data (`authenticatorData + SHA256(clientDataJSON)`).
6. Check sign counter: `counter` in `authenticatorData` > stored counter (detects cloned authenticators).
7. Update stored counter to new value.
8. Authenticate user if assertion is valid.

---

# Patterns

## Discovery Credential (Conditional Mediation)
- **Purpose**: Users authenticate without typing username — "I want to log in with a passkey stored on this device."
- **Implementation**: During assertion, omit `allowCredentials`. The browser shows a list of available passkeys matching the RP ID.
- **Benefits**: Username-less login; best UX for passkey-first apps.
- **Tradeoffs**: User must have at least one passkey registered on the current device (or use cloud-synced passkeys).

## User Verification Policy
- **Purpose**: Control whether biometric/PIN is required.
- **Implementation**: Set `userVerification: 'required'`, `'preferred'`, or `'discouraged'` in both creation and request options.
- **Benefits**: Balance security vs convenience.
- **Tradeoffs**: `required` may fail on devices without biometric sensors; `discouraged` provides weaker authentication (presence-only, not verified).

## Sign Counter for Clone Detection
- **Purpose**: Detect if an authenticator has been cloned.
- **Implementation**: The authenticator increments a counter on each assertion. Server tracks last seen counter. If subsequent assertions have a counter less than or equal to the stored value, the authenticator may have been cloned.
- **Benefits**: Detection of credential duplication.
- **Tradeoffs**: Some authenticators (like Apple's iCloud Keychain synced passkeys) always return counter=0, making this check unreliable for cloud-synced credentials.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Attestation type: `none` vs `direct` vs `indirect` | Need to verify authenticator manufacturer vs privacy | `none` for most apps — simplest, no privacy concerns. `direct` for high-security contexts where authenticator model matters |
| User verification: `required` vs `preferred` | Biometric availability | `preferred` for broad compatibility; `required` for high-security or compliance scenarios |
| Challenge storage: session vs cache vs DB | Ephemeral but needs to survive across redirects | Cache (Redis) for multi-server deployments; session for single-server |
| Algorithm choice: ES256 vs RS256 | Performance vs compatibility | ES256 (ECDSA, alg -7) — faster, shorter signatures, preferred by most platforms |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Phishing-resistant authentication (origin-bound) | Domain must be fixed at registration | Changing domain = all passkeys invalidated |
| Private key never leaves device | Device loss = passkey loss | Users need backup authentication (password, recovery codes) |
| No passwords to hash/store | Challenge management overhead | Stale challenges accumulate if clients abandon ceremonies |
| Sign counter detects clones | Cloud-synced passkeys break counter tracking | iCloud/Google sync invalidates clone detection — must accept this or restrict to hardware keys |

---

# Performance Considerations

- Challenge generation: fast (16-32 bytes of random). Not a bottleneck.
- Key pair generation on client — no server CPU cost.
- Signature verification: ECDSA (ES256) ~1-3ms on modern CPUs. RS256 (RSA) ~5-10ms. With 1 signature per authentication, the overhead is negligible.
- Challenge storage: 32 bytes + TTL. Minimal storage cost. But stale challenges from abandoned ceremonies accumulate — implement cleanup.

---

# Production Considerations

- **Challenge TTL**: Set to 60-120 seconds. Long enough for biometric prompts and security key insertion. Short enough to prevent replay window.
- **Allowed Origins**: Strict list of origins (scheme + host + port) that can perform WebAuthn ceremonies. Must match exactly what the browser sends.
- **CORS for WebAuthn**: If the frontend is on a different origin, CORS must allow WebAuthn endpoints. WebAuthn does NOT work cross-origin natively — the origin check is a core security feature.
- **Testing WebAuthn**: Most browsers support WebAuthn in headless mode. Use `chrome://webauthn` or Puppeteer's virtual authenticator environment for testing. Laravel tests can mock the WebAuthn library's verification methods.
- **iOS/macOS**: Apple's platform authenticator for WebAuthn requires HTTPS (even for local development via `localhost` exceptions). `http://` origins are rejected by Safari.

---

# Common Mistakes

- **Not base64url-encoding correctly**: WebAuthn uses base64url WITHOUT padding. Standard base64 with padding or different URL-safe characters causes verification failures.
- **Changing relying party ID after credential registration**: The RP ID hash check will fail for all existing credentials because the hash no longer matches.
- **Storing challenge in a way that does not survive the ceremony**: The challenge created in `options` request must be verifiable in the `verify` request — they are different HTTP requests. Session or cache must persist between them.
- **Not handling `navigator.credentials` API errors**: User cancels biometric → `NotAllowedError`. No authenticator → `NotSupportedError`. These must not crash the UI.
- **Reusing challenges**: Challenge is single-use. If the same challenge is presented twice, an attacker can replay a captured response. Always invalidate challenge after verification.

---

# Failure Modes

- **Credential ID Not Found**: During assertion, if `allowCredentials` includes a credential that the user has deleted from their device, or if a credential ID was pruned, the browser shows "No passkey available."
- **Counter Rolling Back**: If the server's stored counter is higher than the authenticator counter, the credential may have been cloned. The server should reject the assertion and flag the user for security review.
- **Challenge Collision**: Extremely unlikely with 32 bytes of random (`2^256`), but if a challenge is reused, replay attack is possible. Always regenerate challenges per ceremony.
- **User Verification Failure After Policy Change**: If `userVerification` policy was changed from `discouraged` to `required`, existing credentials without UV flag will fail assertion.
- **Test Environment Mismatch**: CI environments without WebAuthn support (headless, sandboxed) cannot run browser-level WebAuthn tests. Use mocked ceremony flows.

---

# Related Knowledge Units

- Prerequisites: Public-key cryptography fundamentals (key pairs, signatures), understanding of challenge-response protocols
- Related: First-party Passkeys/WebAuthn (`laravel/passkeys`), Spatie Passkeys Livewire components
- Advanced Follow-up: WebAuthn extension handling (large blob, credential protection), FIDO2 CTAP2 (external authenticator protocol), JSON serialization for WebAuthn responses

---

# Research Notes

- The `attestation` property controls whether the authenticator reveals its manufacturer/model. `none` is the privacy-friendly default — the server cannot tell if the passkey is from Apple, Google, or a YubiKey. `direct` reveals the AAGUID (authenticator model identifier).
- WebAuthn Level 2 added `minPinLength` extension, `credProps` extension (for discoverable credential reporting), and `LargeBlob` extension (for storing data with credentials).
- Cloud-synced passkeys (iCloud Keychain, Google Password Manager) always return `counter=0`. The sign counter clone detection check is effectively disabled for synced credentials. This is an accepted tradeoff for cross-device usability.
- `authenticatorSelection.residentKey = 'required'` creates discoverable credentials that can be used without first providing a username (conditional mediation). `'discouraged'` creates non-resident keys that require `allowCredentials` listing.

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
