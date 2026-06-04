# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Install Commands for Packages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we provide an install command? | Complexity, setup steps, UX | Yes — for packages with config/migrations/assets |
| 2 | Interactive vs non-interactive prompts? | CI/CD needs, user choice | Interactive with sensible defaults for --no-interaction |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Provide an Install Command?

---

## Decision Context

An install command (`php artisan package-name:install`) automates setup steps (publishing config, migrations, assets). It improves developer experience but adds a maintenance surface.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the package have any publishable resources (config, migrations, assets)?
↓
NO → Install command not needed
YES → ↓
How many setup steps are required?
↓
1 step → Install command is nice-to-have; document the single command
2-4 steps → **Provide install command** — significantly improves DX
5+ steps → **Install command is essential** — manual setup is poor experience
Regardless:
- Always support `--no-interaction` flag for CI/CD
- Make the command idempotent (safe to re-run)
- Provide progress feedback during execution
- Show post-install summary with next steps

---

## Rationale

An install command transforms a multi-step, error-prone manual process into a single command. The developer experience improvement is substantial for packages with multiple publishable resources.

---

## Recommended Default

**Default:** Provide install command for any package with config, migrations, or assets
**Reason:** Single-step setup significantly reduces friction and support requests

---

## Risks Of Wrong Choice

- **No install command:** Users skip steps, miss configuration, file bug reports about missing functionality
- **Destructive install command:** Overwrites customizations without confirmation; users lose changes

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI
- TEMPLATE-RULE-012: No secrets in templates

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Interactive vs Non-Interactive Prompts?

---

## Decision Context

Install commands can use interactive prompts (confirmations, choices) or run silently. CI/CD environments require `--no-interaction` support. The balance between helpful guidance and silent automation depends on the deployment context.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Will this package be installed in CI/CD environments?
↓
YES → All prompts must have sensible defaults for `--no-interaction`
NO → ↓
Do the prompts control important setup decisions (run migrations, overwrite config)?
↓
NO → Skip prompts; just run with defaults
YES → ↓
Use `confirm()` with sensible defaults
Test with `--no-interaction` flag
Document what defaults are used in non-interactive mode

---

## Rationale

`--no-interaction` support is mandatory for CI/CD. Every prompt must have a sensible default so the command works without user input. Silently failing in CI is worse than not having an install command.

---

## Recommended Default

**Default:** Interactive prompts with sensible defaults; `--no-interaction` uses defaults
**Reason:** Works in both interactive (developer machines) and automated (CI/CD) environments

---

## Risks Of Wrong Choice

- **No --no-interaction support:** CI/CD pipelines fail; automated deploys blocked
- **No prompts, silent run:** Users have no control; destructive changes happen without confirmation

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

