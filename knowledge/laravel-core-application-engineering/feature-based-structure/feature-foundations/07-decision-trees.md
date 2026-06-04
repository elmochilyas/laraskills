# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Modular Monolith Basics
**Generated:** 2026-06-03

---

# Decision Inventory

* Feature-Based vs Layer-Based Structure Decision
* When to Introduce Feature Structure (Project Age / Model Count Threshold)
* Full Feature Directory vs Minimal Per-Feature Structure

---

# Architecture-Level Decision Trees

---

## Decision 1: Feature-Based vs Layer-Based Structure Decision

---

## Decision Context

Whether to organize application code by business domain (feature) or by technical role (controller, model, service).

---

## Decision Criteria

* Number of models in the application
* Number of distinct business domains
* Team size and structure
* Expected growth trajectory
* Whether the project is a prototype, MVP, or long-term application

---

## Decision Tree

Is this a rapid prototype or MVP (<10 models, single developer, short lifespan)?
↓
YES → Use layer-based (default Laravel structure) — speed is the priority, no structural overhead
NO → Is the application small (<10 models) with limited growth expectations?
    YES → Use layer-based — the structural overhead of features isn't justified
    NO → Does the application have 10+ models across 2+ distinct business domains?
        YES → Is the team larger than 2 developers?
            YES → Feature-based — clear ownership boundaries reduce merge conflicts
            NO → Does the application have complex business logic beyond CRUD?
                YES → Feature-based — domain cohesion improves maintainability
                NO → Layer-based — simple CRUD doesn't benefit from feature structure
NO → Does the application have 20+ models across 3+ domains?
    YES → Feature-based required — layer-based structure becomes unmanageable at this scale
    NO → Use layer-based as default, evaluate feature-based at 10-model threshold

---

## Rationale

Layer-based structure is the Laravel default and works well for small projects. Feature-based structure must be earned — the overhead of custom directories, service providers, and namespace conventions is justified when domain cohesion provides measurable benefit (clear ownership, easier navigation, reduced merge conflicts).

---

## Recommended Default

**Default:** Start with layer-based structure for all new projects. Migrate to feature-based structure at the 10-model / 2-domain threshold.
**Reason:** Default Laravel structure has the best tooling support (Artisan generators, documentation) and is simplest for small projects. The 10-model threshold is where the navigational pain of layer-based structure starts to outweigh feature structure overhead.

---

## Risks Of Wrong Choice

* Feature-based for small project: Directory overhead, custom stubs, wasted setup time
* Layer-based for large project: 50+ models in `app/Models/` — impossible to navigate, no ownership boundaries
* Switching mid-project: Requires moving every file, updating every namespace — takes days
* No documented decision: New developers don't know the convention — mixed structures emerge

---

## Related Rules

* Start With Default Structure, Then Organize By Domain
* Make The Structure Decision Early

---

## Related Skills

* Create A New Feature Scaffold

---

---

## Decision 2: When to Introduce Feature Structure (Project Age / Model Count Threshold)

---

## Decision Context

At what point in a project's lifecycle to introduce feature-based structure — either from day one or after reaching a complexity threshold.

---

## Decision Criteria

* Current model count
* Project growth trajectory (stable vs rapidly expanding)
* Current navigational pain (how often do developers open 6+ directories for one feature?)
* Whether the team has experience with feature-based structure

---

## Decision Tree

Is this a brand new project with no existing code?
↓
YES → Estimated to exceed 10 models within 6 months?
    YES → Start with feature-based from day one — migration cost is higher than setup cost
    NO → Start with layer-based — evaluate at the 10-model threshold
NO → Existing project: How many models does it have?
    1-10 models → Do NOT migrate — overhead isn't justified
    11-20 models → Is navigation a team complaint?
        YES → Plan migration — the pain threshold has been reached
        NO → Defer — monitor, don't migrate preemptively
    20+ models → Migrate to feature-based — layer-based structure is actively harming productivity

---

## Rationale

Migrations are expensive. The 10-model threshold ensures migration only happens when there's clear justification. For new projects expected to grow quickly, starting feature-based from day one is cheaper than migrating. For stable small projects, layer-based is fine indefinitely.

---

## Recommended Default

**Default:** Layer-based for existing projects under 10 models. Feature-based for new projects expected to exceed 10 models within 6 months. Migrate existing 20+ model projects.
**Reason:** Migration cost is the deciding factor. Starting fresh with feature-based if you know the project will grow is cheaper than migrating later.

---

## Risks Of Wrong Choice

* Migrating at 10 models: Migration takes 2-3 days for questionable benefit at this threshold
* Not migrating at 30 models: Developers waste 10+ minutes daily navigating layer-based structure
* Starting feature-based for prototype: Set up overhead delays time-to-market
* Migrating without tests: Broken namespaces, broken imports, undetected until QA

---

## Related Rules

* Start With Default Structure, Then Organize By Domain
* Make The Structure Decision Early

---

## Related Skills

* Create A New Feature Scaffold

---

---

## Decision 3: Full Feature Directory vs Minimal Per-Feature Structure

---

## Decision Context

When creating a feature, whether to scaffold the full directory structure (all subdirectories) or create only the directories needed for the feature's current components.

---

## Decision Criteria

* Number of component types the feature currently needs
* Whether the feature is expected to grow with new component types
* Team convention (always full scaffold vs on-demand directory creation)
* Whether the project has a scaffolding script

---

## Decision Tree

Does the feature need 3+ component types now (controllers, models, services)?
↓
YES → Scaffold the full standard structure — `Controllers/`, `Models/`, `Services/`, `Requests/`, `Providers/`, `routes.php`
NO → Does the team have a standard "always use full scaffold" convention?
    YES → Scaffold full structure — consistency across features is the priority
    NO → Is the feature expected to grow within 3 months?
        YES → Scaffold full structure — adds directories only, no overhead until files are added
        NO → Create only needed directories — `app/Features/Billing/Controllers/` + `app/Features/Billing/Models/`

---

## Rationale

Empty directories have negligible cost. Scaffolding the full structure creates consistency — every feature looks the same, developers know where to find files. Creating only needed directories is leaner but risks inconsistency as features grow at different rates. Full scaffold is the recommended approach because empty directories don't hurt and consistency helps.

---

## Recommended Default

**Default:** Always scaffold the full standard feature directory structure when creating a new feature. Create subdirectories on demand only if the project explicitly chooses a lean convention.
**Reason:** Empty directories have zero runtime cost and create consistent expectations across all features. The cost of adding directories later (remembering which features have which directories) outweighs the cost of empty directories.

---

## Risks Of Wrong Choice

* Minimal scaffold with growth: Must add directories later, feature looks different from others
* Full scaffold for tiny feature: "Why is there a `Rules/` directory with nothing in it?" — minor confusion
* Inconsistent approaches: Some features have `Jobs/`, others don't — no way to know if it's missing or unused

---

## Related Rules

* Maintain Consistent Feature Directory Structure

---

## Related Skills

* Create A New Feature Scaffold
