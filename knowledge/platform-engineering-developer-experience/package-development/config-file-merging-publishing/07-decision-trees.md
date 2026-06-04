# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Config File Merging & Publishing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Where to call mergeConfigFrom()? | Provider lifecycle timing | register() — never boot() |
| 2 | Should config be published? | Customization needs, complexity | Yes — for packages with 5+ options |

---

# Architecture-Level Decision Trees

---

## Decision 1: Where to Call mergeConfigFrom()?

---

## Decision Context

The `mergeConfigFrom()` method must be called in the service provider lifecycle phase where config is available and other providers can read it. The choice between `register()` and `boot()` determines whether other providers can access the package's defaults.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Does the package config need to be available to other service providers during their `boot()` phase?
↓
YES → **Call mergeConfigFrom() in register()** — this is the only correct choice
NO → ↓
Does your provider override `register()` directly?
↓
YES → Call `mergeConfigFrom()` before any bindings in `register()`
NO (using Spatie tools) → Spatie's `hasConfigFile()` handles this automatically in `register()`
Regardless:
- NEVER call mergeConfigFrom() in boot()
- Merging in boot() means the config is unavailable to other providers' boot() methods
- This is the single most common config bug in Laravel packages

---

## Rationale

Config merged in `boot()` is invisible to providers that boot before yours. Since Laravel runs all `register()` methods before any `boot()`, calling `mergeConfigFrom()` in `register()` ensures config is available to all providers regardless of boot order.

---

## Recommended Default

**Default:** `mergeConfigFrom()` in `register()`; never in `boot()`
**Reason:** Config must be available to all providers during their boot phase

---

## Risks Of Wrong Choice

- **mergeConfigFrom in boot():** Config values missing when other providers boot; subtle, hard-to-debug bugs
- **No mergeConfigFrom() at all:** Package defaults don't merge with published config; values may be missing

---

## Related Rules

- BACKSTAGE-RULE-005: Self-host vs managed
- BACKSTAGE-RULE-008: Weekly upgrade cadence

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Should Config Be Published?

---

## Decision Context

Not every package needs publishable config. Publishing adds maintenance surface area but enables consumer customization. The decision depends on how many config options exist and whether consumers need to override them.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

How many configurable options does the package have?
↓
0 → Skip config entirely
1-4 → ↓
Do consumers need to customize these values?
↓
NO → Skip publishing; use `mergeConfigFrom()` only
YES → Make publishable with tagged publishing
5+ → **Always make publishable** with tagged publishing (`--tag=package-name-config`)
Regardless:
- Always use tagged publishing (`--tag=package-name-config`) for granular control
- Never use `env()` in unpublished default config files
- Provide sensible defaults for every option
- Document all options with inline comments in the published config

---

## Rationale

Published config serves as documentation and enables customization. However, every publishable file adds maintenance commitment. The 5-option threshold balances documentation value with maintenance burden.

---

## Recommended Default

**Default:** Make config publishable for packages with 5+ options; skip for simpler packages
**Reason:** Config files serve as documentation; consumers need to see available options to configure the package

---

## Risks Of Wrong Choice

- **Not publishing:** Consumers can't discover or customize options; may fork the package
- **Publishing everything:** Overwhelming consumers with options they don't need

---

## Related Rules

- BACKSTAGE-RULE-006: Plugin architecture

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

