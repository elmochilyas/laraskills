# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Vertical Slice Architecture / Shared Kernel
**Generated:** 2026-06-03

---

# Decision Inventory

* Sub-Feature Splitting Threshold (When to Split a Feature)
* Domain Groups vs Flat Feature List for Large Projects
* Shared Kernel Content (What Goes in app/Kernel/)

---

# Architecture-Level Decision Trees

---

## Decision 1: Sub-Feature Splitting Threshold (When to Split a Feature)

---

## Decision Context

When to split an oversized feature into sub-features (e.g., `Billing` → `Billing/Invoicing`, `Billing/Subscriptions`).

---

## Decision Criteria

* File count in the feature directory
* Number of distinct sub-domains within the feature
* Number of developers working on the feature simultaneously
* Whether navigation within the feature takes noticeably long

---

## Decision Tree

How many files does the feature directory contain?
↓
<15 files → Do NOT split — feature is small and cohesive
15-20 files → Are there 2+ clearly distinct sub-domains within the feature?
    YES → Plan splitting — monitor file count, split at 20
    NO → Do NOT split — files are cohesive within one domain
20-50 files → Split into sub-features — directory is large enough to benefit from organization
50+ files → Split IMMEDIATELY — this is equivalent to the "god model" problem at the feature level

---

## Rationale

A feature with 50+ files has the same navigational problem as a layer-based structure with 50 models in one directory. Sub-features restore cohesion by grouping related files within the larger domain. The 20-file threshold is a heuristic — split when the feature contains clearly distinct sub-domains, not just many files.

---

## Recommended Default

**Default:** Monitor file count per feature. Plan splitting at 15-20 files. Split immediately at 20+ files with clear sub-domains.
**Reason:** The 20-file threshold prevents the feature-level god problem while avoiding premature splitting. Clear sub-domains are a prerequisite — splitting a cohesive 25-file feature with no sub-domains creates artificial boundaries.

---

## Risks Of Wrong Choice

* Splitting at 10 files: Artificial sub-domains — sub-features have 3 files each, overhead without benefit
* Not splitting at 50 files: 50 files in one feature — same navigational difficulty as layer-based
* Splitting without clear sub-domains: Sub-features don't make sense — developers confused about placement
* Splitting with shared code: 80% of files shared between sub-features — false modularity

---

## Related Rules

* Split Features Into Sub-Features At ~20 Files
* Domain Group Organization

---

## Related Skills

* Split A Feature Into Sub-Features

---

---

## Decision 2: Domain Groups vs Flat Feature List for Large Projects

---

## Decision Context

Whether to group related features under domain directories (e.g., `Financial/Billing/`, `Financial/Payments/`) or keep all features flat under `app/Features/`.

---

## Decision Criteria

* Number of features in the application
* Whether features have natural domain groupings (Financial, UserManagement, Content)
* Whether the project has multiple teams responsible for different domain groups
* Whether CODEOWNERS is used for team ownership

---

## Decision Tree

How many features does the application have?
↓
<20 features → Flat `app/Features/` — direct access, no grouping overhead
20-50 features → Are there natural domain groupings (3-6 domains)?
    YES → Group by domain — `app/Financial/Billing/`, `app/UserManagement/Users/`
    NO → Flat — don't force artificial groupings
50+ features → Group by domain REQUIRED — flat list of 50+ features is unmanageable
NO → Does the project have 3+ teams each owning feature groups?
    YES → Group by domain — each team owns a domain directory, enforced via CODEOWNERS
    NO → Flat — team ownership doesn't require directory grouping

---

## Rationale

Domain groups provide an additional organizational layer for very large projects. At 50+ features, `app/Features/` has the same problem as `app/Models/` with 50 models — too many entries to scan quickly. Domain groups create a browsable hierarchy: `Financial/`, `UserManagement/`, `Content/`.

---

## Recommended Default

**Default:** Flat feature list for applications with <20 features. Domain groups for 20+ features or multiple teams.
**Reason:** The 20-feature threshold is where directory listing becomes slow. Domain groups provide meaningful structure at that scale. Multi-team projects benefit from the clear ownership boundary.

---

## Risks Of Wrong Choice

* Domain groups at 10 features: Nested directories for 3 files per domain — overhead without benefit
* Flat at 50 features: `ls app/Features/` returns 50 entries — impossible to scan
* Wrong domain grouping: Feature could fit in two domains — developer confusion about placement
* Domain groups without team ownership: CODEOWNERS not configured — no enforcement of boundaries

---

## Related Rules

* Domain Group Organization
* Team-Owned Directory Structure

---

## Related Skills

* Split A Feature Into Sub-Features

---

---

## Decision 3: Shared Kernel Content (What Goes in app/Kernel/)

---

## Decision Context

What types, contracts, and utilities belong in the shared kernel (`app/Kernel/Contracts/`, `app/Kernel/DTOs/`) versus inside individual features.

---

## Decision Criteria

* Whether the type is consumed by 2+ features
* Whether the type represents a core domain concept or an integration contract
* Whether the type is stable (rarely changes) or volatile (changes frequently)
* Whether the type is an interface/contract or an implementation

---

## Decision Tree

Is the type consumed by 2+ features?
↓
YES → Is the type an interface (contract) or a concrete implementation?
    Interface/contract → Put in `app/Kernel/Contracts/` — single source of truth for cross-feature contracts
    Concrete implementation → Is the implementation shared across features?
        YES → Is the implementation stable (rarely changes)?
            YES → Put in `app/Kernel/` — shared utility or value object
            NO → Keep in the owning feature — volatile implementations should not be in the kernel
        NO → Keep in the owning feature — each feature can implement the contract differently
NO → Does the type represent a core domain concept (Money, Address, Email)?
    YES → Put in `app/Kernel/` — core concepts are application-wide
    NO → Keep in the feature that owns it

---

## Rationale

The shared kernel is for types that represent cross-feature contracts or core domain concepts. Putting implementations in the kernel creates coupling — changes to `app/Kernel/Money` affect all features. Interfaces in the kernel are safer because they only define the contract, not the implementation.

---

## Recommended Default

**Default:** Put cross-feature interfaces in `app/Kernel/Contracts/`. Put shared DTOs and value objects in `app/Kernel/DTOs/`. Put feature-specific types inside the feature.
**Reason:** The kernel is a shared cost center — everything in it must be maintained with backward compatibility. Only include types that are genuinely shared and relatively stable.

---

## Risks Of Wrong Choice

* Feature-specific type in kernel: Kernel pollution — unrelated types accumulate
* Implementation in kernel: Changing `Money` in kernel breaks all features that use it
* No kernel at all: Features create ad-hoc communication through model access — tight coupling
* Kernel becomes god directory: 100+ unrelated types — same problem as `app/Models/` god model

---

## Related Rules

* Shared Kernel Contract Definition
* Never Direct Model Access Across Features

---

## Related Skills

* Split A Feature Into Sub-Features
* Define Cross-Feature Communication Contracts
