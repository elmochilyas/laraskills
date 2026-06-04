# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** First-Party Passkeys/WebAuthn
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | First-Party vs Spatie Passkeys Package | Choosing passkey implementation | maintainability, security, architectural |
| 2 | Passkeys as Password Replacement vs Additive | Primary vs complementary auth method | user-experience, security |
| 3 | User Verification Requirement Level | Biometric/PIN rigor during WebAuthn ceremony | security, user-experience |

---

# Architecture-Level Decision Trees

---

## First-Party vs Spatie Passkeys Package

---

## Decision Context

Choosing between `laravel/passkeys` (first-party, April 2026, pre-1.0) and `spatie/laravel-passkeys` (community, more mature) for WebAuthn passkey authentication.

---

## Decision Criteria

* maintainability
* security
* architectural

---

## Decision Tree

Is your frontend built with React, Vue, or Svelte (npm-based)?
↓
YES → Is pre-1.0 package risk acceptable for your timeline?
    YES → `laravel/passkeys` (first-party, official npm client `@laravel/passkeys`)
    NO → `spatie/laravel-passkeys` (more mature, broader community testing)
NO → Is your frontend built with Livewire?
    YES → `spatie/laravel-passkeys` (Livewire support, more PHP-ecosystem oriented)
    NO → Evaluate frontend framework compatibility

Do you need tight Fortify integration?
↓
YES → `laravel/passkeys` (built for Fortify compatibility)
NO → Either package works

Do you need production stability guarantees?
↓
YES → `spatie/laravel-passkeys` (longer track record, semver stability)
NO → `laravel/passkeys` (newer, first-party ecosystem alignment)

---

## Rationale

`laravel/passkeys` is the first-party package (April 2026, v0.2.x) with an official npm client. It integrates directly with Fortify and follows Laravel conventions. However, it's pre-1.0 with potential API changes. `spatie/laravel-passkeys` is more mature, has broader community testing, and better Livewire support. Spatie packages are generally well-maintained but lack the first-party ecosystem alignment.

---

## Recommended Default

**Default:** `laravel/passkeys` for React/Vue/Svelte apps with npm frontend; `spatie/laravel-passkeys` for Livewire apps
**Reason:** First-party package offers better ecosystem integration for npm-based apps. Spatie's package has better Livewire support and more production maturity for PHP-centric stacks.

---

## Risks Of Wrong Choice

- `laravel/passkeys` in production during pre-1.0: breaking API changes on update, limited community support
- `spatie/laravel-passkeys` for npm frontend: less integrated npm client, potential ceremony issues
- No passkeys package: users must rely solely on passwords, no passwordless experience

---

## Related Rules

- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Pin Exact Version of laravel/passkeys (05-rules.md)
- Use the Official npm Client for Browser Ceremonies (05-rules.md)

---

## Related Skills

- Implement First-Party Passkeys/WebAuthn Passwordless Authentication (06-skills.md)
- Configure Spatie Passkeys/WebAuthn (Livewire alternative) (06-skills.md)

---

## Passkeys as Password Replacement vs Additive

---

## Decision Context

Whether to offer passkeys as the sole authentication method (passwordless) or as an additional option alongside passwords.

---

## Decision Criteria

* user-experience
* security

---

## Decision Tree

Do all users have WebAuthn-capable devices with modern browsers?
↓
YES → Are users in an enterprise environment with managed devices?
    YES → Passkeys as primary, password as fallback (enterprise-managed)
    NO → Passkeys as additive option (consumer devices vary)
NO → Passkeys as additive option (password fallback required)

Do you have a way to enroll users without passwords (invitation-based)?
↓
YES → Passkey-first registration (invite → register passkey → no password needed)
NO → Passwords as primary enrollment, passkeys as optional upgrade

Are you supporting shared or public computers?
↓
YES → Passkeys not suitable (shared devices without biometric enrollment)
NO → Passkeys appropriate for personal devices

---

## Rationale

Passkeys require modern browsers, HTTPS, and platform biometric support. Not all users or environments meet these requirements. Enterprise-managed devices are more predictable, making passkey-first or passkey-only viable. Consumer applications should always maintain password fallback to avoid user lockout. Passkeys as an additive option provides the best UX upgrade path.

---

## Recommended Default

**Default:** Passkeys as additive authentication alongside passwords; password fallback always maintained
**Reason:** Universal WebAuthn support does not exist across all browsers, devices, and environments. Passkeys as an additive option provides passwordless convenience for capable users while maintaining accessibility for all.

---

## Risks Of Wrong Choice

- Passkeys as sole method: user lockout for WebAuthn-incompatible devices, accessibility issues
- Passwords only: no passwordless experience, password management overhead
- Passkey-first without fallback: support escalations for device loss scenarios

---

## Related Rules

- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Serve HTTPS in All Environments for WebAuthn (05-rules.md)

---

## Related Skills

- Implement First-Party Passkeys/WebAuthn Passwordless Authentication (06-skills.md)

---

## User Verification Requirement Level

---

## Decision Context

Setting the WebAuthn `userVerification` requirement — whether the authenticator must verify the user with biometric/PIN (`required`) or may skip verification (`discouraged`).

---

## Decision Criteria

* security
* user-experience

---

## Decision Tree

Is this a high-security application (finance, healthcare, admin panel)?
↓
YES → `userVerification: 'required'` (biometric/PIN mandatory)
NO → Is this a low-security context (read-only content, public info)?
    YES → `userVerification: 'preferred'` (use biometric if available, skip if not)
    NO → Is user experience the top priority?
        YES → `userVerification: 'preferred'` (balance security and UX)
        NO → `userVerification: 'required'` (default secure option)

Does the authenticator platform support user verification?
↓
YES → Use `required` or `preferred` based on context
NO → `preferred` (falls back gracefully if not supported)

---

## Rationale

`required` ensures that every authentication ceremony includes biometric or PIN verification, providing strong assurance that the legitimate device user is present. `preferred` allows the authenticator to decide — using biometric when available, falling back to device presence (less secure but faster). `discouraged` should rarely be used as it skips user verification entirely.

---

## Recommended Default

**Default:** `userVerification: 'preferred'` for consumer apps; `'required'` for admin/security-sensitive apps
**Reason:** `preferred` balances security with UX — most modern devices support biometric verification and will use it. For admin panels or security-sensitive sections, `required` ensures no authentication happens without explicit user verification.

---

## Risks Of Wrong Choice

- `discouraged` for production: no biometric/PIN check, any device possessor can authenticate
- `required` for all users: older devices without biometric may fail ceremonies
- No user verification at all: passkey stored on device can be used by anyone with device access

---

## Related Rules

- Configure RP ID as Domain Without Port or Path (05-rules.md)
- Serve HTTPS in All Environments for WebAuthn (05-rules.md)

---

## Related Skills

- Implement First-Party Passkeys/WebAuthn Passwordless Authentication (06-skills.md)
- Implement WebAuthn Ceremonies (attestation, assertion) (06-skills.md)
