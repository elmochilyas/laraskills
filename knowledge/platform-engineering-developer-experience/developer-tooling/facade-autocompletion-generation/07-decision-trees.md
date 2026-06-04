# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Developer Tooling
**Knowledge Unit:** Facade Autocompletion Generation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Track _ide_helper.php in VCS or gitignore? | Team workflow, merge conflicts | Gitignore; regenerate on install |
| 2 | Automate generation via composer scripts? | Team consistency, CI | Yes — add to post-autoload-dump |

---

# Architecture-Level Decision Trees

---

## Decision 1: Track _ide_helper.php in VCS or Gitignore?

---

## Decision Context

The generated `_ide_helper.php` file can be committed or ignored. Committing ensures it exists but creates merge conflicts from different generation outputs.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do all team members work in the same environment (same packages, same versions)?
↓
YES → Tracking is safe; minimal conflicts
NO → ↓
Do you have frequent merge conflicts?
↓
YES → **Gitignore** — regenerate on clone/install
NO → ↓
Team preference?
↓
Track for convenience; gitignore for cleanliness
Recommended: **Gitignore + composer script regen**

---

## Recommended Default

**Default:** Gitignore `_ide_helper.php`; regenerate via composer scripts on install/update
**Reason:** Avoids merge conflicts; ensures fresh stubs matching local environment

---

## Risks Of Wrong Choice

- **Tracking:** Merge conflicts from different generation outputs; stale stubs for out-of-date branches
- **Ignoring without automation:** Developers forget to regenerate; no autocompletion

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Automate Generation via Composer Scripts?

---

## Decision Context

Generation can be manual (`php artisan ide-helper:generate`) or automated via Composer scripts (`post-autoload-dump` or `post-update-cmd`).

---

## Decision Criteria

* maintainability

---

## Decision Tree

Do all team members run `composer install`/`composer update`?
↓
YES → **Automate via composer scripts** — `post-autoload-dump` or `post-update-cmd`
NO → Document manual generation in README
Add to scripts:
```json
"post-update-cmd": [
    "@php artisan ide-helper:generate --helpers",
    "@php artisan ide-helper:meta"
]
```

---

## Recommended Default

**Default:** Automate via `post-update-cmd` composer script
**Reason:** Ensures stubs are always current; zero developer effort

---

## Risks Of Wrong Choice

- **No automation:** Developers with outdated stubs blame the IDE/package; frustrated team
- **Running in CI:** Wasted pipeline time; generated file unused in CI environment

---

## Related Rules

- TEMPLATE-RULE-005: Template format
- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

