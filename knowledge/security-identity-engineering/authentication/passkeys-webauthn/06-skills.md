# Skill: Implement First-Party Passkeys/WebAuthn Passwordless Authentication

## Purpose
Configure the `laravel/passkeys` first-party package to enable passwordless WebAuthn passkey authentication with platform biometrics or device PIN.

## When To Use
- Passwordless authentication for modern web applications
- Reducing password management overhead (resets, complexity rules)
- Applications targeting security-conscious users
- Complementary auth method alongside passwords

## When NOT To Use
- Applications needing compatibility with very old browsers (WebAuthn requires modern browsers)
- Non-HTTPS environments (WebAuthn requires secure context)
- As sole authentication method (maintain password fallback)
- M2M or API-only applications (no browser-based WebAuthn ceremony)

## Prerequisites
- Laravel 11+ application
- `composer require laravel/passkeys` (pin exact version for pre-1.0)
- `npm install @laravel/passkeys`
- HTTPS configured in all environments
- Fortify or another auth backend (optional)

## Inputs
- Relying Party (RP) configuration: name, domain ID, origin URL
- Frontend framework type (React, Vue, Svelte) for npm client integration
- User verification requirement (required vs discouraged)

## Workflow (numbered)
1. Install `laravel/passkeys` and pin exact version in `composer.json`
2. Publish config: `php artisan vendor:publish --tag=passkeys-config`
3. Configure `config/passkeys.php` with RP name, ID (domain only), and origin
4. Install `@laravel/passkeys` npm package on frontend
5. Integrate passkey registration component in user settings/registration page
6. Integrate passkey authentication component in login page
7. Maintain password-based login as fallback
8. Ensure HTTPS in all environments (WebAuthn mandatory)
9. Test passkey registration and login in major browsers

## Validation Checklist
- [ ] `laravel/passkeys` exact version pinned in `composer.json`
- [ ] `@laravel/passkeys` npm package installed
- [ ] RP ID configured as domain only (no port, no path)
- [ ] RP origin configured as full HTTPS URL
- [ ] HTTPS enabled in all environments
- [ ] Password fallback authentication available
- [ ] Passkey registration and login tested in Chrome, Firefox, Safari, Edge

## Common Failures
- Using passkeys as the only auth method (users without WebAuthn devices locked out)
- Not pinning pre-1.0 version (breaking changes on update)
- Misconfiguring RP ID with port or path (WebAuthn ceremony fails)
- HTTP environment (WebAuthn API unavailable)

## Decision Points
- **`laravel/passkeys` vs `spatie/laravel-passkeys`**: Use first-party for React/Vue/Svelte; Spatie for Livewire
- **User verification**: `required` for production (biometric/PIN); `discouraged` only for low-security contexts
- **Password fallback**: Always maintain for accessibility — never make passkeys the only method

## Performance Considerations
- WebAuthn ceremonies: ~500ms for biometric verification on modern devices
- Credential storage: public keys are ~100-200 bytes each
- No server-side hashing overhead (public key cryptography replaces password hashing)

## Security Considerations
- Phishing resistance: passkeys scoped to RP domain — cannot be phished on fake domain
- Private key never leaves user's device — no server-side secret storage
- Pre-1.0 maturity: API may change — pin versions and test upgrades
- HTTPS mandatory: no workaround for WebAuthn secure context requirement

## Related Rules (from 05-rules.md)
- Maintain Password Fallback Alongside Passkeys
- Pin Exact Version of laravel/passkeys
- Use the Official npm Client for Browser Ceremonies
- Configure RP ID as Domain Without Port or Path
- Serve HTTPS in All Environments for WebAuthn
- Never Send Private Keys to the Server

## Related Skills
- Configure Spatie Passkeys/WebAuthn (Livewire alternative)
- Implement WebAuthn Ceremonies (attestation, assertion)
- Customize Fortify Headless Auth Backend
- Implement MFA/TOTP with Fortify

## Success Criteria
- Users can register a passkey using platform biometrics/PIN
- Users can log in with passkey instead of password
- Password fallback works for users without WebAuthn-capable devices
- Passkey registration and authentication work in all major browsers
- RP domain-only configuration passes WebAuthn specification
- HTTPS required — HTTP environments show clear error
