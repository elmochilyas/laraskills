# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Architecture Decision Records (ADRs)
Knowledge Unit ID: AEG-06
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Architecture Decision Records (ADRs) document significant architecture decisions with their context, options considered, and rationale. ADRs are lightweight documents stored in the repository. They provide a permanent record of why a decision was made, preventing repeated debates. Each ADR follows a template: Title, Status, Context, Decision, Consequences.

---

# Core Concepts

- **ADR:** A short document (1-2 pages) capturing a single architecture decision. Stored in `docs/adr/` and numbered sequentially.
- **Decision:** The chosen option. Stated clearly with justification.
- **Consequences:** The tradeoffs accepted by the decision. Not just benefits — explicit tradeoffs and future implications.
- **Supersession:** An ADR can supersede a previous ADR. The superseded ADR is updated to `Superseded by ADR-NNN`. Provides a clear history of evolving decisions.

---

# When To Use

- Documenting significant architecture decisions with lasting impact.
- Capturing context and rationale for future reference.

---

# When NOT To Use

- Routine implementation choices (use code comments).
- Decisions that are clearly temporary.

---

# Best Practices

- **Write ADRs early.** WHY: Before implementing the decision, write the ADR. If the ADR is clear, the implementation follows. If the rationale is weak, rethink before coding. Prevents costly implementation of poorly-thought-out decisions.
- **Include rejected options.** WHY: Documenting why an option was rejected is as valuable as documenting why one was chosen. Future readers need to know that options were considered and why they were rejected.
- **Review ADRs as part of PR.** WHY: When a PR introduces an architectural decision, it includes a new ADR. The ADR is reviewed alongside the code. This keeps ADRs connected to implementation.
- **Keep ADRs short (1-2 pages).** WHY: An ADR that is longer than 2 pages is too broad and should be split. Concise ADRs are actually read by the team.
- **Store ADRs in the repository.** WHY: ADRs in `docs/adr/` are versioned alongside the code. Anyone cloning the repo can see the architecture history.

---

# Architecture Guidelines

- ADRs in `docs/adr/`, numbered sequentially.
- Template: Title, Status, Context, Decision, Consequences.
- One decision per ADR.
- Supersession for changing decisions.
- Reviewed alongside code in PR.

---

# Performance Considerations

- ADRs are documentation-only. No performance impact.

---

# Security Considerations

- ADRs should not contain secrets, credentials, or vulnerability details.

---

# Common Mistakes

1. **No ADRs:** Decisions are made in conversations or Slack. Cause: no documentation habit. Consequence: months later, no one remembers why. The decision is revisited indefinitely. Better: document every significant decision as an ADR.

2. **ADRs for documentation's sake:** Writing ADRs that no one reads. Cause: ADRs disconnected from workflow. Consequence: they become dead documentation. Better: store in the repository, link in PRs, reference in discussions.

3. **ADRs that are too long:** An ADR should be 1-2 pages. Cause: trying to document too much at once. Consequence: team stops reading ADRs. Better: split into multiple focused ADRs.

---

# Anti-Patterns

- **Oral architecture**: All architecture decisions are verbal. No written record.
- **ADR graveyard**: ADRs written once and never referenced. Stale and ignored.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-04 Code review guardrails | AEG-07 Team convention docs | AEG-10 Onboarding docs |
| COS-01 Dependency direction | AEG-08 Drift detection | AEG-09 Refactoring remediation |

---

# AI Agent Notes

- Create ADRs for every significant architecture decision.
- Follow the template: Status, Context, Decision, Consequences.
- Include rejected options with rationale.
- Store in `docs/adr/`, link in PRs.

---

# Verification

- [ ] ADRs exist for all significant architecture decisions
- [ ] ADRs follow the template (Title, Status, Context, Decision, Consequences)
- [ ] ADRs include rejected options
- [ ] ADRs are stored in `docs/adr/` and versioned in the repo
- [ ] ADRs are short (1-2 pages)
- [ ] Superseded ADRs are clearly marked
