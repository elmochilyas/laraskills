# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Organizing by feature/vertical slice within app/
**Generated:** 2026-06-03

---

# Decision Inventory

* Feature-based vs domain-based organization
* Feature-scoped route files vs shared route files
* Shared kernel vs code duplication across features

---

# Architecture-Level Decision Trees

---

## Feature-Based vs Domain-Based Organization

---

## Decision Context

Both feature-based and domain-based organization group code by business concepts rather than technical layers. Feature-based groups around user-facing capabilities (Checkout, UserRegistration). Domain-based groups around bounded contexts (Billing, Catalog, Identity). The distinction affects boundary granularity and cross-cutting concern handling.

---

## Decision Criteria

* performance considerations — domain-based adds boot cost from multiple providers; feature-based is lighter
* architectural considerations — features are coarser and user-facing; domains are finer and business-oriented
* security considerations — neither provides inherent security boundaries
* maintainability considerations — feature organization is more intuitive for UI-focused teams; domain organization aligns with DDD

---

## Decision Tree

Organize by feature or domain?
↓
Team structure follows business capabilities?
YES → Features — teams own complete user-facing features
NO → Team structure follows business subdomains?
    YES → Domains — teams own business concepts
    NO → Is the focus on UI workflows and user journeys?
        YES → Feature-based
        NO → Domain-based (DDD alignment)

---

## Rationale

Features are coarser — one feature can span multiple domains for a user-facing capability. Domains are finer — one domain serves one bounded context. Feature organization is better for UI-focused teams; domain organization is better for teams practicing DDD with formal bounded contexts.

---

## Recommended Default

**Default:** Domain-based organization for most teams
**Reason:** Domains align with DDD practices, enable cleaner extraction paths, and are more stable than user-facing features (which change with UI requirements).

---

## Risks Of Wrong Choice

Feature-based can lead to feature boundaries that don't match business domain boundaries, causing confusion when multiple domains interact within a feature. Domain-based can make simple workflows span multiple directories, increasing navigation overhead.

---

## Related Rules

- R01: Keep Each Feature Fully Self-Contained (COS-05/05-rules.md)
- R08: Enforce Feature Boundaries via Architecture Tests (COS-05/05-rules.md)

---

## Related Skills

- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

---

## Feature-Scoped Route Files vs Shared Route Files

---

## Decision Context

In feature-based organization, routes can be defined per-feature (in the feature directory) or in traditional shared route files (`routes/web.php`). The choice affects merge conflict frequency and feature ownership clarity.

---

## Decision Criteria

* performance considerations — route file globbing at boot time is negligible
* architectural considerations — per-feature routes enable clear feature ownership
* security considerations — per-feature routes make middleware application more explicit
* maintainability considerations — shared route files become merge conflict hotspots at scale

---

## Decision Tree

Route file strategy?
↓
Multiple teams own different features?
YES → Use feature-scoped route files (glob-loaded)
NO → Single team or fewer than 5 features?
    YES → Shared routes/web.php is acceptable
    NO → Route file exceeds 200 lines?
        YES → Split into feature-scoped route files
        NO → Keep shared but monitor for growth

---

## Rationale

Feature-scoped route files prevent `routes/web.php` from becoming unmanageable and create clear route ownership. Per-feature routes are auto-discovered via glob loading — manual registration creates merge conflicts and forgotten entries.

---

## Recommended Default

**Default:** Use feature-scoped route files for feature-based projects
**Reason:** Prevents merge conflicts, enables clear ownership, and scales better. Auto-discovery via glob eliminates manual registration overhead.

---

## Risks Of Wrong Choice

Shared route files become merge conflict hotspots as features multiply. Feature-scoped routes without auto-discovery may be forgotten or inconsistently loaded.

---

## Related Rules

- R03: Use Feature-Scoped Route Files (COS-05/05-rules.md)
- R04: Automate Feature Discovery via Glob Loading (COS-05/05-rules.md)

---

## Related Skills

- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

---

## Shared Kernel vs Code Duplication Across Features

---

## Decision Context

Feature isolation tempts teams to either duplicate shared code across features (to maintain independence) or create a shared kernel that features depend on. The balance between duplication and coupling is the central tension in feature-based organization.

---

## Decision Criteria

* performance considerations — no performance impact from shared kernel
* architectural considerations — shared kernel creates coupling; duplication creates maintenance burden
* security considerations — shared kernel may create security dependencies if features have different security contexts
* maintainability considerations — duplication across 5+ features causes update burden; shared kernel requires careful change management

---

## Decision Tree

Code potentially shared across features?
↓
Code is infrastructure (base classes, utilities, auth)?
YES → Extract to Shared kernel — infrastructure should not be duplicated
NO → Code is domain logic specific to one feature?
    YES → Keep in feature — do not extract
    NO → Code is used by 3+ features?
        YES → Extract to Shared kernel with clear ownership
        NO → Duplicate is acceptable — avoid premature extraction

---

## Rationale

Shared infrastructure (auth middleware, base controllers, audit logging) should never be duplicated — it creates maintenance burden and inconsistency. Shared domain logic creates coupling and should be avoided. The rule: share infrastructure, don't share domain logic.

---

## Recommended Default

**Default:** Share infrastructure via shared kernel; duplicate domain logic across features
**Reason:** Infrastructure duplication creates inconsistency and maintenance burden. Domain logic duplication preserves feature independence and prevents cross-feature coupling.

---

## Risks Of Wrong Choice

Excessive sharing creates coupling — changing shared code affects all features. Excessive duplication creates maintenance burden — fixing a bug requires changes in N features.

---

## Related Rules

- R05: Establish a Shared Kernel for Cross-Cutting Concerns (COS-05/05-rules.md)
- R06: Limit Feature Size — Extract Sub-Features (COS-05/05-rules.md)

---

## Related Skills

- Organize Code by Feature Using Vertical Slices (COS-05/06-skills.md)
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
