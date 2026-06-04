# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Package Auto-Discovery
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Auto-discovery vs manual registration? | Boot order, security, auditability | Auto-discovery (standard for 95%+ of packages) |
| 2 | Application-level: opt-out specific vs global? | Boot order conflicts, simplicity | Opt-out specific packages; avoid global `*` |

---

# Architecture-Level Decision Trees

---

## Decision 1: Auto-Discovery vs Manual Registration?

---

## Decision Context

Package providers can be registered automatically via Composer's `extra.laravel` or manually in `config/app.php`. Auto-discovery is the standard but has exceptions for boot order and security.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the package a distribution package for general use?
↓
YES → **Use auto-discovery** — it's the standard and expected behavior
NO → ↓
Does the package have specific boot order requirements?
↓
YES → Manual registration with documented boot order in README
NO → ↓
Is the package security-sensitive where explicit registration is desired for auditability?
↓
YES → Manual registration; document that this is a security decision
NO → ↓
Is the application using Lumen (which doesn't support auto-discovery)?
↓
YES → Manual registration; note Lumen compatibility in docs
NO → **Use auto-discovery** — standard for all Laravel packages
Regardless:
- Auto-discovered providers with environment-specific logic use `runningInConsole()` guards
- Dev-only packages should wrap boot logic in `app()->environment()` checks
- Always include `extra.laravel.providers` in composer.json

---

## Rationale

Auto-discovery eliminates manual setup friction. The exceptions are narrow: boot order dependencies, security-sensitive packages where explicit opt-in is desired, and Lumen applications which don't support the feature.

---

## Recommended Default

**Default:** Auto-discovery via `extra.laravel.providers` in composer.json
**Reason:** Standard behavior for 95%+ of Laravel packages; eliminates manual registration friction

---

## Risks Of Wrong Choice

- **Manual registration for all packages:** Developer friction; easy to forget packages in config/app.php
- **Auto-discovery with boot order issues:** Silent failures when providers depend on specific ordering

---

## Related Rules

- TEMPLATE-RULE-001: Limit to 3-5 templates
- TEMPLATE-RULE-002: Parameterize, don't hardcode

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Application-Level — Opt-Out Specific vs Global `*`?

---

## Decision Context

Applications can opt out of auto-discovery for specific packages or globally disable it with `*`. The choice affects maintenance burden and package management.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Why are you considering opting out of auto-discovery?
↓
**Boot order conflicts with specific packages**
↓
Opt out only those specific packages; register them manually in correct order
↕
**Security concerns with specific packages**
↓
Opt out only those specific packages; document security rationale
↕
**General preference for explicit registration**
↓
Avoid global `*` — you'll forget to register some packages manually. Opt out specific packages only as needed.

---

## Rationale

Global opt-out (`dont-discover: ["*"]`) eliminates all auto-discovery convenience and requires manually tracking every package's provider. This creates maintenance burden and is error-prone. Opting out specific packages that actually need special handling is the better approach.

---

## Recommended Default

**Default:** Use auto-discovery for all packages; opt out only specific problematic packages
**Reason:** Global opt-out creates maintenance burden and risks forgotten manual registrations

---

## Risks Of Wrong Choice

- **Global `*` opt-out:** Forgot to register a package's provider; features silently don't work
- **No opt-out when needed:** Boot order failures or security concerns from auto-discovered providers

---

## Related Rules

- TEMPLATE-RULE-004: Version templates independently
- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

