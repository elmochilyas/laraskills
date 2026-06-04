# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | First-Party Passkeys/WebAuthn |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Emerging (v0.2.x pre-1.0) |

---

## Overview

First-party `laravel/passkeys` (April 2026) provides WebAuthn passkey authentication for Laravel applications. Passkeys allow users to authenticate with platform biometrics (Face ID, Touch ID, Windows Hello) or device PIN, replacing passwords. The package provides server-side WebAuthn ceremony handling (attestation for registration, assertion for login), relying party configuration, and integrates with Fortify. The `@laravel/passkeys` npm client package handles browser-side WebAuthn API interactions.

---

## Core Concepts

- **Passkey**: A discoverable credential stored on the user's device, protected by biometric or PIN verification.
- **WebAuthn Ceremonies**: Registration (create credential) and Authentication (get credential) — standardized browser APIs.
- **Relying Party (RP)**: The server (your Laravel app) that registers and verifies credentials. Defined by `rp.name` and `rp.id` (domain).
- **Attestation**: Registration ceremony — the authenticator creates a new public/private key pair and returns the public key to the server.
- **Assertion**: Authentication ceremony — the authenticator signs a challenge with the private key; the server verifies with the stored public key.
- **`@laravel/passkeys` npm package**: Client-side JavaScript package that calls the WebAuthn browser API.

---

## When To Use

- Passwordless authentication for modern web applications
- Reducing password management overhead (resets, complexity rules)
- Applications targeting security-conscious users or enterprises
- Complementary auth method alongside passwords (additive, not replacement)

## When NOT To Use

- Applications requiring compatibility with very old browsers (WebAuthn requires modern browsers)
- Applications deployed on non-HTTPS environments (WebAuthn requires secure context)
- As the sole authentication method for all users (maintain password fallback)
- M2M or API-only applications (no browser-based WebAuthn ceremony)

---

## Best Practices

- **Maintain Password Fallback**: Passkeys are additive authentication. Users without WebAuthn-capable devices need password login.
- **Pin Exact Version**: `laravel/passkeys` is pre-1.0. Pin exact versions to prevent breaking changes.
- **Enable in Fortify**: Passkeys integrate with Fortify — ensure `config/fortify.php` features include passkey support.
- **Use the npm Client**: `@laravel/passkeys` handles browser WebAuthn API — do not implement ceremony logic manually.
- **Monitor Changelog**: v0.2.x API may change. Subscribe to the GitHub repository for release notes.

---

## Architecture Guidelines

- Server-side: `laravel/passkeys` package provides routes, controllers, and credential storage
- Client-side: `@laravel/passkeys` npm package provides browser ceremony handlers
- RP configuration: `rp.name` (your app name), `rp.id` (your domain — no port/subdirectory), `origin` (full HTTPS origin)
- Credential storage: public key, credential ID, counter, and user association in `passkeys` table
- User verification: `required` (PIN/biometric) vs `preferred` vs `discouraged`

---

## Performance Considerations

- WebAuthn ceremonies are fast (~500ms for biometric verification on modern devices)
- Credential storage: public keys are small (~100-200 bytes each)
- No server-side hashing overhead (public key cryptography replaces password hashing)

---

## Security Considerations

- **Phishing Resistance**: Passkeys are scoped to the RP domain — cannot be phished on a fake domain.
- **Device-Bound Security**: Private key never leaves the user's device — no server-side secret storage.
- **Pre-1.0 Maturity**: API may change in non-backward-compatible ways. Pin versions and test upgrades.
- **Backup/Fallback**: Passkeys sync across devices via iCloud Keychain, Google Password Manager, etc. (platform-dependent).

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using passkeys as the only auth method | Assuming universal WebAuthn support | Users without compatible devices cannot log in | Maintain password fallback |
| Not pinning laravel/passkeys version | Assuming semver stability | Breaking changes on composer update | Pin exact version; test upgrades |
| Misconfiguring RP ID | Including port number or path | WebAuthn ceremony fails | RP ID must be the effective domain (no port, no path) |
| Ignoring HTTP security context | Developing on HTTP | WebAuthn API unavailable | Use HTTPS in all environments |

---

## Anti-Patterns

- **Replacing passwords entirely without fallback**: Always offer alternative authentication
- **Manual WebAuthn ceremony implementation**: Use `@laravel/passkeys` npm package
- **Storing private keys on the server**: Defeats the purpose of passkeys — never send private keys to server

---

## Examples

**Relying party configuration:**
```php
// config/passkeys.php
return [
    'rp' => [
        'name' => 'My Application',
        'id' => env('PASSKEYS_RP_ID', 'example.com'),
    ],
];
```

**Client-side registration (React):**
```jsx
import { create } from '@laravel/passkeys';

async function registerPasskey() {
    const credential = await create({
        username: user.email,
        displayName: user.name,
    });
    // Credential is automatically stored server-side
}
```

---

## Related Topics

- WebAuthn ceremonies (attestation, assertion)
- Spatie laravel-passkeys (alternative, more mature)
- Fortify headless auth backend
- MFA/TOTP (complementary auth method)

---

## AI Agent Notes

- First-party passkeys are very new (April 2026, v0.2.x). Evaluate maturity carefully for production use. Consider `spatie/laravel-passkeys` as a more battle-tested alternative.
- The `@laravel/passkeys` npm package is required for the browser side — check `package.json` for the dependency.
- HTTPS is mandatory for WebAuthn. No workaround exists.

---

## Verification

- [ ] `laravel/passkeys` installed and configured
- [ ] `@laravel/passkeys` npm package installed
- [ ] RP name and ID configured correctly (no port, no path in RP ID)
- [ ] HTTPS enabled in all environments
- [ ] Password fallback authentication available
- [ ] Passkey registration and login tested in major browsers
- [ ] Credential storage schema includes public key and counter
- [ ] Exact version pinned in `composer.json`
- [ ] Fortify integration configured (if using Fortify)
