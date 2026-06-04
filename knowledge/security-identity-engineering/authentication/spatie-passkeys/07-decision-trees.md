# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authentication Systems
**Knowledge Unit:** Spatie Passkeys/WebAuthn
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Spatie vs First-Party Passkeys Package | Choosing passkey implementation for Laravel | architectural, maintainability |
| 2 | Component Customization Depth | How much to customize Spatie's Livewire components | maintainability, user-experience |
| 3 | Livewire Stack Compatibility | Whether Spatie Passkeys fits the frontend stack | architectural |

---

# Architecture-Level Decision Trees

---

## Spatie vs First-Party Passkeys Package

---

## Decision Context

Choosing between `spatie/laravel-passkeys` (Livewire-native, mature) and `laravel/passkeys` (first-party, stack-agnostic, pre-1.0) for WebAuthn passkey authentication.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is your frontend built with Livewire?
↓
YES → Spatie passkeys (pre-built Livewire components, more mature)
NO → Is your frontend React, Vue, or Svelte (npm-based)?
    YES → First-party laravel/passkeys (npm client `@laravel/passkeys`)
    NO → Is your frontend a non-Livewire Blade/Tall stack?
        YES → First-party laravel/passkeys (stack-agnostic, no Livewire dependency)
        NO → Evaluate frontend framework compatibility

Is production stability a primary concern?
↓
YES → Spatie passkeys (production-tested in Mailcoach, semver stable)
NO → First-party laravel/passkeys (newer, pre-1.0 but official ecosystem alignment)

Is the Spatie ecosystem already in use?
↓
YES → Spatie passkeys (consistent with existing Spatie packages)
NO → Either package works

---

## Rationale

Spatie's package is the better choice for Livewire apps — it provides ready-to-use Livewire components for passkey registration, authentication, and management. First-party `laravel/passkeys` is stack-agnostic with an npm client, making it the better choice for non-Livewire frontends. Spatie's package is more mature and production-tested; the first-party package is newer (v0.2.x) but aligns with the official Laravel ecosystem.

---

## Recommended Default

**Default:** Spatie passkeys for Livewire apps; first-party `laravel/passkeys` for React/Vue/Svelte apps
**Reason:** Stack alignment matters. Spatie's Livewire components provide immediate UI for Livewire projects. The first-party package's npm client is better suited for non-Livewire frameworks.

---

## Risks Of Wrong Choice

- Spatie for React: Livewire components are unusable, must build custom UI anyway
- First-party for Livewire: no Livewire components, must integrate npm client with Livewire
- Neither: users must rely solely on passwords, no passwordless option

---

## Related Rules

- Use Spatie Passkeys for Livewire Projects, Laravel/Passkeys for Other Stacks (05-rules.md)
- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Publish and Customize Livewire Components to Match Design (05-rules.md)
- Configure HTTPS in All Environments for WebAuthn (05-rules.md)

---

## Related Skills

- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)
- Implement First-Party Passkeys/WebAuthn (06-skills.md)

---

## Component Customization Depth

---

## Decision Context

How much to customize Spatie's published Livewire components — use defaults, light styling, or full override.

---

## Decision Criteria

* maintainability
* user-experience

---

## Decision Tree

Does the application have a custom design system with specific UI patterns?
↓
YES → Publish and customize components fully (match app design exactly)
NO → Do the default components approximately match the app's styling?
    YES → Light customization (CSS overrides, minor template adjustments)
    NO → Publish and customize components fully

Is the Spatie component markup compatible with your frontend framework?
↓
YES → Publish and customize templates (Blade customization)
NO → Override components entirely (create custom Livewire components using Spatie's backend)

Do you need translations or localized text in the passkey UI?
↓
YES → Publish and customize component views for translations
NO → Default text may be sufficient

---

## Rationale

Spatie's default components have generic styling that may not match a custom design system. Publishing the views (`passkeys-views` tag) allows template-level customization while keeping the backend logic. For deep UI changes, override the components entirely. For simple styling adjustments, CSS overrides may suffice without publishing.

---

## Recommended Default

**Default:** Publish and customize Livewire components to match the app's design system
**Reason:** Generic passkey UI can look out of place in a custom-designed application. Publishing provides full control over markup while maintaining Spatie's backend logic. The customization cost is low compared to the UX benefit.

---

## Risks Of Wrong Choice

- Using default components: generic UI mismatch, unprofessional appearance
- Full override without publishing: duplicating backend logic, missing Spatie updates
- No customization: passkey UI looks different from rest of application

---

## Related Rules

- Publish and Customize Livewire Components to Match Design (05-rules.md)
- Enable User Verification Requiring Biometric/PIN (05-rules.md)
- Configure HTTPS in All Environments for WebAuthn (05-rules.md)

---

## Related Skills

- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)
- Configure Livewire Components (06-skills.md)

---

## Livewire Stack Compatibility

---

## Decision Context

Whether Spatie Passkeys is the right choice given the frontend technology stack and Livewire usage pattern.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is Livewire installed in the project?
↓
YES → Is Livewire used for the authentication UI?
    YES → Spatie Passkeys is a good fit (Livewire components for auth)
    NO → Can auth be migrated to Livewire?
        YES → Migrate auth to Livewire for Spatie Passkeys compatibility
        NO → Consider first-party passkeys (non-Livewire auth)
NO → Spatie Passkeys is not the right choice — use first-party laravel/passkeys

Is the project a full TALL stack (Tailwind, Alpine, Livewire, Laravel)?
↓
YES → Spatie Passkeys is ideal (perfect stack alignment)
NO → Is this a partial Livewire project?
    YES → Evaluate whether Livewire passkey components conflict with non-Livewire auth sections
    NO → First-party passkeys

---

## Rationale

Spatie Passkeys is designed for Livewire applications. If the project doesn't use Livewire for the auth UI, the pre-built components are less valuable. A TALL stack project gets maximum benefit from Spatie's ready-to-use Livewire components. For non-Livewire projects, the first-party package is the better choice.

---

## Recommended Default

**Default:** Spatie Passkeys only when Livewire is the authentication UI framework; first-party passkeys otherwise
**Reason:** Spatie's value proposition is pre-built Livewire components. Without Livewire, the first-party package provides more flexibility and avoids the Livewire dependency.

---

## Risks Of Wrong Choice

- Spatie in non-Livewire app: must install Livewire just for passkeys, unnecessary dependency
- First-party in Livewire app: missing Livewire integration, must build custom UI
- Neither: no passwordless auth capability

---

## Related Rules

- Use Spatie Passkeys for Livewire Projects, Laravel/Passkeys for Other Stacks (05-rules.md)
- Maintain Password Fallback Alongside Passkeys (05-rules.md)
- Configure HTTPS in All Environments for WebAuthn (05-rules.md)

---

## Related Skills

- Configure Spatie Passkeys/WebAuthn for Livewire-Based Passwordless Auth (06-skills.md)
- Implement First-Party Passkeys/WebAuthn (06-skills.md)
