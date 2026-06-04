# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Laravel Breeze Auth Scaffolding (Legacy Context)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Breeze vs Starter Kit for New Laravel Projects | Auth scaffolding selection | architectural, security |
| 2 | Breeze Migration Strategy | How to migrate an existing Breeze project | migration, maintainability |

---

# Architecture-Level Decision Trees

---

## Breeze vs Starter Kit for New Laravel Projects

---

## Decision Context

Whether to use Laravel Breeze (deprecated published-controller pattern) or the current stack-specific Starter Kits (Fortify action pattern) for a new Laravel project.

---

## Decision Criteria

* architectural
* security

---

## Decision Tree

Is this a new project (Laravel 12/13+)?
↓
YES → Use Starter Kits (Breeze is deprecated and requires manual security patches)
NO → Existing Breeze project on Laravel 11.x — continue using Breeze until next major upgrade

Which frontend stack is needed?
↓
React, Vue, Svelte, or Livewire → Starter Kits (one per stack, installs Fortify + Sanctum + Passkeys)
Blade only → Starter Kit Livewire stack or custom Fortify setup

Is upgrade-safe authentication required?
↓
YES → Starter Kits (Fortify action pattern — patches applied via `composer update`)
NO → Breeze acceptable (but patches must be applied manually to published controllers)

How important is automatic security patch adoption?
↓
Critical → Starter Kits (patches via Composer — no manual effort)
Low → Breeze acceptable (manual patch tracking required — high maintenance burden)

---

## Rationale

Breeze is deprecated for new Laravel projects. Starter Kits provide the same auth capabilities (login, registration, password reset, email verification, profile management) with upgrade-safe Fortify actions instead of published controllers. The only advantage Breeze ever had was full code ownership — which is outweighed by the security burden of manual patch application. Starter Kits are the only correct choice for Laravel 12/13+.

---

## Recommended Default

**Default:** Never use Breeze for new Laravel projects; always use stack-specific Starter Kits (React, Vue, Svelte, Livewire) with Fortify + Sanctum + Passkeys
**Reason:** Breeze requires manual security patch application to published controllers. Starter Kits use Fortify's action pattern — security patches are applied automatically via `composer update`. There is no valid reason to choose Breeze for a new project.

---

## Risks Of Wrong Choice

- Using Breeze for new Laravel 12+ project: deprecated scaffolding, manual patches, increasing technical debt
- Modifying Breeze controllers extensively: migration to Starter Kits becomes more difficult
- Assuming Breeze auto-updates: published controllers do not receive security patches
- Staying on Breeze indefinitely: eventual security gap when Laravel stops supporting the pattern

---

## Related Rules

- Never Use Breeze for New Laravel Projects (05-rules.md)
- Prefer Fortify Actions Over Direct Controller Modification (05-rules.md)

---

## Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md) — legacy only

---

## Breeze Migration Strategy

---

## Decision Context

How to migrate an existing Breeze-based application to the current Starter Kit pattern (Fortify + Starter Kit frontend).

---

## Decision Criteria

* migration
* maintainability

---

## Decision Tree

Is the project on Laravel 11.x or 12/13+?
↓
11.x → Plan migration during the next Laravel version upgrade (11→12)
12/13+ → Migrate sooner — Breeze controllers are increasingly out of sync with Laravel's auth patterns

How heavily are the Breeze controllers customized?
↓
Minimally → Straightforward migration (replace Breeze controllers with Fortify configuration)
Heavily → Extract custom logic into Fortify action classes first, then migrate the frontend

Are there custom auth flows not covered by Breeze?
↓
YES → Implement as Fortify actions before removing Breeze controllers
NO → Migration is simpler — default Fortify actions likely cover all existing functionality

Is there a Staging environment for testing?
↓
YES → Safe to migrate and verify end-to-end auth flows before production
NO → Create staging first — auth migration risk is high (users cannot log in)

---

## Rationale

The migration path is: Breeze controllers → Fortify backend (headless) → Starter Kit frontend. First, install Fortify and configure it to match the existing Breeze behavior. Then, remove Breeze controllers and routes, pointing to Fortify's routes. Finally, replace Breeze views with Starter Kit frontend scaffolding. The migration should be done in a feature branch with thorough testing of all auth flows — login, registration, password reset, email verification, and profile management.

---

## Recommended Default

**Default:** Install Fortify, extract custom Breeze logic into Fortify actions, remove Breeze controllers, route through Fortify, then optionally replace frontend with Starter Kit scaffolding
**Reason:** The two-phase migration (backend then frontend) minimizes risk. Fortify actions preserve custom behavior. Once the backend is stable on Fortify, the frontend can be replaced independently without affecting authentication logic.

---

## Risks Of Wrong Choice

- Removing Breeze without Fortify ready: authentication breaks entirely
- Replacing frontend before backend migration is verified: difficult to debug which layer has issues
- Not testing all auth flows: password reset failing after migration is a support nightmare
- Skipping staging: production auth outage affects all users

---

## Related Rules

- Never Use Breeze for New Laravel Projects (05-rules.md)
- Prefer Fortify Actions Over Direct Controller Modification (05-rules.md)

---

## Related Skills

- Scaffold Authentication with Laravel Breeze (06-skills.md) — legacy only
