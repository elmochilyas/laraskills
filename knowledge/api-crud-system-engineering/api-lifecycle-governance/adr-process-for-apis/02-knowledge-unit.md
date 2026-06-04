# ADR Process for APIs

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
The Architecture Decision Record (ADR) process for APIs provides a structured way to document significant API design decisions. ADRs capture the context, options considered, decision rationale, and consequences — creating an organizational memory that outlives individual team members and prevents repeated debates.

## Core Concepts
- **ADR (Architecture Decision Record):** A short document capturing a single architectural decision and its rationale.
- **Status Lifecycle:** Proposed → Accepted → Deprecated → Superseded. Decisions evolve over time.
- **Decision Context:** The forces, constraints, and assumptions that frame the decision.
- **Options Considered:** Alternatives that were evaluated before making the decision.
- **Decision Rationale:** The reasoning behind the chosen option, including tradeoffs accepted.
- **Consequences:** The positive and negative outcomes expected from the decision.

## Mental Models
- **Court Ruling:** Like a judge's written opinion — it explains the law (context), arguments from both sides (options), the ruling (decision), and the precedent it sets (consequences).
- **Time Capsule:** ADRs are time capsules that future engineers open to understand why the API was designed the way it was.

## Internal Mechanics
1. **Trigger:** Any significant API design decision triggers an ADR — naming convention choice, pagination strategy, auth method, etc.
2. **Drafting:** The author writes a one-page ADR using a template stored in the repository.
3. **Review:** The ADR is reviewed like a code change — PR with comments and approvals.
4. **Merge:** The ADR is merged into the `docs/adr/` directory with a unique number (e.g., `ADR-0014-pagination-strategy.md`).
5. **Implementation:** The implementation work references the ADR number in commit messages and code comments.
6. **Supersession:** When a decision is revisited, a new ADR supersedes the old one, and both remain in the repository.

## Patterns
- **One ADR Per Decision:** Each ADR captures exactly one decision; multiple decisions = multiple ADRs.
- **Numbered and Categorized:** ADRs use a sequential prefix + short name (e.g., `0014-pagination-strategy.md`).
- **Lightweight Template:** Keep ADRs to 1–2 pages; if it needs more, the decision is too broad.
- **YAML Frontmatter:** Machine-readable metadata (status, date, supersedes, superseded-by) for tooling.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Template format | Michael Nygard / ADR GitHub / Custom | Custom (expanded Nygard) | Nygard format + API-specific sections |
| Storage location | Wiki / Repo / Confluence | Repo (`docs/adr/`) | Version-controlled, reviewable in PRs |
| ADR numbering | Sequential / Date-based | Sequential with registry | Easy to reference and link |
| Supersession handling | Inline update / New ADR | New ADR | Preserves decision history |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Lightweight vs comprehensive | Lightweight ADRs get written but lack detail; comprehensive ADRs are thorough but discourage writing |
| Repo vs wiki ADRs | Repo ADRs are versioned and reviewable; wiki ADRs are easily editable by anyone |
| Mandatory vs voluntary ADRs | Mandatory ensures coverage; voluntary means critical decisions may go undocumented |

## Performance Considerations
- ADRs are static documents — no runtime performance impact.
- ADR tooling (search, indexing) is negligible.

## Production Considerations
- **Monitoring:** Track ADR creation rate; alert if no ADRs are created for 2 months (indicates decisions are undocumented).
- **Logging:** Not applicable — ADRs are documents, not runtime artifacts.
- **Backup:** ADRs are in git — no separate backup.
- **Rollback:** Revert an ADR by creating a superseding ADR; do not delete old ADRs.
- **Testing:** CI linting verifies ADR template compliance (required sections, valid status transitions).

## Common Mistakes
- Writing ADRs that are too long (novels nobody reads).
- Using ADRs for trivial decisions that do not warrant documentation.
- Forgetting to update ADR status when a decision changes.
- Writing ADRs after implementation (rationale is forgotten or post-hoc rationalized).
- Not reviewing ADRs during the design phase — they become historical records rather than decision tools.

## Failure Modes
- **ADR Graveyard:** ADRs are written but nobody reads them. Mitigation: reference ADR numbers in PR descriptions and code comments.
- **Stale ADRs:** Old ADRs describe decisions that no longer apply. Mitigation: periodic ADR review as part of API audits.
- **ADR Overload:** Too many ADRs → difficult to find relevant ones. Mitigation: categorize and index ADRs; archive irrelevant ones.
- **Decoupled Decisions:** A decision is made without an ADR (in a chat or meeting). Mitigation: "no ADR, no decision" policy for significant choices.

## Ecosystem Usage
- **ThoughtWorks (Michael Nygard):** Originated the ADR concept with a simple, widely-adopted template.
- **AWS:** ADRs are used internally for service design decisions; some are published in their "Builders' Library."
- **GitHub Engineering:** Known for extensive use of ADRs for API design decisions.

## Related Knowledge Units

### Prerequisites
- [Team API Consistency Rules](ku-06-team-api-consistency-rules)
- [API Style Guide Documentation](ku-17-api-style-guide-documentation)

### Related Topics
- [Breaking Change Process](ku-05-breaking-change-process)
- [API Audit Review Process](ku-08-api-audit-review-process)

### Advanced Follow-up Topics
- ADR management tooling (adr-tools, log4brains)
- Automated ADR decision impact analysis
- Federated ADR processes across multiple teams

## Research Notes

### Source Analysis
Michael Nygard's original ADR template (2011) remains the most widely adopted. The key innovation is the "status" field that allows decisions to have a lifecycle — it acknowledges that architectural decisions are not permanent.

### Key Insight
The biggest mistake teams make with ADRs is **writing them too late**. An ADR written after implementation is a historical record, not a decision tool. The ADR should be written *before* or *during* the design phase, capturing the deliberation in real time.

### Version-Specific Notes
- Laravel 11.x: ADRs for Laravel API decisions (e.g., "why FormRequest vs manual validation") should be stored in the project's `docs/adr/` directory.
- PHP 8.4: No direct language support; ADRs are a process tool, not a code tool.
