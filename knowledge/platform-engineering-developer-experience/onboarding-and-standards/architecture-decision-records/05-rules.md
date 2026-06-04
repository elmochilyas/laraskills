# Rules: Architecture Decision Records (ADRs)

## Metadata
- **Source KU:** architecture-decision-records
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- ADR-RULE-001: **Document alternatives, not just the decision** — Future developers need to know what was considered and rejected.
- ADR-RULE-002: **Keep ADRs to 1-2 pages** — Short ADRs are actually written; 10-page ADRs are never created.
- ADR-RULE-003: **Review via PR, not meetings** — Forces written rationale, creates documented discussion, natural approval.
- ADR-RULE-004: **Update status when decisions change** — When decision reverses, create superseding ADR and update old status.
- ADR-RULE-005: **Include rejected decisions** — Prevents repeated discussions.

## Architecture Rules
- ADR-RULE-006: **Storage:** `docs/adrs/` directory. Versioned, PR-reviewed, co-located with code. Never in external wiki.
- ADR-RULE-007: **Template:** Nygard format (Title, Status, Context, Decision, Consequences).
- ADR-RULE-008: **Numbering:** Sequential (0001, 0002). Gaps indicate superseded or rejected ADRs.
- ADR-RULE-009: **PR-based review** with 1-2 reviewers. 24-hour SLA for ADR reviews.

## Decision Rules
- ADR-RULE-010: **Use for significant architectural decisions** with long-term impact.
- ADR-RULE-011: **Use for package/tool selection** with multiple viable options.
- ADR-RULE-012: **Don't use for trivial choices** (tabs vs spaces, variable naming) or decisions enforced by tooling.
