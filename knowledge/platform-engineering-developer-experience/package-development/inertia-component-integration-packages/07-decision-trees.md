# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development
**Knowledge Unit:** Inertia Component Integration in Packages
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Pre-built vs source components? | Setup speed, customization | Ship both pre-built and source |
| 2 | Should you also support Blade? | Adoption, tech stack diversity | Support Blade alongside Inertia |

---

# Architecture-Level Decision Trees

---

## Decision 1: Pre-Built vs Source Components?

---

## Decision Context

Inertia package components can be shipped as pre-built (compiled JS) for zero-config use or as source (.vue/.jsx) requiring the consumer's build pipeline. The choice affects setup friction and customization flexibility.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

What is the primary target audience?
↓
**Non-technical users / quick setup**
↓
**Pre-built only** — compiled components work immediately; document source availability on request
↕
**Frontend-heavy teams / customization expected**
↓
**Both pre-built AND source** — pre-built for zero-config, source for customization
↕
**Advanced users / design system**
↓
**Source only** with npm package distribution; consumers manage their own build
Additional considerations:
- Pre-built components add to JS bundle size
- Source components require Vite build setup
- Both options = double maintenance
- npm distribution is better for complex component libraries

---

## Rationale

Pre-built components ensure the package "just works" after install. Source components give consumers flexibility to customize. Shipping both is ideal but doubles build maintenance. For most packages, pre-built as default with documented source access balances the tradeoffs.

---

## Recommended Default

**Default:** Ship both pre-built (for zero-config) and source (for customization)
**Reason:** Accommodates both quick-start users and advanced teams that need customization

---

## Risks Of Wrong Choice

- **Source only:** Zero-config users abandon package; requires build pipeline understanding
- **Pre-built only:** Customization requires forking; advanced users frustrated
- **Neither:** Package requires manual build setup; poor developer experience

---

## Related Rules

- TEMPLATE-RULE-001: Limit to 3-5 templates
- TEMPLATE-RULE-002: Parameterize, don't hardcode

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 2: Should You Also Support Blade?

---

## Decision Context

Inertia-only packages exclude the large portion of Laravel projects that use Blade. Supporting both frontends doubles view maintenance but dramatically increases adoption. The decision depends on target audience and maintenance capacity.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the target audience specifically Inertia-using applications?
↓
YES → Inertia-only is acceptable; document clearly
NO → ↓
Does the team have capacity to maintain both Blade and Inertia views?
↓
NO → Pick one frontend; Inertia is the modern choice
YES → ↓
Do many potential consumers use Blade (vs Inertia)?
↓
YES → **Support both** — detect frontend stack and conditionally register templates
NO → Inertia-only with Blade fallback documented

---

## Rationale

Blade is still the most common Laravel frontend. Inertia-only packages limit their market. Conditional registration (checking `app()->bound('inertia')` or similar) enables supporting both without requiring consumers to configure which stack they use.

---

## Recommended Default

**Default:** Support both Blade and Inertia when maintenance capacity allows
**Reason:** Maximizes adoption; Blade is still the majority of Laravel frontend use

---

## Risks Of Wrong Choice

- **Inertia-only:** Excludes Blade-based projects; halves potential adoption
- **Blade-only:** Misses the growing Inertia ecosystem; modern projects may skip the package
- **Both without capacity:** Views fall out of date; inconsistent behavior between stacks

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

