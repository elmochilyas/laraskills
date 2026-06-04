# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** WebAuthn Ceremonies (Attestation, Assertion)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Package vs Manual Ceremony Implementation | Using existing packages vs implementing WebAuthn manually | security, maintainability |
| 2 | User Verification Requirement | Level of user verification during ceremonies | security, user-experience |
| 3 | Attestation Type | Consumer vs enterprise attestation verification | security, architectural |

---

# Architecture-Level Decision Trees

---

## Package vs Manual Ceremony Implementation

---

## Decision Context

Whether to use an existing WebAuthn package (`laravel/passkeys`, `spatie/laravel-passkeys`, `laragear/webauthn`) or implement WebAuthn attestation and assertion ceremonies manually.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does an existing package meet all WebAuthn requirements?
↓
YES → Use existing package (recommended)
NO → Are the missing requirements essential (cannot compromise)?
    YES → Evaluate whether to extend an existing package or implement manually
    NO → Use existing package with workarounds

Is this an enterprise environment requiring custom attestation verification?
↓
YES → Can an existing package be extended for custom attestation?
    YES → Extend existing package (lighter approach)
    NO → Implement ceremony manually with enterprise attestation support
NO → Use existing package (consumer apps do not need attestation verification)

Is the team experienced with WebAuthn protocol and public key cryptography?
↓
YES → Manual implementation is possible (not recommended unless necessary)
NO → Use existing package (protocol is complex — avoid manual implementation)

---

## Rationale

WebAuthn ceremonies involve complex cryptographic operations: challenge generation, origin validation, signature verification, counter tracking, and attestation parsing. Existing packages handle browser compatibility, edge cases, and security best practices. Manual implementation is error-prone and only justified for enterprise attestation verification not supported by any package.

---

## Recommended Default

**Default:** Use existing package (`laravel/passkeys` or `spatie/laravel-passkeys`)
**Reason:** WebAuthn protocol complexity makes manual implementation risky. Existing packages handle ceremony logic, browser edge cases, and security considerations. Manual implementation should be the exception, not the rule.

---

## Risks Of Wrong Choice

- Manual implementation: protocol bugs, security vulnerabilities, browser incompatibility, missing edge cases
- Package with insufficient enterprise attestation: missing aaguid verification for enterprise compliance
- No WebAuthn at all: users cannot use passwordless authentication

---

## Related Rules

- Use Existing WebAuthn Packages Rather Than Manual Ceremony Implementation (05-rules.md)
- Generate Unique, Cryptographically Random Challenges Per Ceremony (05-rules.md)
- Track Sign Count for Clone Detection (05-rules.md)

---

## Related Skills

- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)
- Implement First-Party Passkeys/WebAuthn (06-skills.md)

---

## User Verification Requirement

---

## Decision Context

Setting the WebAuthn `userVerification` requirement during attestation and assertion — whether the user must actively verify with biometric/PIN (`required`) or just prove device possession (`discouraged`).

---

## Decision Criteria

* security
* user-experience

---

## Decision Tree

Is this a high-security application (finance, healthcare, admin panel)?
↓
YES → `userVerification: 'required'` (biometric or PIN mandatory for every ceremony)
NO → Is this a consumer application where UX is critical?
    YES → `userVerification: 'preferred'` (use biometric if available, skip if not)
    NO → `userVerification: 'required'` (default secure option)

Are users in a controlled environment (enterprise-managed devices)?
↓
YES → `userVerification: 'required'` (devices support biometric/PIN)
NO → `userVerification: 'preferred'` (some devices may not have biometric)

Is the ceremony for re-authentication (confirming identity for sensitive actions)?
↓
YES → `userVerification: 'required'` (high assurance needed)
NO → Standard login ceremonies

---

## Rationale

`required` ensures every authentication ceremony includes biometric or PIN verification, providing strong two-factor-like security. `preferred` allows the authenticator to decide — using biometric on capable devices, falling back to device presence on others. `discouraged` should only be used for non-sensitive actions or when UX friction must be minimized.

---

## Recommended Default

**Default:** `userVerification: 'required'` for production; `'preferred'` for consumer UX optimization
**Reason:** `required` provides strong assurance that the legitimate device user is present. The UX impact is minimal (biometric verification takes <1 second on modern devices). `preferred` is acceptable for consumer apps where some users may not have biometric sensors.

---

## Risks Of Wrong Choice

- `discouraged` for production: any possessor of the device can authenticate, no user verification
- `required` for all users: ceremonies may fail on devices without biometric/PIN support
- Not respecting user verification: defeating the purpose of WebAuthn's strong authentication

---

## Related Rules

- Respect User Verification Requirement (05-rules.md)
- Generate Unique, Cryptographically Random Challenges Per Ceremony (05-rules.md)
- Validate Origin Against RP ID During Both Ceremonies (05-rules.md)

---

## Related Skills

- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)

---

## Attestation Type

---

## Decision Context

Choosing the attestation type during WebAuthn registration — whether to verify the authenticator model (`direct`, `enterprise`) or skip attestation verification (`none`).

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Is this an enterprise deployment requiring specific authenticator hardware (e.g., FIPS-certified tokens)?
↓
YES → `attestation: 'direct'` or `'enterprise'` (verify aaguid against trusted authenticator list)
NO → Is there a compliance requirement to log authenticator types used?
    YES → `attestation: 'direct'` (collect but optionally verify)
    NO → `attestation: 'none'` (skip attestation verification)

Do you need to ensure users only use platform authenticators (not external USB keys)?
↓
YES → Validate attestation type (`platform` vs `cross-platform`) in registration response
NO → No attestation restrictions

Is the user base using personal devices (BYOD)?
↓
YES → `attestation: 'none'` (attestation verification is invasive for personal devices)
NO → Enterprise devices → can enforce attestation

---

## Rationale

Attestation verification is enterprise-specific. Consumer apps should use `none` — attestation adds privacy concerns (authenticator metadata) and ceremony complexity. Enterprise deployments may require verifying the authenticator model (aaguid) against a list of approved security keys. The `enterprise` attestation type allows policy-controlled attestation for enterprise-managed devices.

---

## Recommended Default

**Default:** `attestation: 'none'` for consumer apps; `'direct'` with aaguid verification for enterprise
**Reason:** Consumer apps don't need to verify authenticator hardware — any WebAuthn-capable device is acceptable. Enterprise deployments may need to restrict to specific hardware security keys (e.g., YubiKey FIPS series).

---

## Risks Of Wrong Choice

- `none` for enterprise compliance: cannot restrict to approved authenticator hardware
- `direct` for consumer apps: privacy concerns (authenticator metadata collected), unnecessary ceremony failures
- No attestation verification but expecting it: authentication succeeds with unapproved authenticators
- Attestation failing without fallback: users with non-approved authenticators cannot register

---

## Related Rules

- Validate Origin Against RP ID During Both Ceremonies (05-rules.md)
- Use Attestation Statement Validation Only When RP Policy Requires It (05-rules.md)
- Track Sign Count for Clone Detection (05-rules.md)

---

## Related Skills

- Implement WebAuthn Ceremonies for Passwordless Authentication (06-skills.md)
- Implement First-Party Passkeys/WebAuthn (06-skills.md)
