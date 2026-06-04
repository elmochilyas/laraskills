# Knowledge Unit: Architecture Decision Records (ADRs)

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/architecture-decision-records
- **Maturity:** Maturing
- **Related Technologies:** ADR, Markdown, Decision Log, Architecture Governance, Laravel

## Executive Summary

Architecture Decision Records (ADRs) are lightweight documents that capture architectural decisions made during a project's lifecycle, including the context, options considered, decision rationale, and consequences. For Laravel teams, ADRs provide a systematic way to document decisions about package selection (why Spatie vs custom solution), architectural patterns (service layer vs action pattern), infrastructure choices (Forge vs Vapor vs dedicated servers), and coding standards. ADRs follow a structured template (typically based on Michael Nygard's format) and are stored in the project repository (e.g., `docs/adrs/` directory). They serve as institutional memory, onboarding material for new developers, and a decision log for architecture governance. Unlike lengthy design documents, ADRs are short (1-2 pages), timestamped, and sequentially numbered, making them easy to create, review, and reference. The lightweight nature of ADRs encourages teams to document decisions as they happen rather than retroactively.

## Core Concepts

- **ADR Format (Nygard):** Title, Status (proposed, accepted, deprecated, superseded), Context, Decision, Consequences—the canonical five-part structure
- **Sequential Numbering:** ADRs are numbered chronologically (0001-use-laravel-pint.md, 0002-adopt-service-pattern.md, etc.) for easy referencing and ordering
- **Decision Log:** The collection of all ADRs forms a decision log that tracks the evolution of architectural thinking over time; superseded ADRs remain in the log for historical context
- **Status Lifecycle:** ADRs progress through: Proposed → Accepted/Rejected → (if accepted) Deprecated/Superseded; this lifecycle documents architecture evolution
- **Lightweight Governance:** ADRs are not formal specification documents; they are quick captures of decisions with rationale, enabling team alignment without heavy process

## Mental Models

- **ADR as Git Commit for Decisions:** Just as git commits document code changes, ADRs document decision changes—what was decided, why, and what alternatives were considered
- **ADR as Onboarding Compass:** A well-maintained ADR directory answers the question "why is it built this way?" that every new developer asks; it reduces tribal knowledge
- **ADR as Decision Receipt:** Each ADR is a receipt for a decision—proving that the team considered alternatives and made a deliberate choice rather than defaulting to habit

## Internal Mechanics

1. **Trigger:** An architectural decision arises (e.g., "should we use Laravel Reverb or Pusher for WebSockets?")
2. **ADR Creation:** A team member creates a markdown file in `docs/adrs/` with a sequential number and descriptive title
3. **Drafting:** The author fills in context (why this decision is needed), options considered (at least 2-3), decision (what was chosen), and consequences (positive and negative)
4. **Review:** The ADR is proposed via pull request; team members review the rationale and alternatives
5. **Acceptance:** The PR is merged, marking the ADR as Accepted; the decision is binding until superseded
6. **Supersession:** A later ADR marks this one as Superseded, linking to the newer ADR; the old ADR remains in the repository for history

## Patterns

- **Nygard ADR Template:**
  ```markdown
  # ADR 0001: Use Laravel Pint for Code Style

  ## Status
  Accepted

  ## Context
  The team needs a consistent code style across all projects...

  ## Decision
  We will use Laravel Pint with the "laravel" preset...

  ## Consequences
  Positive: automated style enforcement, zero-config setup...
  Negative: team must learn Pint configuration for edge cases...
  ```
- **Y-Statements Pattern:**
  > In the context of [situation], facing [concern], we decided on [option] to achieve [outcome], accepting [downside].
  A single-sentence ADR summary format useful for quick decisions; the full ADR still includes options and rationale.
- **ADR Directory Structure Pattern:**
  ```
  docs/adrs/
    README.md          # Index and usage guide
    0001-use-pint.md
    0002-adopt-sail.md
  ```
  A README in the ADR directory explains the template and process to the team.
- **Supersession Linking Pattern:**
  ```markdown
  ## Status
  Superseded by ADR 0010
  ```
  Link to the newer ADR that replaced this decision; the superseded ADR remains as historical context.
