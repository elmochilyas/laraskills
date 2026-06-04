# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Architecture Decision Records (ADRs)
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Oral architecture prevented
- [ ] ADR graveyard prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Write ADRs before implementing the decision.** If the ADR rationale is weak, rethink before coding. Prevents costly implementation of poorly-thought-out decisions.
- [ ] Workflow step completed: **Include rejected options with rationale.** Document why options were rejected. Future readers need to know alternatives were considered and why they were dismissed Ã¢â‚¬â€ prevents recurring debates.
- [ ] Workflow step completed: **Review ADRs as part of the pull request.** Include the ADR in the same PR as the implementation code. Reviewers check that implementation matches the ADR.
- [ ] Workflow step completed: **Keep ADRs short (1-2 pages).** If a decision needs more space, split into multiple focused ADRs. Concise ADRs are actually read by the team.
- [ ] Workflow step completed: **Store ADRs in `docs/adr/` in the repository.** Versioned alongside the code. Never store in wiki, Confluence, or separate documentation systems.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: No ADRs.
- [ ] Failure addressed: ADRs too long.
- [ ] Failure addressed: ADRs written after implementation.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] ADRs exist for all significant architecture decisions
- [ ] ADRs follow the template (Title, Status, Context, Decision, Consequences)
- [ ] ADRs include rejected options
- [ ] ADRs are stored in `docs/adr/` and versioned in the repo
- [ ] ADRs are short (1-2 pages)
- [ ] One decision per ADR
- [ ] Superseded ADRs are clearly marked

### Success Criteria
- [ ] Every significant architecture decision has an ADR written before implementation begins.
- [ ] ADRs include rejected options with clear rationale Ã¢â‚¬â€ not just the chosen option.
- [ ] ADRs are stored in `docs/adr/` in the repository, versioned with code, and included in implementation PRs.
- [ ] Each ADR is 1-2 pages covering exactly one decision.
- [ ] Superseded ADRs are marked with a pointer to the superseding ADR Ã¢â‚¬â€ never deleted.
- [ ] No ADR contains credentials, API keys, or security-sensitive information.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Oral architecture
- [ ] Anti-pattern prevented: ADR graveyard

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No ADRs.
- [ ] Failure scenario handled: ADRs too long.
- [ ] Failure scenario handled: ADRs written after implementation.

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
