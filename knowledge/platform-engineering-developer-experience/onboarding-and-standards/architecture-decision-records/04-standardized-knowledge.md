# Experience Curation: Architecture Decision Records (ADRs)

## Metadata
- **KU ID:** onboarding-team-standards/architecture-decision-records
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** coding-standards-documentation, development-workflow-documentation, contributing-dot-md-patterns
- **Related Technologies:** ADR, Markdown, Decision Log, Architecture Governance, Laravel
- **Target Audience:** Software architects, Laravel developers, team leads

## Overview

Architecture Decision Records (ADRs) are lightweight documents that capture architectural decisions made during a project's lifecycle, including the context, options considered, decision rationale, and consequences. For Laravel teams, ADRs provide a systematic way to document decisions about package selection (why Spatie vs custom solution), architectural patterns (service layer vs action pattern), infrastructure choices (Forge vs Vapor vs dedicated servers), and coding standards. ADRs follow a structured template (typically based on Michael Nygard's format) and are stored in the project repository (`docs/adrs/`). They serve as institutional memory, onboarding material for new developers, and a decision log for architecture governance.

## Core Concepts

- **ADR Format (Nygard):** Title, Status (proposed, accepted, deprecated, superseded), Context, Decision, Consequences
- **Sequential Numbering:** ADRs numbered chronologically (0001-use-laravel-pint.md) for easy referencing
- **Decision Log:** The collection of all ADRs tracks the evolution of architectural thinking; superseded ADRs remain for historical context
- **Status Lifecycle:** Proposed → Accepted/Rejected → Deprecated/Superseded
- **Lightweight Governance:** Quick captures of decisions with rationale, enabling team alignment without heavy process

## When To Use

- Significant architectural decisions that will have long-term impact
- Package or tool selection with multiple viable options
- Decisions that new team members will ask "why did we choose this?"
- Decisions that override or extend framework defaults
- Any decision where you want to prevent repeated discussion

## When NOT To Use

- Trivial choices (tabs vs spaces, variable naming)
- Decisions that will be reversed within weeks
- Personal preferences that don't affect the team
- Decisions that are already enforced by tooling (Pint rules, PHPStan level)
- Situations where documentation overhead outweighs decision impact

## Best Practices (WHY)

1. **Document Alternatives, Not Just the Decision (Why):** The alternatives section provides the most value for future reference. Future developers need to know what was considered and why it was rejected, not just what was chosen. If a rejected option becomes viable later, they can reassess with full context.

2. **Keep ADRs to 1-2 Pages (Why):** Short ADRs are actually written; 10-page ADRs are never created. The lightweight format is the key to adoption. If a decision needs more space, it's likely a design document, not an ADR.

3. **Review via PR, Not Meetings (Why):) ADR review via PR forces written rationale, creates a documented discussion thread, and provides a natural approval mechanism. Meeting-based ADR review encourages verbal decisions that aren't captured.

4. **Update Status When Decisions Change (Why):** Merging an ADR as Accepted but never marking it as Superseded when the decision is reversed makes the decision log inaccurate. When a decision changes, create a new ADR that supersedes the old one, and update the old ADR's status.

5. **Include Rejected Decisions (Why):** Documenting "we considered X but chose Y because..." prevents repeated discussions. When someone suggests X six months later, you can point to the ADR explaining why X was rejected. This is one of the highest-ROI uses of ADRs.

## Architecture Guidelines

- **Storage:** Repository directory `docs/adrs/`. Versioned, reviewed via PRs, co-located with code. Never in external wiki.
- **Template:** Nygard format (most widely adopted, enough structure without over-engineering).
- **Numbering:** Sequential (0001, 0002). Gaps indicate superseded or rejected ADRs.
- **Review Process:** PR-based with 1-2 reviewers. 24-hour SLA for ADR reviews. Async, documented, forces written rationale.
- **ADR Index:** README.md in `docs/adrs/` directory listing all ADRs with titles, statuses, and dates.
- **Supersession:** Old ADR links to new ADR; new ADR references old ADR. Both remain in the repository.

## Performance

- **Repository Bloat:** ADR files are 2-5KB each. Even 100 ADRs add less than 1MB. No performance impact.
- **Review Latency:** Lightweight (1-2 reviewers, 24-hour SLA). Heavy review processes discourage ADR creation.
- **Searchability:** Markdown ADRs searchable via grep. README index improves findability.

## Security

- **Sensitive Decisions:** If an ADR discusses security architecture (encryption, authentication, secrets management), ensure it doesn't expose sensitive details. Use general terms and reference secure documentation.
- **ADR Access:** ADRs in the repository inherit the repository's access controls. Don't store security-critical decisions in publicly accessible repositories.
- **Compliance:** ADRs can serve as evidence of architectural governance for compliance audits (PCI, SOC2, HIPAA). Ensure status lifecycle is maintained for audit-readiness.

