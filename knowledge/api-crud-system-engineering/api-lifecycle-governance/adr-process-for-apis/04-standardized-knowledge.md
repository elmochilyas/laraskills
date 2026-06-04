# ECC Standardized Knowledge — ADR Process for APIs

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | ADR Process for APIs |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

The Architecture Decision Record (ADR) process for APIs provides a structured way to document significant API design decisions. ADRs capture context, options considered, decision rationale, and consequences — creating organizational memory that outlives individual team members and prevents repeated debates. Each ADR follows a lightweight template, captures exactly one decision, and has a status lifecycle from proposed to superseded.

## Core Concepts

- **ADR (Architecture Decision Record)**: Short document capturing a single architectural decision and rationale.
- **Status lifecycle**: Proposed -> Accepted -> Deprecated -> Superseded.
- **Decision context**: Forces, constraints, and assumptions framing the decision.
- **Options considered**: Alternatives evaluated before making the decision.
- **Decision rationale**: Reasoning behind chosen option, including tradeoffs accepted.
- **Consequences**: Positive and negative outcomes expected from the decision.

## When To Use

- Any significant API design decision (naming conventions, pagination strategy, auth method)
- Decisions with multiple viable alternatives
- Choices with long-term impact on API surface or consumer experience
- Decisions that future team members will need to understand

## When NOT To Use

- Trivial implementation details (variable naming, code organization)
- Decisions covered by existing style guides or consistency rules
- Reversible choices with minimal consumer impact
- Personal preferences with no architectural significance

## Best Practices

- **One ADR per decision**: Multiple decisions = multiple ADRs. If it needs more than 2 pages, the decision is too broad.
- **Write before or during design phase**: An ADR written after implementation is history, not a decision tool.
- **Numbered sequential naming**: `0014-pagination-strategy.md` with YAML frontmatter for machine-readability.
- **Review like code**: ADRs reviewed as PRs with comments and approvals before merging.
- **No-deletion policy**: Never delete ADRs. Superseded ADRs remain in repository for history.
- **Reference ADR numbers in code**: Commit messages and code comments reference ADR numbers.

## Architecture Guidelines

- Store ADRs in `docs/adr/` directory in repository (version-controlled, reviewable in PRs).
- Use expanded Michael Nygard template with API-specific sections.
- ADRs affect API surface or security require team lead approval.
- Add `affects:` frontmatter field listing affected endpoints for searchability.
- CI linting verifies ADR template compliance (required sections, valid status transitions).

## Performance Considerations

- ADRs are static documents — no runtime performance impact.
- ADR tooling (search, indexing) has negligible overhead.

## Security Considerations

- ADRs may document security decisions. Ensure access control if stored in private repository.
- Security-related ADRs should be reviewed by security team before acceptance.
- Do not include credentials, secrets, or vulnerability details in ADRs.

## Common Mistakes

- Writing ADRs that are too long (novels nobody reads).
- Using ADRs for trivial decisions not warranting documentation.
- Forgetting to update ADR status when decision changes.
- Writing ADRs after implementation (rationale forgotten or post-hoc rationalized).
- Not reviewing ADRs during design phase — they become historical records rather than decision tools.

## Anti-Patterns

- **ADR graveyard**: ADRs written but nobody reads them. Reference ADR numbers in PRs and code.
- **No-ADR decisions**: Significant choices made in chat or meetings without documentation.
- **Post-hoc ADRs**: Written only when someone asks "why did we do this?" — too late.

## Examples

- ADR filename: `docs/adr/0014-pagination-strategy.md`.
- Frontmatter: `--- status: accepted, date: 2026-06-02, supersedes: 0008, affects: GET /users, GET /posts ---`.
- Template sections: Context | Options Considered | Decision | Consequences | Related ADRs.

## Related Topics

- **Prerequisites**: Team API Consistency Rules, API Style Guide Documentation
- **Closely Related**: Breaking Change Process, API Audit Review Process
- **Advanced**: ADR management tooling (adr-tools, log4brains), Automated ADR decision impact analysis, Federated ADR processes across teams

## AI Agent Notes

When using ADRs for API decisions: write one ADR per decision before/during design phase, use sequential numbering with descriptive names, review ADRs like code in PRs, reference ADR numbers in commit messages, never delete old ADRs (create superseding ones), keep ADRs to 1-2 pages, use YAML frontmatter for machine-readability.

## Verification

Sources: Michael Nygard ADR Template (2011), AWS Builders' Library, GitHub Engineering ADR practices, domain-analysis.md.
