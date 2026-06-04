# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** IDE Helper
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we install IDE Helper? | IDE usage, team size | Yes — every Laravel project |
| 2 | Inline model annotations vs separate file? | Diff visibility, model cleanliness | Inline for diff visibility; separate for clean models |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Install IDE Helper?

---

## Decision Context

`barryvdh/laravel-ide-helper` generates PHPDoc stubs for facades, models, and container resolution. It's the most popular Laravel dev tool (14.9k+ stars). The only cost is a dev dependency.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Does the team use an IDE with PHPDoc support (PhpStorm, VS Code with Intelephense)?
↓
NO (vim/emacs only) → Skip; no benefit
YES → ↓
Is the project non-trivial (uses facades, Eloquent models, service container)?
↓
NO → Skip; minimal benefit
YES → **Install `barryvdh/laravel-ide-helper` in `require-dev`** and configure all 3 commands

---

## Recommended Default

**Default:** Install in `require-dev` for any project using facades or Eloquent
**Reason:** Dramatically improves IDE productivity; negligible cost

---

## Risks Of Wrong Choice

- **Not installing:** No autocompletion for facades, models, helpers; significant productivity loss
- **Installing in `require`:** Production dependency for dev-only tooling

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Inline vs Separate Model Annotations?

---

## Decision Context

Model PHPDoc can be written inline (modifying model files with `@property` annotations) or generated to a separate `_ide_helper_models.php` file. The choice affects diff visibility and model file cleanliness.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do developers rely on PR diffs to review model changes?
↓
YES → **Inline (`--write`)** — annotations visible in diffs; no separate file to manage
NO → ↓
Do you prefer clean model files without generated annotations?
↓
YES → **Separate file** — models stay clean; `_ide_helper_models.php` gitignored
NO → Inline for simplicity

---

## Recommended Default

**Default:** Inline (`--write`) for teams that review model schemas in PRs; separate for teams that prefer clean models
**Reason:** Inline annotations make schema changes visible in diffs

---

## Risks Of Wrong Choice

- **Inline without Doctrine DBAL:** `mixed` types for all columns; meaningless annotations
- **Separate file without gitignore:** Merge conflicts from different generation outputs

---

## Related Rules

- TEMPLATE-RULE-009: Test all templates in CI
- TEMPLATE-RULE-012: No secrets in templates

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

