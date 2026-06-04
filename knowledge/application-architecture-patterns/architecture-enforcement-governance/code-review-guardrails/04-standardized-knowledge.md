# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Code review guardrails for architecture
Knowledge Unit ID: AEG-04
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Code review guardrails are architectural checks enforced during code review. Not everything can be automated. Code review catches architectural violations that static analysis and tests miss: wrong abstraction level, misplaced responsibility, premature optimization, and design inconsistencies. Guardrails are documented checklists that reviewers apply. The goal is to shift architecture review left — reviewers check architecture before they check code style.

---

# Core Concepts

- **Review checklist:** A list of architectural concerns to check during review. One checklist per change type (new module, cross-context change, refactoring).
- **Architecture-first review:** The reviewer evaluates the architectural impact before reading implementation details. If the architecture is wrong, the implementation is irrelevant.
- **Escalation path:** When a reviewer identifies a potential architectural violation but is not certain, they escalate to a senior developer or architect.

---

# When To Use

- Catching non-automatable violations (design quality, abstraction level, consistency).
- Knowledge sharing during reviews.

---

# When NOT To Use

- Rules that can be automated (use tests/static analysis instead).
- High-volume trivial changes (use automated checks only).

---

# Best Practices

- **Default to automated enforcement.** WHY: If a rule can be automated (test, static analysis), automate it. Reserve code review for non-automatable concerns: design quality, abstraction level, consistency. Automated checks are faster and more reliable.
- **Use architecture checklists per PR template.** WHY: PR templates include architecture checklist sections that the author fills in. The reviewer verifies. Checklist ensures consistent coverage across reviews.
- **Apply architecture-first review.** WHY: The reviewer spends the first 5-10 minutes on architecture alone. If the architecture is wrong, they stop and reject the PR early rather than consuming time on implementation details.
- **Document outcomes in ADRs.** WHY: When a reviewer requests an architectural change, the outcome is documented as an ADR. Prevents recurring discussions about the same decision.

---

# Architecture Guidelines

- Architecture checklist per change type.
- Architecture-first review (before implementation details).
- Escalation path for uncertain violations.
- ADR documentation for architecture decisions from review.
- Architecture review label for significant PRs.

---

# Performance Considerations

- Human review time is the cost. Architecture-first review reduces wasted time on wrong designs.

---

# Security Considerations

- Code review should also cover security architecture. The checklist should include security items.

---

# Common Mistakes

1. **No architecture checklist:** Reviewers review architecture without guidance. Cause: no defined process. Consequence: consistent concerns are missed; each reviewer checks different things. Better: documented checklist per change type.

2. **Architecture review after implementation:** The reviewer reads the implementation and then considers architecture. Cause: ordering issue. Consequence: less likely to suggest fundamental changes after seeing code. Better: architecture-first review.

3. **Relying solely on automated enforcement:** Automated tools catch import violations but not design quality violations. Cause: over-reliance on tools. Consequence: design quality degrades. Better: code review for human-level concerns.

---

# Anti-Patterns

- **No human review**: All architecture checks are automated. Design quality violations slip through.
- **Checklist fatigue**: Too many checklist items. Reviewers skip them. Fewer, high-impact items are better.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-01 Architecture testing | AEG-02 CI enforcement | AEG-06 ADRs |
| DBC-01 Bounded context basics | AEG-07 Team convention docs | AEG-10 Onboarding docs |

---

# AI Agent Notes

- Automate what can be automated; use code review for the rest.
- Define architecture checklists per change type.
- Apply architecture-first review order.
- Document architecture decisions from reviews as ADRs.

---

# Verification

- [ ] Architecture checklist exists per change type
- [ ] Reviewers apply architecture-first approach
- [ ] Escalation path defined for uncertain violations
- [ ] Architecture decisions from review documented as ADRs
- [ ] PR templates include architecture checklist sections
