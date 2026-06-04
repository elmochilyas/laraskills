# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Token Ability Design
**Generated:** 2026-06-03

---

# Decision Inventory

* Ability naming convention (resource:action vs domain:resource:action)
* Ability granularity (per-CRUD vs monolithic per-resource)
* Ability check pattern (middleware AND vs OR logic)

---

# Architecture-Level Decision Trees

---

## Ability Naming Convention — resource:action vs domain:resource:action

---

## Decision Context

How should token ability names be structured? Arises when defining the ability taxonomy for API tokens.

---

## Decision Criteria

* scalability — ability names that remain unique as the API grows
* discoverability — predictable naming for developers
* readability — concise enough to be usable in middleware declarations
* collision prevention — different domains should not share ability names

---

## Decision Tree

Is the API large (10+ resource types across multiple domains)?
↓
YES → Use `domain:resource:action` (e.g., `billing:invoices:read`)
NO → Small to medium API (<10 resource types)?
    YES → Use `resource:action` (e.g., `posts:read`)
    NO → Use `resource:action` (the standard pattern)

---

## Rationale

`resource:action` is the standard and recommended pattern for most APIs. It's predictable, readable, and sufficient for small to medium APIs. The three-level `domain:resource:action` pattern prevents collisions in large systems where two domains might have the same resource name.

---

## Recommended Default

**Default:** `resource:action` (e.g., `posts:read`, `posts:create`)
**Reason:** Standard, predictable, and sufficient for most APIs. Upgrade to three levels only when collision becomes a concern.

---

## Risks Of Wrong Choice

Inconsistent naming: developers cannot predict ability names, leading to typos and permission errors. Overly complex naming for small API: unnecessary verbosity in middleware declarations.

---

## Related Rules

- Use resource:action Naming Convention (from 05-rules.md)
- Define Abilities as Class Constants (from 05-rules.md)

---

## Related Skills

- Design Token Abilities (from 06-skills.md)

---

## Ability Granularity — Per-CRUD vs Monolithic Per-Resource

---

## Decision Context

Should each CRUD operation have a separate ability, or should one ability cover all operations on a resource? Arises when defining the degree of access control granularity.

---

## Decision Criteria

* least privilege — ability to grant exactly the access needed
* usability — fewer abilities are simpler to manage
* security — read-only tokens should not have write access
* token count — more abilities per token means more middleware checks

---

## Decision Tree

Does the API have consumers that need read-only access?
↓
YES → Use per-CRUD abilities (`posts:read`, `posts:create`, etc.)
NO → Do all consumers need full CRUD on the resource?
    YES → Monolithic ability (`posts:admin`) is acceptable
    NO → Per-CRUD abilities (safe default)

---

## Rationale

Per-CRUD abilities enable the principle of least privilege — a mobile read-only app gets only `posts:read`, not `posts:admin`. Monolithic abilities violate least privilege by granting all operations. The only exception is when every consumer truly needs full CRUD access.

---

## Recommended Default

**Default:** Per-CRUD granular abilities (`read`, `create`, `update`, `delete`)
**Reason:** Enables precise access control, prevents over-privileged tokens, and is the industry standard pattern.

---

## Risks Of Wrong Choice

Monolithic abilities: read-only consumers get write access, accidental or malicious data modification. Overly granular (action-per-row): hundreds of abilities per token, management nightmare.

---

## Related Rules

- Use Granular Per-CRUD-Operation Abilities (from 05-rules.md)

---

## Related Skills

- Design Token Abilities (from 06-skills.md)
- Policy Design for APIs (from 06-skills.md)

---

## Ability Check Pattern — Middleware AND vs OR Logic

---

## Decision Context

Should Sanctum's `abilities` middleware (AND logic) or `ability` middleware (OR logic) be used? Arises when protecting routes with token ability checks.

---

## Decision Criteria

* permission requirements — does the consumer need ALL or ANY of the listed abilities?
* route protection — single-ability endpoints vs multi-ability resources
* security — AND logic is more restrictive (all must match)
* user experience — OR logic is more permissive (any match suffices)

---

## Decision Tree

Does the route require all specified abilities to be present?
↓
YES → Use `abilities` middleware (AND — all must match)
NO → Does the route allow access if ANY ability matches?
    YES → Use `ability` middleware (OR — at least one match)
    NO → Mixed requirements?
        YES → Use separate middleware groups or custom logic

---

## Rationale

`abilities` (AND) is the security-safe default — all listed abilities must be present. `ability` (OR) is useful when multiple abilities can grant access (e.g., both `posts:read` and `posts:admin` can read). Most routes should use AND logic for consistent access control.

---

## Recommended Default

**Default:** `abilities` middleware (AND logic)
**Reason:** More restrictive (all abilities required), consistent behavior, and fewer surprises than OR logic.

---

## Risks Of Wrong Choice

OR logic when AND was intended: users with a single broad ability gain unintended access. AND logic when OR was intended: users with one of the required abilities are incorrectly denied.

---

## Related Rules

- Use resource:action Naming Convention (from 05-rules.md)

---

## Related Skills

- Design Token Abilities (from 06-skills.md)
- Sanctum Token Auth (from 06-skills.md)
