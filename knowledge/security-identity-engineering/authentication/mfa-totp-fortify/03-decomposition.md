# Decomposition: mfa totp fortify

## Topic Overview

Fortify provides full server-side support for TOTP-based multi-factor authentication, including setup, confirmation, challenge, and recovery codes. When the `two-factor-authentication` feature is enabled in `config/fortify.php`, Fortify registers routes for enabling 2FA (generating QR code + setup key), confirming 2FA (first TOTP verification), challenging 2FA (verifying TOTP on login), and using recovery codes. The flow integrates with Fortify's authentication pipeline via `RedirectIfTwoFact...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
mfa-totp-fortify/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### mfa totp fortify
- **Purpose:** Fortify provides full server-side support for TOTP-based multi-factor authentication, including setup, confirmation, challenge, and recovery codes. When the `two-factor-authentication` feature is enabled in `config/fortify.php`, Fortify registers routes for enabling 2FA (generating QR code + setup key), confirming 2FA (first TOTP verification), challenging 2FA (verifying TOTP on login), and using recovery codes. The flow integrates with Fortify's authentication pipeline via `RedirectIfTwoFact...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Fortify headless auth backend, Auth guards/providers architecture, Related: First-party Passkeys/WebAuthn (alternative 2FA method), Fortify action pipeline, Advanced Follow-up: Custom TOTP implementation with `pragmarx/google2fa`, WebAuthn as second factor, and `APP_KEY` rotation procedures for encrypted data

## Dependency Graph
**Depends on:** Prerequisites: Fortify headless auth backend, Auth guards/providers architecture, Related: First-party Passkeys/WebAuthn (alternative 2FA method), Fortify action pipeline, Advanced Follow-up: Custom TOTP implementation with `pragmarx/google2fa`, WebAuthn as second factor, and `APP_KEY` rotation procedures for encrypted data
**Depended on by:** Knowledge units that leverage or extend mfa totp fortify patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for mfa totp fortify.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization