# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** View Component Registration in Packages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Make views publishable or keep in vendor? | Themeability, customization | Publishable for themeable components; keep for structural |
| 2 | One namespace per package vs sub-namespaces? | Component count, category grouping | Single namespace for < 15 components |

---

# Architecture-Level Decision Trees

---

## Decision 1: Make Views Publishable or Keep in Vendor?

---

## Decision Context

Package views can remain in vendor (not customizable) or be published to the application. The choice affects customization flexibility vs upgrade compatibility.

---

## Decision Criteria

* maintainability

---

## Decision Tree

Are the views structural/functional (should not change behavior)?
↓
YES → **Keep in vendor** — publishing structural views risks breaking functionality
NO → ↓
Are the views themeable/stylable (consumers need to customize appearance)?
↓
YES → **Make publishable** — consumers need to customize look and feel
NO → ↓
Will consumers frequently request visual customizations?
↓
YES → Make publishable; document publishing command
NO → Keep in vendor; publish on demand
Regardless:
- Published views can be modified and won't be overwritten on package updates
- Component classes cannot be published; only views can be overridden
- Use view publishing for theme packages (Flux UI, design systems)
- Keep in vendor for functional components (tables, forms with specific logic)

---

## Rationale

Published views give consumers control over appearance but create maintenance divergence when the package updates. Structural views should stay in vendor because overriding them risks breaking functionality. Theme/styling views should be publishable because customization is expected.

---

## Recommended Default

**Default:** Keep functional views in vendor; publish themeable/styling views
**Reason:** Structural changes shouldn't be overridden; cosmetic changes need customization

---

## Risks Of Wrong Choice

- **Publishing functional views:** Consumers break functionality by modifying; blame package for bugs
- **Not publishing themeable views:** Consumers fork the package; no upgrade path for customizations

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: One Namespace vs Sub-Namespaces?

---

## Decision Context

Components can all share one namespace prefix (`<x-package::button />`) or use sub-namespaces (`<x-package::forms.input />`). The choice affects organization and tag verbosity.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many components does the package provide?
↓
< 15 → **Single namespace** — `x-package::button`, `x-package::card`, `x-package::modal`
15+ → ↓
Do the components fall into natural categories (forms, navigation, layout, data display)?
↓
NO → Single namespace; keep flat
YES → **Sub-namespaces** — `x-package::forms.input`, `x-package::forms.select`, `x-package::data.table`
Regardless:
- Maximum 2 levels of subdirectory depth (forms/input, data/table)
- Use same namespace prefix for views, components, and layouts
- Keep prefix unique across all packages

---

## Rationale

Single namespace keeps component tags simple and is sufficient for most packages. Sub-namespaces provide organization for large component libraries but add verbosity. The 15-component threshold indicates when organization becomes beneficial.

---

## Recommended Default

**Default:** Single namespace for < 15 components; sub-namespaces for larger libraries
**Reason:** Simpler tags for small libraries; needed organization for large ones

---

## Risks Of Wrong Choice

- **Sub-namespaces for 5 components:** Over-engineered; unnecessarily verbose tags
- **Single namespace for 50 components:** Hard to discover/find components; no category grouping

---

## Related Rules

- TEMPLATE-RULE-005: Template format
- TEMPLATE-RULE-009: Test all templates in CI

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

