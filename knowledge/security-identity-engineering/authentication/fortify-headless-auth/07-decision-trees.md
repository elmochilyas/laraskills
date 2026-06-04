# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Fortify Headless Auth Backend
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Fortify vs Breeze vs Manual Auth | Choosing auth backend approach | architectural, maintainability, security |
| 2 | Features to Enable | Selecting which Fortify features to activate | security, architectural |
| 3 | Action Customization Strategy | When and how to override Fortify actions | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## Fortify vs Breeze vs Manual Auth

---

## Decision Context

Choosing the authentication implementation approach: Fortify (headless backend), Breeze (scaffolded UI + controllers), or manual controllers.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Do you need a custom frontend UI (React, Vue, Svelte, custom Livewire)?
↓
YES → Fortify (headless — provides backend only)
NO → Is this a rapid prototype or simple app?
    YES → Breeze (scaffolded controllers + views, minimal setup)
    NO → Do you need full control over auth controllers?
        YES → Manual auth controllers (no package dependency)
        NO → Breeze (opinionated but faster)

Are you using a Laravel Starter Kit?
↓
YES → Fortify (Starter Kits ship with Fortify as backend)
NO → Evaluate above

Do you need 2FA, email verification, or password confirmation?
↓
YES → Fortify (built-in features)
NO → Evaluate Breeze or manual

---

## Rationale

Fortify provides upgrade-safe authentication through its action pattern — customizations survive composer updates. Breeze publishes controllers directly, making customizations visible but requiring manual update management. Manual auth gives full control but requires implementing security features (rate limiting, 2FA, email verification) from scratch.

---

## Recommended Default

**Default:** Fortify for any app with a custom frontend; Breeze for simple Livewire/Blade apps
**Reason:** Fortify is the modern standard for Laravel auth — upgrade-safe, feature-rich, and the backend for all current Starter Kits. Breeze is faster for simple Blade apps without 2FA needs.

---

## Risks Of Wrong Choice

- Manual auth without Fortify: missing rate limiting, 2FA, email verification — reimplementing security features
- Breeze for custom frontend: published controllers must be manually updated on Laravel upgrades
- Fortify for simple scaffold: extra dependency, must build UI that Breeze provides for free

---

## Related Rules

- Customize Fortify via Action Overrides, Never Vendor Files (05-rules.md)
- Enable Only Required Fortify Features (05-rules.md)
- Never Disable Login Rate Limiting in Production (05-rules.md)

---

## Related Skills

- Customize Fortify Headless Auth Backend for Custom Frontend Authentication (06-skills.md)
- Configure Laravel Starter Kits (06-skills.md)

---

## Features to Enable

---

## Decision Context

Selecting which Fortify features to enable in `config/fortify.php` — registration, password reset, email verification, 2FA, profile updates.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Does the app need user registration?
↓
YES → Enable `Features::registration()`
NO → Disable registration

Does the app need email verification before access?
↓
YES → Enable `Features::emailVerification()` — ensure mail is configured
NO → Skip email verification

Does the app need password reset (forgot password)?
↓
YES → Enable `Features::resetPasswords()`
NO → Disable password reset

Does the app need two-factor authentication?
↓
YES → Enable `Features::twoFactorAuthentication(['confirm' => true, 'confirmPassword' => true])`
NO → Skip 2FA

Does the app allow profile information updates?
↓
YES → Enable `Features::updateProfileInformation()`
NO → Disable profile updates

---

## Rationale

Each enabled feature adds routes and attack surface. Unnecessary features should be disabled. 2FA must always use `confirmPassword` to prevent session-based 2FA removal. Email verification requires working mail configuration.

---

## Recommended Default

**Default:** Enable only registration + login + password reset for standard apps; add email verification + 2FA for security-sensitive apps
**Reason:** Minimize attack surface by enabling only what the application actually uses. Add features incrementally as requirements grow.

---

## Risks Of Wrong Choice

- Enabling all features: unnecessary routes exposed, larger attack surface
- Enabling email verification without mail config: users cannot complete registration
- Disabling 2FA for admin apps: compliance violations (SOC2, HIPAA)
- Enabling 2FA without confirmPassword: session hijacker can disable 2FA

---

## Related Rules

- Enable Only Required Fortify Features (05-rules.md)
- Require Password Confirmation for 2FA Setup Changes (05-rules.md)
- Configure Mail Before Enabling Email Verification (05-rules.md)

---

## Related Skills

- Customize Fortify Headless Auth Backend for Custom Frontend Authentication (06-skills.md)
- Implement MFA/TOTP with Fortify (06-skills.md)

---

## Action Customization Strategy

---

## Decision Context

Deciding when and how to override Fortify's default action classes (CreateNewUser, UpdateUserPassword, etc.).

---

## Decision Criteria

* maintainability
* architectural
* security

---

## Decision Tree

Do you need custom logic during user creation (e.g., assign default role, send welcome email)?
↓
YES → Override `CreateNewUser` action
NO → Use Fortify's default

Do you need custom password validation rules (e.g., custom regex, breach check)?
↓
YES → Override `UpdateUserPassword` action
NO → Use Fortify's default

Do you need custom profile update logic (e.g., validate custom fields)?
↓
YES → Override `UpdateUserProfileInformation` action
NO → Use Fortify's default

Do you need custom password reset behavior (e.g., log password changes)?
↓
YES → Override `ResetUserPassword` action
NO → Use Fortify's default

Do you need custom 2FA behavior (e.g., notify on 2FA enable)?
↓
YES → Override `TwoFactorAuthentication` action
NO → Use Fortify's default

---

## Rationale

Fortify's action pattern is designed for surgical overrides. Override only the actions where custom behavior is needed. Using defaults for standard behavior reduces maintenance burden. Always extend the base Fortify action class rather than reimplementing from scratch.

---

## Recommended Default

**Default:** Override only `CreateNewUser` (for role assignment) and `UpdateUserPassword` (for password validation); use defaults for everything else
**Reason:** `CreateNewUser` almost always needs custom logic (role assignment, welcome flow). `UpdateUserPassword` commonly needs custom rules. Other actions typically work with defaults.

---

## Risks Of Wrong Choice

- Overriding every action unnecessarily: increased maintenance, potential drift from Fortify defaults
- Not overriding CreateNewUser: missing role assignment, welcome email, or custom validation
- Editing vendor files instead of overriding: changes lost on `composer update`

---

## Related Rules

- Customize Fortify via Action Overrides, Never Vendor Files (05-rules.md)
- Apply Password Confirmation for Sensitive Auth Actions (05-rules.md)

---

## Related Skills

- Customize Fortify Headless Auth Backend for Custom Frontend Authentication (06-skills.md)
- Implement MFA/TOTP with Fortify (06-skills.md)