- **Laravel-Specific ADR Trigger Patterns:**
  - Package selection: "Use Spatie Media Library vs custom upload solution"
  - Architecture: "Service Layer vs Action Pattern vs Repository Pattern"
  - Infrastructure: "Forge vs Vapor for deployment"
  - Code quality: "PHPStan level 5 vs level 6 as baseline"

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| ADR template | Nygard vs Y-Statement vs custom | Nygard (most widely adopted, enough structure without over-engineering) |
| Storage location | Repository (docs/adrs/) vs wiki vs Notion | Repository (versioned, reviewed via PRs, co-located with code) |
| Numbering | Sequential (0001) vs date-based | Sequential (easier to reference; gaps indicate superseded/rejected ADRs) |
| Review process | PR-based async vs meeting-based | PR-based (asynchronous, documented, forces written rationale) |

## Tradeoffs

- **ADRs vs Wiki:** ADRs in the repository are versioned, reviewed like code, and always available offline. Wiki pages are easier to edit but have no review process and may become outdated without detection.
- **ADRs vs Design Docs:** ADRs are short (1-2 pages) and cover single decisions; design docs are longer and cover entire features. ADRs complement rather than replace design documentation.
- **Documentation Overhead:** Without ADRs, decisions are tribal knowledge; with ADRs, creating them takes 15-30 minutes per decision. The overhead is justified for significant decisions but overkill for trivial choices.

## Performance Considerations

- **Repository Bloat:** ADR files are small (2-5KB each); even 100 ADRs add less than 1MB to the repository. No performance impact on clone/pull operations.
- **Review Latency:** ADR reviews should be lightweight (1-2 reviewers, 24-hour SLA). Heavy review processes discourage ADR creation and defeat the lightweight purpose.
- **Searchability:** Markdown ADRs are searchable via standard grep; a README index with titles and statuses improves findability.

## Production Considerations

- **ADR Enforcement:** ADRs document decisions but don't enforce them. Combine ADRs with automated tools (Pint config for style decisions, PHPStan rules for static analysis decisions) to encode decisions as executable constraints.
- **ADR Decay:** An unmaintained ADR directory becomes misleading. Review ADRs quarterly; mark outdated ones as deprecated or superseded.
- **ADR for Rejected Decisions:** Documenting rejected decisions is valuable ("we considered X but chose Y because...") to prevent repeated discussions.

## Common Mistakes

- **Over-documenting trivia:** Creating ADRs for trivial choices (tabs vs spaces, variable naming). Reserve ADRs for decisions with lasting architectural impact.
- **Skipping alternatives:** Documenting only the chosen option without mentioning what was rejected and why; the alternatives section provides the most value for future reference.
- **Not updating status:** Merging an ADR as Accepted but never marking it as Superseded when the decision is later reversed; the ADR log becomes inaccurate.
- **Too much detail:** Writing 10-page ADRs instead of 1-2 pages; verbose ADRs defeat the lightweight purpose and discourage creation.
- **ADR without PR review:** Merging ADRs without team review; the review process is where alignment happens and rationale is stress-tested.

## Failure Modes

- **ADR Abandonment:** The team starts writing ADRs but stops after 3-4 decisions. Mitigate: keep ADR creation as a PR checklist item; make it part of the definition of done for architectural changes.
- **ADR as Bikeshedding:** The team spends more time debating the ADR format than the actual decision. Mitigate: adopt a standard template; discourage format debates; focus on decision rationale.
- **ADR Outpaced by Code:** The code evolves faster than the ADRs; ADRs no longer reflect reality. Mitigate: treat ADRs as living documents; update status when decisions change; quarterly review cadence.

## Ecosystem Usage

- **Laravel Teams:** Many Laravel teams use ADRs informally without a formal template; adopting a structured ADR process improves consistency
- **Spatie:** Spatie's open-source packages often include decision documentation in their READMEs (why certain design choices were made)
- **Laravel Nova:** The Nova ecosystem benefits from ADRs for package governance (which Nova packages to standardize on)

## Related Knowledge Units

- coding-standards-documentation
- development-workflow-documentation
- contributing-dot-md-patterns
- team-collaboration-patterns

## Research Notes

- Michael Nygard popularized ADRs in his 2011 book "Documenting Architecture Decisions"; the format has since been widely adopted across the software industry
- The Y-Statement format was proposed by Jeff Tyree and Art Akerman as an alternative to Nygard's template; some teams combine both
- ADR tooling exists (adr-tools CLI, log4brains for decision logging UI) but most Laravel teams use plain markdown files due to simplicity
- The "Decision Record" concept has been formalized in ISO/IEC/IEEE 42010:2022 for software architecture documentation
