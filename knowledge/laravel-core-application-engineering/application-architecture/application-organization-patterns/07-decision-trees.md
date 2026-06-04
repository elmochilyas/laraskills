# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Application Organization Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Organizational Pattern Selection (Technical-Layer vs Domain-Driven vs Modular vs Hybrid)
* Migration Timing (When to Restructure)
* Boundary Enforcement Strategy

---

# Architecture-Level Decision Trees

---

## Decision 1: Organizational Pattern Selection

---

## Decision Context

Choosing how to group code within the project — by technical layer (default), by business domain, by module, or a hybrid approach.

---

## Decision Criteria

* Model count
* Team size and ownership structure
* Clarity of bounded contexts
* Planned package extraction
* Need for Artisan compatibility

---

## Decision Tree

What is the model count?
↓
< 20 models?
YES → Technical-layer (default)
NO → 20-50 models?
    YES → Does the app have distinct bounded contexts?
        YES → Team size >= 8 developers?
            YES → Modular
            NO → Domain-driven or Hybrid
        NO → Technical-layer or Hybrid
    NO → 50+ models?
        YES → Multiple teams?
            YES → Modular (module per team)
            NO → Domain-driven with sub-features

---

## Rationale

Technical-layer is the correct default for new projects because it maintains Artisan compatibility and has zero overhead. Organizational patterns should be earned by complexity. Domain-driven provides clear ownership for 20-50 models with distinct bounded contexts. Modular is only justified when multiple teams need clear per-module boundaries.

---

## Recommended Default

**Default:** Technical-layer (Laravel default) for all new projects
**Reason:** Every Laravel developer knows the standard structure. Artisan commands work natively. No premature overhead. Reassess at ~20 models.

---

## Risks Of Wrong Choice

* Premature domain organization: Empty directories, manual file moves for no benefit, higher navigation depth without payoff
* Technical-layer beyond threshold: Scattered related files, unclear ownership, navigation friction
* Modular for single team: Unnecessary overhead of per-module providers, inter-module contracts, autoloading complexity

---

## Related Rules

* Start with Technical-Layer, Evolve When Complexity Demands It (05-rules.md)
* Never Mix Organizational Patterns (05-rules.md)
* Do Not Use Modular Organization for Single-Team Applications (05-rules.md)
* Document Organizational Pattern Decisions (05-rules.md)

---

## Related Skills

* Skill: Select and Document Organizational Pattern
* Skill: Migrate Application Between Organizational Patterns

---

## Decision 2: Migration Timing (When to Restructure)

---

## Decision Context

Determining when the current organizational pattern has been outgrown and a restructure is warranted.

---

## Decision Criteria

* Navigation friction (time to find files)
* Number of files per directory
* Team onboarding difficulty
* Cross-domain access patterns
* Deployment risk

---

## Decision Tree

Is navigation friction slowing the team?
↓
NO → Stay with current pattern
YES → Are bounded contexts clearly defined?
    NO → Map bounded contexts first, then reassess
    YES → Are you in the middle of a release cycle?
        YES → Delay restructure until after release
        NO → Does the team have dedicated refactoring time?
            YES → Create ADR, plan migration one domain at a time
            NO → Schedule refactoring sprint, continue with current pattern

---

## Rationale

Restructuring carries risk (broken imports, autoloading issues, merge conflicts). The decision to migrate should be driven by measurable friction, not by anticipation of future needs. Bounded contexts must be defined before any restructuring begins. Migrate one domain at a time with verification after each step.

---

## Recommended Default

**Default:** Postpone restructuring until navigation friction is measurable and bounded contexts are documented
**Reason:** Restructuring has real cost (broken references, merge conflicts, testing overhead). The benefit must exceed the cost.

---

## Risks Of Wrong Choice

* Restructuring too early: Paid overhead for no benefit, architecture instability
* Restructuring too late: Accumulated technical debt, slowed feature delivery, team frustration
* Restructuring without bounded contexts: Creates arbitrary groupings that are worse than flat structure

---

## Related Rules

* Define Bounded Contexts Before Restructuring (05-rules.md)
* Document Organizational Pattern Decisions (05-rules.md)

---

## Related Skills

* Skill: Migrate Application Between Organizational Patterns

---

## Decision 3: Boundary Enforcement Strategy

---

## Decision Context

How to prevent unauthorized cross-domain access in domain-driven or modular patterns.

---

## Decision Criteria

* Pattern type (domain-driven vs modular)
* Team size
* Available tooling (PHPStan, Psalm, CI)
* Risk tolerance for boundary violations

---

## Decision Tree

What organizational pattern is used?
↓
Technical-layer?
YES → No boundary enforcement needed (layers share by convention)
NO → Domain-driven or Modular?
    YES → Are there multiple teams?
        YES → Use CODEOWNERS + CI checks + PHPStan/Psalm rules
        NO → Single team?
            YES → Use PHPStan/Psalm custom rules only
            NO → Shared kernel extraction needed?

Is shared code used by 3+ domains?
YES → Extract to `app/Shared/` directory
NO → Prefer duplication over premature sharing

---

## Rationale

Directories do not prevent cross-boundary access. Without automated enforcement, domain boundaries erode as developers take shortcuts. Static analysis rules provide enforcement at CI time. CODEOWNERS provides team-level ownership. The shared kernel must be minimal to prevent creating a de facto monolith.

---

## Recommended Default

**Default:** PHPStan/Psalm custom rules for domain-driven patterns; add CODEOWNERS + CI for modular patterns with multiple teams
**Reason:** Automated enforcement prevents boundary erosion without relying on developer discipline alone.

---

## Risks Of Wrong Choice

* No enforcement: Boundaries erode, extraction blocked, team ownership meaningless
* Over-enforcement (blocking all cross-domain): Leads to duplication and workarounds
* Bloated shared kernel: Creates monolithic dependency that every module depends on

---

## Related Rules

* Enforce Domain Boundaries with Automated Checks (05-rules.md)
* Keep Shared Kernel Minimal (05-rules.md)

---

## Related Skills

* Skill: Select and Document Organizational Pattern
