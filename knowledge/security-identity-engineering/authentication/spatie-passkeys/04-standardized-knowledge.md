# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authentication Systems |
| Knowledge Unit | Spatie Passkeys/WebAuthn |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

`spatie/laravel-passkeys` provides WebAuthn passkey authentication with pre-built Livewire components. Unlike the first-party `laravel/passkeys` (which is stack-agnostic), Spatie's package ships ready-to-use Blade/Livewire UI components for passkey registration and login. It is battle-tested in production (Mailcoach) and is more mature than the first-party alternative (as of 2026). The package handles WebAuthn ceremonies (attestation, assertion), credential storage, and provides a user-friendly interface for managing passkeys.

---

## Core Concepts

- **Livewire Components**: Pre-built, customizable UI for passkey registration, login, and management.
- **WebAuthn Ceremonies**: Registration (create credential with authenticator) and authentication (assertion — prove possession of private key).
- **Credential Storage**: Public keys, credential IDs, and user associations stored in a `passkeys` database table.
- **User Verification**: `required` (PIN/biometric) or `discouraged` (just presence).
- **Relying Party**: Configured via `config/passkeys.php` — name, ID (domain), and origin.

---

## When To Use

- Laravel applications using Livewire for frontend
- Production applications needing battle-tested passkey auth
- Projects wanting passkeys with minimal setup (pre-built Livewire components)
- Applications where Spatie ecosystem is already in use

## When NOT To Use

- Non-Livewire frontend (React, Vue, Svelte) — use first-party `laravel/passkeys`
- Applications requiring stack-agnostic passkey implementation (use first-party)
- When the pre-built Spatie components do not match the UI design (custom implementation needed)

---

## Best Practices

- **Use as Additive Auth**: Passkeys complement password auth — maintain password fallback.
- **Customize Components**: Publish and modify Livewire components to match the application's design system.
- **Enable User Verification**: Require biometric/PIN verification for stronger security.
- **Monitor HTTPS**: WebAuthn requires secure context (HTTPS). No exceptions.
- **User Education**: Explain passkeys to users — what they are, how to use them across devices.

---

## Architecture Guidelines

- Install `spatie/laravel-passkeys` via Composer
- Publish config and migrations: `php artisan vendor:publish --tag=passkeys-config --tag=passkeys-migrations`
- Publish Livewire components for customization: `php artisan vendor:publish --tag=passkeys-views`
- Configure `config/passkeys.php` with RP name, ID, and origin
- Use the provided Livewire components in auth views

---

## Performance Considerations

- WebAuthn ceremonies are fast (~500ms for biometric verification)
- Public key storage is minimal (~100-200 bytes per key)
- No server-side hashing (public key cryptography replaces passwords)

---

## Security Considerations

- **Phishing Resistance**: Passkeys are scoped to the RP domain — cannot be phished.
- **Device-Bound**: Private key never leaves the user's device.
- **Production-Tested**: Spatie's package powers Mailcoach — battle-tested for production use.
- **Pre-1.0 First-Party Alternative**: Spatie's package is more mature than `laravel/passkeys` (v0.2.x) as of 2026.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Making passkeys the only auth method | Assuming universal WebAuthn support | Users without compatible devices limited | Maintain password fallback |
| Not configuring HTTPS | Local development on HTTP | WebAuthn API unavailable | Use HTTPS on all environments |
| Not publishing views | Using default components without customization | Generic UI doesn't match app design | Publish and customize Livewire components |
| Misconfiguring RP origin | Wrong format | WebAuthn ceremonies fail | Origin must be full HTTPS URL |

---

## Anti-Patterns

- **Manual WebAuthn ceremony implementation when Spatie does it**: The package handles browser API calls — no need to implement manually
- **Ignoring device compatibility**: Not all devices have biometric sensors — offer alternative auth

---

## Examples

**Configuration:**
```php
// config/passkeys.php
return [
    'rp' => [
        'name' => 'My Application',
        'id' => env('PASSKEYS_RP_ID', 'example.com'),
        'origin' => env('PASSKEYS_ORIGIN', 'https://example.com'),
    ],
];
```

**Using Livewire component:**
```blade
{{-- Passkey registration button --}}
<livewire:passkeys::register />

{{-- Login with passkey --}}
<livewire:passkeys::authenticate />

{{-- User passkey management --}}
<livewire:passkeys::manage />
```

---

## Related Topics

- First-party Passkeys/WebAuthn (`laravel/passkeys`)
- WebAuthn ceremonies (attestation, assertion)
- Livewire components and security
- Fortify headless auth backend
- MFA/TOTP (complementary security)

---

## AI Agent Notes

- For Laravel Livewire projects, Spatie's passkey package is the recommended choice over the first-party package (more mature, better UI components).
- The Spatie package is production-tested in Mailcoach — suitable for production deployment.
- If the project uses React/Vue/Svelte, prefer the first-party `laravel/passkeys` package.

---

## Verification

- [ ] `spatie/laravel-passkeys` installed and configured
- [ ] RP name, ID, and origin configured correctly
- [ ] HTTPS enabled in all environments
- [ ] Livewire components published and customized
- [ ] Password fallback authentication maintained
- [ ] Passkey registration and login tested in major browsers
- [ ] User verification (biometric/PIN) required
- [ ] Credential storage table migrated
- [ ] User-facing documentation for passkey usage
