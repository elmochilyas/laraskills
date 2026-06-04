# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Blade Component Namespacing
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Class-based vs anonymous components? | Logic needs, reusability | Class-based for logic; anonymous for templates |
| 2 | What namespace prefix to use? | Uniqueness, consistency | Composer package name (without vendor prefix) |

---

# Architecture-Level Decision Trees

---

## Decision 1: Class-Based vs Anonymous Components?

---

## Decision Context

Blade components can be class-based (PHP class + template with computed properties, validation, DI) or anonymous (template-only). The choice affects component capability, testability, and complexity.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the component need PHP logic (computed properties, validation, attribute casting, dependency injection)?
↓
YES → **Class-based component** — extend `Illuminate\View\Component`
NO → ↓
Is the component a reusable UI element used in multiple contexts?
↓
YES → **Class-based** — provides clear API contract via public properties/methods
NO → ↓
Is the component purely presentational (structural HTML with passed data)?
↓
YES → **Anonymous component** — Blade template only, simpler to maintain
NO → ↓
Consider class-based as default; anonymous only for simplest structural templates

---

## Rationale

Class components provide a clear API contract, testable logic, and autocomplete support. Anonymous components are lighter-weight but offer no PHP logic layer. The rule of thumb: if it has any behavior, make it class-based.

---

## Recommended Default

**Default:** Class-based for any component with behavior; anonymous for pure structural templates
**Reason:** Class components are more maintainable, testable, and provide better developer experience

---

## Risks Of Wrong Choice

- **Anonymous for logic-heavy:** No PHP layer; logic bleeds into Blade or parent views
- **Class-based for every template:** Unnecessary boilerplate for simple structural HTML

---

## Related Rules

- BACKSTAGE-RULE-006: Plugin architecture
- BACKSTAGE-RULE-014: Vet third-party plugins
- BACKSTAGE-RULE-023: Avoid the Custom Plugin Graveyard

---

## Related Skills

- Build a Laravel-Specific Backstage Scaffolder Template
- Build a Forge-Based Self-Service Provisioning Platform

---

## Decision 2: What Namespace Prefix to Use?

---

## Decision Context

The namespace prefix (`<x-prefix::button />`) must be unique across all installed packages and match the view namespace registered via `loadViewsFrom()`. Collisions silently break component resolution.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the package distributed publicly?
↓
YES → Use the full composer package name without vendor prefix (e.g., `my-package` for `vendor/my-package`)
NO (internal org package) → ↓
Does another internal package already use the intended prefix?
↓
YES → Add a unique org-specific suffix or qualifier
NO → Use the package name as prefix
Regardless:
- Verify no popular package uses the same prefix
- Do NOT use generic prefixes like `admin`, `ui`, `forms`
- Keep the prefix consistent across all package versions

---

## Rationale

Namespace collisions are silent — the last-registered namespace wins and the first package silently loses. Using the full package name as prefix maximizes uniqueness. Internal packages should coordinate naming through an org-wide convention.

---

## Recommended Default

**Default:** Composer package name (without vendor prefix) as the namespace prefix
**Reason:** Maximizes uniqueness across the ecosystem; matches view namespace conventions

---

## Risks Of Wrong Choice

- **Generic prefix:** Collision with other package; components silently break
- **Changing prefix between versions:** Breaks all existing consumer component references

---

## Related Rules

- BACKSTAGE-RULE-019: No official Laravel Backstage plugin exists
- BACKSTAGE-RULE-025: Never recommend Backstage for teams under 20

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

