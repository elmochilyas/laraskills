# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Translation File Loading in Packages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | PHP array vs JSON translation files? | String count, organization | JSON for < 50 strings; PHP arrays for larger sets |
| 2 | Namespaced vs global translations? | Collision risk, package identity | Always use namespace-prefixed translations |

---

# Architecture-Level Decision Trees

---

## Decision 1: PHP Array vs JSON Translation Files?

---

## Decision Context

Laravel supports two translation file formats: PHP arrays (key-value in `en/messages.php`) and JSON (key-value in `en.json`). The choice affects translation key style and file organization.

---

## Decision Criteria

* maintainability

---

## Decision Tree

How many translation strings does the package have?
↓
< 50 → **JSON format** — string itself is the key; simpler to manage
50+ → ↓
Do the translations benefit from category organization (messages, validation, errors)?
↓
YES → **PHP array files** with category structure (`en/messages.php`, `en/errors.php`)
NO → **JSON format** — even at 50+, JSON is viable with organized keys
Regardless:
- Always provide English (`en`) as the complete default locale
- Use `__()` or `@lang()` for all user-facing strings in package views
- Register translations via `loadTranslationsFrom()` or Spatie's `->hasTranslations()`

---

## Rationale

JSON translations use the English string as the key, making them self-documenting and simpler for small packages. PHP arrays provide organizational structure for larger translation sets. The 50-string threshold is a guideline, not a hard rule.

---

## Recommended Default

**Default:** JSON format for < 50 strings; PHP arrays for 50+
**Reason:** JSON is simpler for small sets; PHP arrays provide needed structure for large sets

---

## Risks Of Wrong Choice

- **One giant JSON file for 200+ strings:** Hard to navigate; no category organization
- **PHP arrays for 10 strings:** Unnecessary file structure; higher overhead

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Namespaced vs Global Translations?

---

## Decision Context

Translations can be registered with a namespace (`'package::file.key'`) or globally (`'file.key'`). Namespaced translations prevent key collisions between packages.

---

## Decision Criteria

* architectural

---

## Decision Tree

Could another package or the application use the same translation key name?
↓
YES → **Use namespace-prefixed translations** — always the safe choice
NO → ↓
Is the only consumer of these strings the package itself (no consumer customization)?
↓
YES → Namespaced is still recommended for consistency
NO → ↓
**Always namespace** — even internal-only packages benefit from collision prevention
Regardless:
- Use the package name as the namespace prefix
- Register via `loadTranslationsFrom()` or Spatie's `->hasTranslations()`
- Make translations publishable so consumers can override strings

---

## Rationale

Global translations risk silent collisions where one package's translations override another's. The namespace convention (`__('package-name::file.key')`) is standard across the Laravel ecosystem and should always be used.

---

## Recommended Default

**Default:** Always use namespace-prefixed translations
**Reason:** Prevents silent key collisions between packages; follows Laravel ecosystem convention

---

## Risks Of Wrong Choice

- **No namespace:** Another package's translation silently overrides yours; users see wrong strings
- **Wrong namespace:** Translation keys don't resolve; raw key strings displayed to users

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

