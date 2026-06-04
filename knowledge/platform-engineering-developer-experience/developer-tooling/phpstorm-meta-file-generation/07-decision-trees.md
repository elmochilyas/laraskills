# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** PhpStorm Meta File Generation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Generate PhpStorm meta file? | IDE used by team | Yes for PhpStorm; skip for VS Code/Vim |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Generate .phpstorm.meta.php?

---

## Decision Context

The `.phpstorm.meta.php` file enhances type inference for PhpStorm users (container resolution, collection generics, factory returns). It's PhpStorm-specific and has no benefit for other IDEs.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does any team member use PhpStorm?
↓
YES → **Generate `.phpstorm.meta.php`** — adds container resolution and collection type inference
NO (all VS Code/Vim) → ↓
Is there a plan to switch to PhpStorm?
↓
YES → Generate now; prepare for transition
NO → ↓
**Skip meta generation** — VS Code relies on `_ide_helper.php` for type info
If generating:
- Add `post-update-cmd` script: `@php artisan ide-helper:meta`
- Gitignore `.phpstorm.meta.php`
- Regenerate after provider/package changes

---

## Recommended Default

**Default:** Generate for PhpStorm-using teams; skip for VS Code/Vim-only teams
**Reason:** Meta file is PhpStorm-specific; no benefit for other IDEs

---

## Risks Of Wrong Choice

- **Not generating for PhpStorm:** Missing container resolution inference; `app('mailer')` returns `mixed`
- **Generating for VS Code:** Unnecessary file; wasted generation time; merge conflict risk

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

