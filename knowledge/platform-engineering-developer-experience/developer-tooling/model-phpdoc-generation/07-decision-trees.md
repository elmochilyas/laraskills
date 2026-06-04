# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Model PHPDoc Generation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Inline vs separate model annotations? | Diff visibility, model cleanliness | Inline for teams that review schema in PRs |
| 2 | Doctrine DBAL required? | Column type accuracy | Yes — without it, all types default to `mixed` |

---

# Architecture-Level Decision Trees

---

## Decision 1: Inline vs Separate Model Annotations?

---

## Decision Context

Model annotations can be written inline (modifying model files) or to a separate `_ide_helper_models.php`. Inline provides diff visibility; separate keeps models clean.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do team members regularly review model schema changes in PRs?
↓
YES → **Inline (`--write`)** — annotations visible in code review diffs
NO → ↓
Do you prefer clean model files without generated code?
↓
YES → **Separate file** — gitignore `_ide_helper_models.php`
NO → Inline for simplicity

---

## Recommended Default

**Default:** Inline (`--write`) for teams reviewing schema in PRs; separate for teams preferring clean models
**Reason:** Inline annotations make column changes visible in diffs; separate prevents model file pollution

---

## Risks Of Wrong Choice

- **Inline without Doctrine DBAL:** All types are `mixed`; annotations are useless
- **Separate without gitignore:** Merge conflicts from different generation outputs

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 2: Doctrine DBAL Required?

---

## Decision Context

Doctrine DBAL is needed for accurate column type detection. Without it, all columns default to `mixed`.

---

## Decision Criteria

* architectural

---

## Decision Tree

Do you need accurate column types in model annotations (e.g., `string`, `int`, `Carbon|null`)?
↓
YES → **Install `doctrine/dbal` in `require-dev`** — types come from DB schema
NO → Skip; types will default to `mixed`
Regardless:
- Doctrine DBAL reads column types from the actual database
- Run `migrate:fresh` before generation for accuracy
- DB must be accessible and migrated during generation

---

## Recommended Default

**Default:** Install `doctrine/dbal` — annotations without accurate types provide minimal value
**Reason:** `mixed` types defeat the purpose of model annotation generation

---

## Risks Of Wrong Choice

- **No Doctrine DBAL:** All `@property` annotations show `mixed` type; no autocompletion benefit
- **Outdated schema:** Annotations don't match current columns; misleading completion

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