## Common Mistakes

### Mistake 1: Over-Documenting Trivia
- **Description:** Creating ADRs for trivial choices (tabs vs spaces, variable naming)
- **Cause:** Misunderstanding ADR purpose; enthusiasm for the process
- **Consequence:** ADR log becomes noise; important decisions are harder to find
- **Better:** Reserve ADRs for decisions with lasting architectural impact

### Mistake 2: Skipping Alternatives
- **Description:** Documenting only the chosen option without mentioning rejected options
- **Cause:** Time pressure; assuming the choice is obvious
- **Consequence:** Future team members don't know what was considered; repeated discussions
- **Better:** Always document 2-3 alternatives with the rationale for rejection

### Mistake 3: Not Updating Status
- **Description:** Merging as Accepted but never marking as Superseded
- **Cause:** No process for status maintenance; ADRs forgotten after creation
- **Consequence:** Stale ADRs mislead new team members about current practices
- **Better:** Create superseding ADR when decisions change; quarterly ADR status review

### Mistake 4: Too Much Detail
- **Description:** Writing 10-page ADRs instead of 1-2 pages
- **Cause:** Confusing ADRs with design documents or specifications
- **Consequence:** Discourages ADR creation; defeats the lightweight purpose
- **Better:** Keep ADRs focused on the decision, context, and rationale. Move implementation details to other documents.

## Anti-Patterns

- **The ADR Graveyard:** A docs/adrs/ directory with 3 ADRs from 2 years ago, all still "Proposed." No decisions actually documented. Establish a decision capture habit.
- **The 10-Page ADR:** Detailed design document disguised as an ADR. Nobody reads it, nobody creates them. Keep ADRs short.
- **The Wiki ADR:** ADR stored in Confluence or Notion. Not versioned, not reviewed, not co-located with code. Use repository-based ADRs.
- **The Secret Decision:** A major architectural decision was made verbally in a meeting and never documented. Six months later, no one remembers why. If it's not in an ADR, it didn't happen.

## Examples

### Example 1: Nygard ADR Template
```markdown
# ADR 0001: Use Laravel Pint for Code Style

## Status
Accepted

## Context
The team needs consistent code style across all projects.
Options for automated style enforcement need evaluation.

## Decision
We will use Laravel Pint with the "laravel" preset.
It's first-party Laravel tooling with zero configuration,
enforces PSR-12, and integrates with CI.

## Consequences
Positive: automated style enforcement, zero-config setup, CI integration
Negative: team must learn Pint configuration for edge-case overrides
```

### Example 2: ADR Directory Structure
```
docs/adrs/
├── README.md                      # Index and usage guide
├── 0001-use-laravel-pint.md       # [Accepted] Use Pint for style
├── 0002-adopt-service-layer.md    # [Accepted] Service layer pattern
├── 0003-choose-spatie-media.md    # [Superseded by 0007]
│                                    Used Spatie Media Library
├── 0004-forge-over-vapor.md       # [Accepted] Forge for deployment
├── 0005-phpstan-level-6.md        # [Accepted] PHPStan baseline
├── 0006-rejected-laravel-echo.md   # [Rejected] WebSocket decision
└── 0007-use-laravel-medialibrary.md # [Accepted] Replaced ADR 0003
```

## Related Topics

- **coding-standards-documentation:** Standards documented via ADRs
- **development-workflow-documentation:** Workflow that includes ADR process
- **contributing-dot-md-patterns:** References to ADRs for contribution decisions
- **team-collaboration-patterns:** Decision-making culture supported by ADRs

## AI Agent Notes

- **Context Requirements:** When advising on ADRs, first understand whether the team already has a decision documentation culture, what decisions are frequently re-debated, and the team's tolerance for process overhead.
- **Key Decision Points:** ADR format (Nygard vs Y-Statement), storage (repo vs wiki), review process (PR vs meeting), numbering scheme.
- **Common Pitfalls in AI Assist:** Don't recommend ADRs for trivial decisions. Always include alternatives. Keep ADRs short. Emphasize that rejected decisions are equally valuable.
- **Laravel-Specific Nuances:** Many Laravel decisions are already made by the framework (less need for ADRs than in unopinionated frameworks). Laravel ADRs typically focus on package selection, architecture patterns, and infrastructure choices.

## Verification
- [ ] KU accurately defines ADR patterns and purpose
- [ ] Core concepts cover Nygard format, status lifecycle, decision log
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize alternatives and status maintenance
- [ ] Architecture guidelines cover storage, review, numbering
- [ ] Performance addresses repo bloat and review latency
- [ ] Security covers sensitive decisions and audit readiness
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify ADR graveyard and secret decisions
- [ ] Examples show Nygard template and directory structure
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
