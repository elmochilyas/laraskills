# When to Create New Version — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Deciding when to create a new API version (vs. making a backward-compatible addition) is a critical governance skill. Phase 2 provides a decision framework, cost/benefit analysis template, and implementation checklist for creating new versions.

## Core Concepts
- **Version Trigger:** A change that requires a new version because it's breaking and cannot be made backward-compatible.
- **Non-Version Trigger:** Changes that can be made within the existing version as backward-compatible additions.
- **Cost of New Version:** Development, testing, documentation, consumer education, migration tooling, dual maintenance.
- **Cost of Not New Version:** Technical debt, complex conditionals, confusing API surface, consumer errors.

## Mental Models
- **Building Addition vs. New Building:** A new room (feature) can be added to an existing house (version). But if you need a different foundation (breaking architectural change), you need a new house (version).
- **Book Edition vs. Reprint:** Fixing typos? Reprint (patch). Adding a chapter? New edition (minor). Restructuring the entire book? New edition with major version number change.

## Internal Mechanics
- Decision tree:

  ```
  Is the change backward-compatible?
    → Yes: Add to current version. Done.
    → No: Can we make it backward-compatible with effort?
       → Yes: Add a default/fallback. Add to current version.
       → No: New version required.
  ```

- Cost estimation template: hours × teams × maintenance period.
- Governance workflow: change proposed → reviewed for compatibility → decision documented in ADR.

## Patterns
- Decision tree as code: `VersionDecisionService::evaluate($change)` returns `NEW_VERSION | BACKWARD_COMPATIBLE | BACKWARD_COMPATIBLE_WITH_WORK`.
- ADR template for new version decisions: context, change description, compatibility assessment, cost estimate, decision.
- Change classification in PR template: author marks change as `FEATURE`, `CHANGE`, `FIX` and assesses compatibility.
- Regular "version health" review: assess whether accumulated non-breaking changes warrant a new version for clarity.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| New version trigger | Only breaking changes | Conservative approach |
| Non-breaking accumulation trigger | When conditionals affect >30% of codebase | Prevents excessive complexity |
| Decision documentation | ADR required | Preserves rationale |
| Cost threshold | New version costs < 3x implementation cost | Economic justification |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Conservative (few versions) | Less maintenance, simpler docs | More conditionals, tech debt |
| Aggressive (many versions) | Clean code per version | Consumer fatigue, support burden |
| Accumulation trigger | Structured technical debt management | Arbitrary threshold |
| Ad-hoc decision | Context-dependent | Inconsistent, hard to predict |

## Performance Considerations
- No direct performance impact from the decision-making process.
- Creating a new version adds ~1-2 KB to route cache, negligible.
- Accumulated conditionals in a single version can slow response time (if-else chains).

## Production Considerations
- New version decisions should involve product, engineering, and documentation teams.
- Always produce a migration guide when creating a new version.
- Consider "preview" or "beta" flag within the current version before committing to a new version.
- Create the new version only when you can commit to maintaining it for its expected lifespan.

## Common Mistakes
- Creating a new version for a change that could have been backward-compatible with a default value.
- Fixing typos in docs and calling it a "new version."
- Accumulating so many conditionals in one version that a new version would have been cleaner.
- Creating a new version without a clear migration path for consumers.

## Failure Modes
- **Version proliferation:** 10+ active versions because "every change deserves its own version."
- **Version avoidance:** No versions for years because "it's too expensive" — API surface is full of deprecated, confusing endpoints.
- **Wrong trigger:** New version created for an internal refactor with no consumer-visible change.
- **Unnecessary cost:** New version created, maintained for 2 years, used by nobody.

## Ecosystem Usage
- **Stripe:** New version every quarter only if breaking changes are planned. Most changes are backward-compatible.
- **GitHub:** New version created very rarely (v3 in 2012, still current). Preview features for experimentation.
- **Shopify:** New version approximately yearly. Accumulated non-breaking changes released as minor enhancements.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Semantic versioning for APIs
- Versioning strategy selection

### Advanced Follow-up Topics
- API lifecycle management
- Consumer migration planning

## Research Notes
### Source Analysis
Stripe's API upgrade policy (2023) demonstrates conservative version creation. The "preview flag" pattern is documented in GitHub's developer documentation (2018).

### Key Insight
The best version is the one you don't create. Exhaust all backward-compatible options before committing to a new version. Each version is a maintenance burden you carry for years.

### Version-Specific Notes
Laravel has no built-in "create version" command. Creating a new version involves manual setup of routes, controllers, resources, requests, and tests.
