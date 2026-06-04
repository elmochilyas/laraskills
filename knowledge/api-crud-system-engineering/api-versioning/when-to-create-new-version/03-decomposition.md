# When to Create New Version — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers operating the version creation governance process over the long term: maintaining the version creation decision log, auditing version proliferation, managing the cost of version maintenance, and iterating on the decision framework based on operational data.

## Core Concepts
- **Version Proliferation Monitoring:** Tracking the number of active versions and their maintenance cost.
- **Decision Log Audit:** Reviewing past version-creation decisions to assess their correctness.
- **Cost of Version Maintenance:** Quantified burden per version (lines of code, routes, tests, documentation pages).
- **Decision Framework Iteration:** Updating the "when to create" criteria based on actual outcomes.

## Mental Models
- **Fiscal Budget:** Each version has a maintenance budget (time, money, attention). Creating a new version is a budget allocation. The question is not "can we create a version?" but "can we afford to maintain it?"
- **Family Planning (for Engineers):** Creating a new version is like adding a child to the family. It's a long-term commitment. You need resources, space, and time. Every new version divides the parents' (team's) attention.

## Internal Mechanics
- Version cost dashboard: lines of code, number of files, tests, routes, supported consumers per version.
- Decision outcome tracking: for each version creation decision, record predicted vs actual cost and consumer adoption.
- Version proliferation alert: when active versions > 3, team reviews whether consolidation is possible.
- Annual decision framework review: update the criteria based on what was learned.

## Patterns
- Version cost report: generated monthly showing maintenance burden per active version.
- Decision outcome review: 12 months after a new version is created, review if the decision was correct.
- "Version zero" policy: new APIs start without a version number until they have at least one consumer.
- Proliferation gate: no more than N active versions without VP-level approval.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Max active versions | 3 for public, 2 for internal | Balances support and innovation |
| Decision review window | 12 months after creation | Allows time for outcomes to materialize |
| Cost tracking | Automated metrics | Objective, consistent |
| Proliferation gate | VP approval for >3 versions | Formal oversight |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Strict version caps | Predictable support burden | May block needed versions |
| Flexible version count | Adaptable to need | Can grow uncontrollably |
| Automated cost tracking | Data-driven | Doesn't capture qualitative burden |
| Manual assessment | Context-aware | Subjective |

## Performance Considerations
- Version cost reporting is offline analytics, no runtime cost.
- Decision log is a document or database — negligible storage.
- Proliferation alerts are simple threshold checks.

## Production Considerations
- New version creation is a significant operational event requiring coordination across teams.
- When creating a new version, allocate 20% of the version's expected lifecycle cost to migration tooling.
- Track consumer adoption velocity for each new version to validate the version decision.
- Retire the oldest version before (or soon after) creating a new one to keep the count manageable.

## Common Mistakes
- Creating a new version for every feature request (version fatigue).
- Never creating a new version when one is clearly needed (API bloat).
- Not tracking the actual cost of version maintenance (decisions are guesses).
- Creating a new version without a deprecation plan for the oldest active version.

## Failure Modes
- **Version sprawl:** 5+ active versions, team spends 40% of time on maintenance.
- **Single version stagnation:** API so burdened with conditionals that it's impossible to change.
- **Wrong decision cascade:** Creating a version based on wrong assumptions leads to a version nobody uses.
- **Documentation debt:** Version documentation becomes a maze of "available in v3, deprecated in v4, removed in v5."

## Ecosystem Usage
- **Stripe:** Very conservative version creation (<1 per year). Most features added backward-compatibly.
- **Twilio:** Moderate version creation (new version every 12-18 months). Clear version lifecycle.
- **Google Cloud:** Many versions but each has clear documentation and lifecycle management.

## Related Knowledge Units
- **Prerequisites:** API governance, Technical debt management
- **Related Topics:** Backward-compatible changes, Semantic versioning for APIs
- **Advanced Follow-up:** API lifecycle management platforms, Version economics

## Research Notes
### Source Analysis
Stripe's engineering blog (2022) discusses their decision to create few API versions. Shopify's "API Versioning Philosophy" (2023) documents their balanced approach.

### Key Insight
The question "when to create a new version" is actually two questions: "is this change breaking?" (technical) and "do we have the capacity to maintain another version?" (operational). The second question is harder.

### Version-Specific Notes
Laravel 11's `App::booted()` callback can be used to register conditional versions based on configuration, enabling "version preview" flags for testing.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization