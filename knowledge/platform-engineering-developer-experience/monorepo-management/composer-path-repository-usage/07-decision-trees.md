# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Monorepo Management
**Knowledge Unit:** Composer Path Repository Usage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Path repos vs remote resolution for development? | Cross-package dev, feedback speed | Path repos for local monorepo development |
| 2 | Single root composer.json vs per-environment config? | Production deployment, lock portability | Single root with CI validation of remote resolution |

---

# Architecture-Level Decision Trees

---

## Decision 1: Path Repos vs Remote Resolution for Development?

---

## Decision Context

Composer path repositories symlink local packages for real-time feedback during cross-package development. Remote resolution downloads from Packagist. The choice affects development speed vs production fidelity.

---

## Decision Criteria

* performance

---

## Decision Tree

Are you developing 2+ interdependent packages simultaneously?
↓
YES → **Use path repositories** — instant feedback on cross-package changes
NO → ↓
Are you testing a package change against a real application before publishing?
↓
YES → Use path repository temporarily; remove before production deploy
NO → Remote resolution is sufficient; path repos not needed
Regardless:
- Use relative paths (`"packages/*"`) not absolute paths
- Use `"*"` version constraint for monorepo packages
- Path repos override version constraints; keep local versions aligned
- Validate with remote resolution in a dedicated CI job

---

## Rationale

Path repositories provide instant feedback for cross-package development — change a dependency and see results immediately without `composer update`. Without them, developers must manually symlink, use dev-master branches, or repeatedly run `composer update`.

---

## Recommended Default

**Default:** Use path repositories for monorepo development; validate remote resolution in CI
**Reason:** Instant cross-package feedback; CI ensures production compatibility

---

## Risks Of Wrong Choice

- **No path repos in monorepo:** Slow development; manual symlinking; frustrating cross-package workflow
- **Path repos in production:** `composer install` fails because local paths don't exist on servers

---

## Related Rules

- GP-RULE-001: Design from developer pain points
- GP-RULE-002: Attract, don't enforce

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

---

## Decision 2: Single Root vs Per-Environment Config?

---

## Decision Context

Monorepo strategies for handling path repositories in production: a single `composer.json` with path repos (needs stripping for prod) or separate config files for dev and production.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Can you control the production build process (Dockerfile, deploy script)?
↓
YES → **Single root composer.json** — strip path repos during production build
NO → ↓
Do you need separate development and production configurations?
↓
YES → **Separate config files** — `composer.dev.json` with path repos; `composer.json` without
NO → Single root with manual handling before deploy
Regardless:
- Commit the root `composer.lock` (do not ignore it)
- Add CI job that validates remote resolution
- Provide documentation on the dev/prod config workflow

---

## Rationale

A single `composer.json` is simpler but requires path repo stripping for production. Separate config files are more explicit but add complexity. The single config approach is preferred when you control the build process.

---

## Recommended Default

**Default:** Single root composer.json; strip path repos during production build
**Reason:** Simpler single-source-of-truth; build process handles environment differences

---

## Risks Of Wrong Choice

- **Single config without stripping:** Production `composer install` fails with "path not found"
- **Separate config confusion:** Developers accidentally use production config for development

---

## Related Rules

- GP-RULE-003: 80/20 rule
- GP-RULE-004: Start small, expand on demand

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

