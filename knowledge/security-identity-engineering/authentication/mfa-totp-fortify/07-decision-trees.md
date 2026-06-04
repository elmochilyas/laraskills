# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** MFA/TOTP with Fortify
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | MFA Enforcement Strategy | Optional vs required MFA per role | security, architectural |
| 2 | MFA Method Selection | TOTP vs SMS vs WebAuthn/Passkeys | security, user-experience, maintainability |
| 3 | Recovery and Fallback Strategy | How users regain access when authenticator is lost | security, user-experience |

---

# Architecture-Level Decision Trees

---

## MFA Enforcement Strategy

---

## Decision Context

Determining whether MFA is optional, required, or role-based — and how to enforce it across the application.

---

## Decision Criteria

* security
* architectural
* user-experience

---

## Decision Tree

Is the application handling sensitive data (finance, healthcare, admin panels)?
↓
YES → Are there different user roles with varying privilege levels?
    YES → Role-based enforcement: MFA required for admin/privileged roles, optional for regular users
    NO → Universal MFA required for all users
NO → Is this a B2B enterprise application?
    YES → Role-based enforcement (admins required, optional for end users)
    NO → Is this a consumer-facing app with low security requirements?
        YES → Optional MFA (user choice)
        NO → Evaluate compliance requirements (SOC2, HIPAA, PCI DSS)

Are there compliance requirements mandating MFA?
↓
YES → Universal MFA required for affected user groups
NO → Evaluate by role and sensitivity

---

## Rationale

Role-based enforcement balances security and user experience. Admins and privileged roles are high-value targets requiring MFA enforcement. Regular users should have the choice unless compliance dictates universal enforcement. Universal MFA adds friction that may reduce conversion for consumer apps.

---

## Recommended Default

**Default:** Role-based enforcement — MFA required for admin/privileged roles, optional for regular users
**Reason:** This is the security industry standard. Admin accounts are high-value targets. Regular users can optionally enable MFA without forced friction. Compliance-ready for SOC2/HIPAA/PCI DSS.

---

## Risks Of Wrong Choice

- Optional for admins: admin accounts compromised via password-only attacks
- Universal required for consumer app: user friction, reduced conversion, support burden for lost authenticators
- No enforcement at all: no MFA adoption, weaker security posture across the board

---

## Related Rules

- Enforce MFA for Admin and Privileged Roles (05-rules.md)
- Require Password Confirmation for 2FA Setup Changes (05-rules.md)

---

## Related Skills

- Implement MFA/TOTP Two-Factor Authentication with Fortify (06-skills.md)

---

## MFA Method Selection

---

## Decision Context

Choosing the multifactor authentication method: TOTP (authenticator app), SMS-based codes, or WebAuthn/Passkeys (biometric/hardware).

---

## Decision Criteria

* security
* user-experience
* maintainability

---

## Decision Tree

Do users have smartphones capable of running authenticator apps (Google Authenticator, Authy, 1Password)?
↓
YES → TOTP (recommended)
NO → Do users have phone numbers for SMS delivery?
    YES → SMS (fallback — less secure but wider reach)
    NO → WebAuthn/Passkeys (hardware security keys or platform biometrics)

Is the application handling high-security data (finance, healthcare)?
↓
YES → WebAuthn/Passkeys (highest security) OR TOTP (acceptable)
NO → TOTP (best balance of security and usability)

Are you already implementing Passkeys/WebAuthn for passwordless login?
↓
YES → Use WebAuthn as MFA method (built-in device verification, no separate TOTP needed)
NO → TOTP (standard approach)

---

## Rationale

TOTP is the most balanced MFA method: no carrier dependency, no SIM-swap risk, works offline, widely supported. SMS is the least secure (SIM swapping, interception) but has the widest reach. WebAuthn/Passkeys offer phishing-resistant authentication but require hardware or platform support. Fortify natively supports TOTP but not SMS or WebAuthn — those require third-party packages or custom implementation.

---

## Recommended Default

**Default:** TOTP (authenticator app) as primary MFA method
**Reason:** Fortify provides native TOTP support with encrypted secret storage. TOTP is phishing-resistant (codes are time-bound), works offline, and has no carrier dependency. Most secure option readily available without additional packages.

---

## Risks Of Wrong Choice

- SMS-based 2FA: SIM-swap attacks, carrier dependency, interception, no offline support
- WebAuthn/Passkeys: requires hardware keys or platform support, not universally available
- No MFA at all: password-only authentication is insufficient for any production application

---

## Related Rules

- Prefer TOTP Over SMS-Based 2FA (05-rules.md)
- Rate-Limit TOTP Verification Attempts (05-rules.md)

---

## Related Skills

- Implement MFA/TOTP Two-Factor Authentication with Fortify (06-skills.md)
- Implement Passkeys/WebAuthn Authentication (06-skills.md)

---

## Recovery and Fallback Strategy

---

## Decision Context

How users regain access when they lose their authenticator device or cannot generate TOTP codes.

---

## Decision Criteria

* security
* user-experience

---

## Decision Tree

Does the user have their recovery codes (generated during 2FA setup)?
↓
YES → Single-use recovery code (self-service recovery)
NO → Can the user verify email ownership?
    YES → Email-based recovery (send recovery link, allow 2FA reset after link click)
    NO → Is there a support team available?
        YES → Support-assisted recovery (verify identity via KYC, issue new 2FA setup)
        NO → Account recovery impossible — user is locked out

Is the user locked out without recovery options?
↓
YES → Admin override (requires admin intervention with audit logging)
NO → User can self-recover

---

## Rationale

Recovery codes are the primary self-service recovery mechanism. Fortify generates 10 single-use hashed codes during 2FA setup. If codes are exhausted, email-based recovery is the secondary option (verify email ownership, allow 2FA reset). Support-assisted recovery is the last resort and should require identity verification and audit logging.

---

## Recommended Default

**Default:** Recovery codes (self-service) + email-based reset (secondary) + support intervention (last resort)
**Reason:** Defense in depth for account recovery. Self-service reduces support burden. Email verification provides a secure secondary channel. Support intervention with audit trail covers edge cases.

---

## Risks Of Wrong Choice

- No recovery codes: users permanently locked out when authenticator device is lost
- Recovery codes stored in plaintext: database compromise exposes recovery access
- Support recovery without verification: social engineering leads to account takeover
- No recovery flow at all: support tickets, account lockouts, user frustration

---

## Related Rules

- Store Recovery Codes Securely and Display Once (05-rules.md)
- Provide a Documented Recovery Flow for Lost Authenticator (05-rules.md)
- Log All 2FA Enable and Disable Events (05-rules.md)

---

## Related Skills

- Implement MFA/TOTP Two-Factor Authentication with Fortify (06-skills.md)
- Audit Logging with Spatie Activitylog (06-skills.md)
