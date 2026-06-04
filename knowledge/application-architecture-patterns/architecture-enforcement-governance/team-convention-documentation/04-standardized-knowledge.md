# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Team convention documentation
Knowledge Unit ID: AEG-07
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Team convention documentation captures the team's agreed-upon coding and architecture standards in a living document. Unlike ADRs which capture individual decisions, conventions capture ongoing practices: naming, file layout, test structure, dependency rules, and review expectations. The convention doc is the single source of truth for how the team builds software. It is referenced during reviews, onboarding, and discussions.

---

# Core Concepts

- **Convention doc:** A living document in the repository (`docs/conventions.md`) that records the team's agreements. Updated by PR. Referenced in code review.
- **Living document:** The convention doc evolves with the team. Outdated conventions are removed. New conventions are added as they are agreed upon.
- **Referenced in reviews:** Code review comments link to specific convention sections. "See [Conventions §3.2](/docs/conventions.md#32-service-patterns)."

---

# When To Use

- Capturing team-wide coding and architecture standards.
- Onboarding new team members.
- Reducing debate during code review.

---

# When NOT To Use

- Individual architecture decisions (use ADRs instead).
- Temporary or experimental patterns.

---

# Best Practices

- **Keep one convention doc per project.** WHY: A single document is easier to find and maintain. Multiple documents (code style, architecture, testing) create confusion about which one is current.
- **Link conventions to architecture tests.** WHY: Each convention section maps to one or more architecture tests. If the test passes, the convention is followed. Avoid conventions that cannot be enforced — document what you can test.
- **Update via PR.** WHY: Changing a convention requires a PR. The PR includes the convention update and (optionally) a mass update of existing code. This ensures changes are reviewed and deliberate.
- **Review quarterly.** WHY: Every quarter, the team reviews the convention doc. Remove outdated entries. Add new patterns that emerged. A doc that says one thing while the codebase does another loses trust.

---

# Architecture Guidelines

- Convention doc in `docs/conventions.md`.
- Living document updated by PR.
- Each section maps to architecture tests.
- Referenced in code reviews.
- Quarterly review cycle.
- Conventions over automation when rule is hard to automate.

---

# Performance Considerations

- Documentation only. No performance impact.

---

# Security Considerations

- Conventions should include security practices (e.g., input validation must use a specific approach).

---

# Common Mistakes

1. **No convention doc:** Conventions exist only in senior developers' heads. Cause: not creating one. Consequence: new developers learn by osmosis — slow and uneven. Better: document conventions in the repo.

2. **Convention doc too long:** A 50-page document that no one reads. Cause: trying to document everything. Consequence: developers ignore it. Better: keep it concise — one convention per section, no fluff.

3. **Outdated conventions:** The doc says one thing, the codebase does another. Cause: not maintaining the doc. Consequence: developers stop trusting the doc. Better: quarterly review and update.

---

# Anti-Patterns

- **Tribal knowledge**: Conventions only known by senior team members. Knowledge silo.
- **Paper tiger**: Convention doc exists but no one references it in reviews or PRs.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-06 ADRs | AEG-04 Code review guardrails | AEG-10 Onboarding docs |
| COS-01 Dependency direction | AEG-01 Architecture testing | AEG-08 Drift detection |

---

# AI Agent Notes

- Maintain a single `docs/conventions.md` as the living convention doc.
- Link each convention section to architecture tests.
- Update conventions via PR with team review.
- Schedule quarterly review cycles.

---

# Verification

- [ ] `docs/conventions.md` exists and is referenced
- [ ] Convention sections map to architecture tests
- [ ] Conventions are updated via PR
- [ ] Quarterly review is scheduled
- [ ] Code review comments link to convention sections
