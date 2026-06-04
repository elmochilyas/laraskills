# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Technical vs Domain Grouping
**Generated:** 2026-06-03

---

# Decision Inventory

* Layer-Based vs Feature-Based Organizational Structure
* Team Convention vs Project-Driven Structure Choice
* Migration from Layer to Feature vs Staying with Layer

---

# Architecture-Level Decision Trees

---

## Decision 1: Layer-Based vs Feature-Based Organizational Structure

---

## Decision Context

The foundational structural decision for a Laravel project — whether to organize code by technical layer (controllers, models, services) or by business domain (billing, users, cms).

---

## Decision Criteria

* Number of models in the application
* Number of distinct business domains
* Team size
* Growth trajectory
* Navigation patterns (do developers work across domains or within domains)

---

## Decision Tree

How many models does the application have or is expected to have?
↓
<10 models → Layer-based — Laravel default, simplest navigation, best tooling support
10-20 models → Does the application have 3+ distinct business domains?
    YES → Feature-based — domain boundaries provide meaningful organizational structure
    NO → Layer-based — few domains, layer-based navigation is still efficient
20+ models → Feature-based — layer-based with 20+ models in `app/Models/` is unmanageable
NO → Is the team 5+ developers?
    YES → Feature-based — ownership boundaries reduce merge conflicts
    NO → Is the application complex (beyond CRUD, with business logic)?
        YES → Feature-based — domain cohesion improves maintainability
        NO → Layer-based

---

## Rationale

The model count is the strongest indicator because `app/Models/` is where layer-based pain first manifests. At 20 models, navigating `app/Models/` to find the right model is slow. At 10 models with 3+ domains, the domains provide natural organizational boundaries. Team size matters because feature-based structure provides ownership boundaries that reduce merge conflicts.

---

## Recommended Default

**Default:** Layer-based for projects under 10 models. Feature-based for projects with 20+ models or 3+ domains.
**Reason:** The 10-model and 20-model thresholds correspond to meaningful pain points in layer-based navigation. Feature-based structure is an investment that pays off at scale.

---

## Risks Of Wrong Choice

* Feature-based for small project: Setup overhead — custom directories, stubs, service providers
* Layer-based for large project: 40 models in `app/Models/` — takes minutes to find the right model
* Layer-based for multi-team project: Constant merge conflicts in shared directories
* Feature-based for single-domain app: Artificial boundaries — "billing" and "payments" are the same domain

---

## Related Rules

* Start With Default Structure, Then Organize By Domain
* Make The Structure Decision Early

---

## Related Skills

* Evaluate Organizational Structure For A New Project

---

---

## Decision 2: Team Convention vs Project-Driven Structure Choice

---

## Decision Context

Whether to decide the structure based on the team's preference and experience or based on the project's objective characteristics (size, domains, complexity).

---

## Decision Criteria

* Team's experience with feature-based structure (have they done it before?)
* Team size and stability
* Whether the team has strong opinions on structure
* Whether the project will outlive the current team

---

## Decision Tree

Does the team have experience with feature-based structure?
↓
YES → Follow the project characteristics (model count, domains) — team can handle either structure
NO → Does the team have strong opinions/preferences?
    YES → Follow the team's preference — team comfort and productivity matter more than structural purity
    NO → Layer-based — default Laravel structure, lowest learning curve, best documentation
NO → Will the project outlive the current team (product company, long-term project)?
    YES → Follow project characteristics — don't optimize for current team's preferences
    NO → Follow team preference — optimize for the team that will actually build it

---

## Rationale

The best structure is the one the team uses effectively. Feature-based structure offers objective benefits at scale, but a team that's never used it will make mistakes. Layer-based is the safest default for inexperienced teams. For long-lived projects, optimize for the project's inherent characteristics, not the current team's preferences.

---

## Recommended Default

**Default:** Layer-based for teams without feature-based experience. Feature-based for experienced teams with projects that meet the model/domain thresholds.
**Reason:** Team proficiency with the chosen structure is more important than the structure's theoretical advantages. An inexperienced team will struggle with feature-based ceremony.

---

## Risks Of Wrong Choice

* Feature-based for inexperienced team: Misplaced files, broken autoloading, abandoned structure
* Layer-based for experienced team: Frustration with god models and scattered feature code
* Team preference over project needs: Structure that doesn't fit the project's domain complexity
* Project needs over team preference: Unhappy team, lower productivity, higher turnover

---

## Related Rules

* Make The Structure Decision Early
* Start With Default Structure, Then Organize By Domain

---

## Related Skills

* Evaluate Organizational Structure For A New Project

---

---

## Decision 3: Migration from Layer to Feature vs Staying with Layer

---

## Decision Context

Whether an existing layer-based project should migrate to feature-based structure or stay with layer-based organization.

---

## Decision Criteria

* Current model count
* Current pain level with layer-based navigation
* Whether the team can dedicate uninterrupted time for the migration
* Whether the project has comprehensive test coverage
* Whether the project has automated deployment

---

## Decision Tree

Is the current model count under 10?
↓
YES → Stay with layer-based — migration cost is not justified
NO → Is the model count 10-20?
    YES → Is layer-based navigation causing daily frustration?
        YES → Plan migration — the pain is real, but budget 2-3 days for the move
        NO → Stay with layer-based — monitor, don't migrate preemptively
NO → Is the model count 20+?
    YES → Does the project have comprehensive test coverage (>80%)
        YES → Migrate — tests will catch namespace and import errors
        NO → Do NOT migrate — without tests, the migration will introduce undetected bugs
NO → Is the project infrastructure automated (CI/CD, deployment scripts)?
    YES → Migrate — automation supports the transition with rollback capability
    NO → Migrate with caution — manual deployment increases risk

---

## Rationale

Migration is expensive and risky. Every file must be moved, every namespace updated, every import fixed. Without test coverage, this is blind refactoring. The 20-model threshold is where migration benefit clearly outweighs cost. Below that, only migrate if daily navigation pain justifies the 2-3 day investment.

---

## Recommended Default

**Default:** Do NOT migrate layer-based projects under 20 models. Migrate projects with 20+ models AND comprehensive test coverage.
**Reason:** Migration cost and risk are significant. Only proceed when the model count is high enough that the benefit clearly outweighs the investment, and test coverage provides a safety net.

---

## Risks Of Wrong Choice

* Migration without tests: Broken imports go undetected — QA finds them weeks later
* Not migrating at 40 models: Daily 5+ minute navigation overhead — 20+ hours/year wasted per developer
* Migration with no rollback plan: Half-migrated project — some files moved, others not
* Incomplete migration: Mixed layer and feature structure — worst of both worlds

---

## Related Rules

* Start With Default Structure, Then Organize By Domain
* Make The Structure Decision Early

---

## Related Skills

* Evaluate Organizational Structure For A New Project
