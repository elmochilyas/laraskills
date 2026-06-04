# Skill: Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth

## Purpose
Implement passkey WebAuthn authentication using `spatie/laravel-passkeys` with pre-built Livewire components for registration, login, and passkey management.

## When To Use
- Laravel applications using Livewire for frontend
- Production applications needing battle-tested passkey auth
- Projects wanting passkeys with minimal setup (pre-built Livewire components)
- Applications where Spatie ecosystem is already in use

## When NOT To Use
- Non-Livewire frontend (React, Vue, Svelte) — use first-party `laravel/passkeys`
- Applications requiring stack-agnostic passkey implementation
- Simple password-based auth where passkeys add unnecessary complexity

## Prerequisites
- Laravel application with Livewire installed
- `composer require spatie/laravel-passkeys`
- HTTPS configured in all environments
- User authentication system (Fortify or custom)

## Inputs
- Relying Party configuration (name, domain ID, origin)
- User verification requirement (required vs discouraged)
- Livewire component customization requirements
- Password fallback strategy

## Workflow (numbered)
1. Install `spatie/laravel-passkeys` via Composer
2. Publish config and migrations: `php artisan vendor:publish --tag=passkeys-config --tag=passkeys-migrations`
3. Run migrations: `php artisan migrate`
4. Configure `config/passkeys.php` with RP name, domain ID, and origin
5. Publish Livewire views for customization: `php artisan vendor:publish --tag=passkeys-views`
6. Add Livewire components to auth views: `<livewire:passkeys::register />`, `<livewire:passkeys::authenticate />`, `<livewire:passkeys::manage />`
7. Customize published components to match design system
8. Maintain password fallback alongside passkey authentication
9. Ensure HTTPS in all environments (WebAuthn mandatory)
10. Set user verification to `required` in production

## Validation Checklist
- [ ] `spatie/laravel-passkeys` installed and configured
- [ ] RP name, ID, and origin configured correctly
- [ ] HTTPS enabled in all environments
- [ ] Livewire components published and customized
- [ ] Password fallback authentication maintained
- [ ] User verification set to `required` for production
- [ ] Passkey registration and login tested in major browsers

## Common Failures
- Using Spatie Passkeys for non-Livewire frontend (React/Vue — use laravel/passkeys)
- Making passkeys the only auth method (users without WebAuthn devices locked out)
- Not configuring HTTPS (WebAuthn API unavailable)
- Not customizing published components (generic UI mismatched with app design)

## Decision Points
- **spatie/laravel-passkeys vs laravel/passkeys**: Spatie for Livewire; first-party for React/Vue/Svelte
- **User verification**: `required` (biometric/PIN) for production; `discouraged` only for low-security
- **Component customization**: Always publish and customize to match design system

## Performance Considerations
- WebAuthn ceremonies: ~500ms for biometric verification
- Public key storage: ~100-200 bytes per key
- No server-side hashing (public key cryptography replaces passwords)

## Security Considerations
- Phishing resistance: passkeys scoped to RP domain
- Private key never leaves user's device
- Production-tested (powers Mailcoach) — more mature than first-party alternative
- User verification `required` ensures biometric/PIN confirmation

## Related Rules (from 05-rules.md)
- Use Spatie Passkeys for Livewire Projects, Laravel/Passkeys for Other Stacks
- Maintain Password Fallback Alongside Passkeys
- Publish and Customize Livewire Components to Match Design
- Configure HTTPS in All Environments for WebAuthn
- Enable User Verification Requiring Biometric/PIN

## Related Skills
- Implement First-Party Passkeys/WebAuthn
- Implement WebAuthn Ceremonies (attestation, assertion)
- Customize Fortify Headless Auth Backend
- Configure Livewire Components

## Success Criteria
- Users can register passkeys via biometric/PIN using Livewire component
- Users can authenticate with passkey instead of password
- Password fallback works for non-WebAuthn users
- Livewire components customized to app design
- HTTPS enforced for all WebAuthn ceremonies
- User verification requires biometric/PIN confirmation
