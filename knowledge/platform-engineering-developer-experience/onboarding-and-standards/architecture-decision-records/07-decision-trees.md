# Decision Trees: Architecture Decision Records (ADRs)

## Metadata
- **KU ID:** onboarding-team-standards/architecture-decision-records
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | When to write an ADR | Always / Only significant decisions / Never | Need to balance documentation overhead vs value of institutional memory |
| 2 | ADR format choice | Nygard / Y-Statement / Problem-Solution / Custom | Different formats suit different decision complexity levels |
| 3 | ADR review mechanism | PR-based / Meeting-based / Wiki-based | Team workflow integration and documentation culture |
| 4 | Status management strategy | Active tracking / On-change updates / No tracking | Ensuring ADR log remains accurate over time |
| 5 | Storage location | Repository / Wiki / Shared drive | Versioning, discoverability, and accessibility needs |

## Architecture-Level Decision Trees

### Tree 1: When to Create an ADR

- **Start:** A decision needs to be made
- **Is the decision trivial (tabs vs spaces, variable naming)?**
  - Yes → Skip ADR. Document in coding standards only.
  - No → Continue.
  - **Will the decision be reversed within weeks?**
    - Yes → Skip ADR. Document as PR comment or issue note.
    - No → Continue.
    - **Is the decision already enforced by tooling (Pint, PHPStan)?**
      - Yes → Skip ADR. Tooling is the documentation.
      - No → Continue.
      - **Does the decision have long-term architectural impact?**
        - No → Skip ADR. Document in PR description.
        - Yes → Continue.
        - **Are there multiple viable options with trade-offs?**
          - No → Skip ADR. Simple choice needs no formal record.
          - Yes → Write ADR.

### Tree 2: ADR Format Selection

- **Start:** You have decided to write an ADR
- **Is the decision simple with clear context and consequences?**
  - Yes → Use Nygard format (Title, Status, Context, Decision, Consequences). Most widely adopted, enough structure without over-engineering.
  - No → Continue.
- **Is the decision complex with many alternatives?**
  - Yes → Continue.
  - No → Continue.
- **Does the team prefer structured templates?**
  - Yes → Use Y-Statement format (In the context of [situation], facing [problem], we decided [option] to achieve [quality], accepting [trade-off]).
  - No → Use Nygard format with expanded Alternatives section.

### Tree 3: ADR Review Process

- **Start:** An ADR has been drafted
- **Is the decision urgent (fix for a production issue)?**
  - Yes → Expedited review: assign 1 reviewer, 4-hour SLA. Merge on approval. Post-hoc team notification.
  - No → Continue.
- **Does the ADR affect security or compliance?**
  - Yes → Require security review + 2 standard reviewers. 48-hour SLA.
  - No → Continue.
- **Standard process:** PR-based review with 1-2 reviewers. 24-hour SLA. Review comments are written (async). PR merges on approval. ADR status set to Accepted.

### Tree 4: ADR Status Lifecycle Management

- **Start:** An ADR exists with a given status
- **Has the decision been reversed or updated?**
  - No → Maintain current status. Include in quarterly status review.
  - Yes → Continue.
- **Is the old decision still partially valid?**
  - Yes → Create new ADR. Mark old ADR as Superseded. Link new ADR to old ADR. Old ADR remains in repository for historical context.
  - No → Create new ADR. Mark old ADR as Superseded or Deprecated. Add note explaining why the decision was reversed.
- **Has the decision been rejected?**
  - Yes → Mark ADR as Rejected. Keep in repository to prevent repeated discussions. Reference why it was rejected.
  - No → Maintain current status.
- **Quarterly review:** Review all ADRs. Update any with stale statuses. Archive Deprecated ADRs older than 2 years.
