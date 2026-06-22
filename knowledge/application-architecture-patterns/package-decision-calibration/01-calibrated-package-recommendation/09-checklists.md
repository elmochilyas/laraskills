# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Calibrated Package Recommendation
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] All eight dimensions present in the recommendation
- [ ] No bare package-name-only recommendation

---

# Architecture Checklist

- [ ] ADR integration: recommendation maps to Architecture Decision Record sections
- [ ] Team review completed by engineer who did not research the package
- [ ] Living document status confirmed (not one-time, will be updated)
- [ ] Package lifecycle stage documented (active maintenance, mature, declining)

---

# Implementation Checklist

- [ ] Workflow step completed: Default recommendation clearly stated as the starting point
- [ ] Workflow step completed: Fit conditions are concrete and falsifiable (objectively checkable)
- [ ] Workflow step completed: Non-fit conditions reference specific technical requirements, not preferences
- [ ] Workflow step completed: Alternative is named and realistic (not "build custom" as placeholder)
- [ ] Workflow step completed: Escape hatch describes a concrete, code-level migration path
- [ ] Workflow step completed: Tradeoffs are explicitly listed and acknowledged
- [ ] Workflow step completed: Testing impact names specific fakes, test strategies, or test infrastructure
- [ ] Workflow step completed: Operational impact covers new failure modes, queues, caches, and monitoring

---

# Performance Checklist

- [ ] Decision latency acceptable (30-90 min per recommendation is a one-time cost)
- [ ] Analysis paralysis avoided for non-architectural decisions (abbreviated version used)
- [ ] Package performance characteristics measured (not assumed from documentation)

---

# Security Checklist

- [ ] Vulnerability surface documented in operational impact dimension
- [ ] Supply chain risk evaluated (maintainer count, dependency tree, release frequency)
- [ ] Credential exposure documented in testing impact dimension

---

# Reliability Checklist

- [ ] Failure addressed: Cargo-cult package selection:
- [ ] Failure addressed: Unfalsifiable fit criteria:
- [ ] Failure addressed: Missing escape hatch:
- [ ] Failure addressed: Stale unreviewed recommendations:
- [ ] Failure addressed: Unnamed unacknowledged tradeoffs:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All eight dimensions are present for the recommendation
- [ ] Fit criteria are falsifiable (can be objectively checked)
- [ ] Non-fit criteria reference concrete requirements, not preferences
- [ ] Alternative is named and realistic (not just "build custom")
- [ ] Escape hatch describes a concrete migration path
- [ ] Tradeoffs are explicit (every package has tradeoffs — none means analysis is incomplete)
- [ ] Testing impact names specific fakes or testing strategies
- [ ] Operational impact covers new failure modes introduced by the package
- [ ] Recommendation includes a review date or trigger for re-evaluation
- [ ] Package GitHub health assessed (last release, open issues, PR merge rate)

### Success Criteria
- [ ] All eight dimensions answered before package adoption
- [ ] Zero "gut feel" decisions for architectural packages
- [ ] Escape hatches exercised (or tested) for at least one flow per package
- [ ] Recommendations reviewed and updated within last 12 months

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Blind defaultism (always recommending same package)
- [ ] Anti-pattern prevented: Analysis without action (writing analysis but ignoring results)
- [ ] Anti-pattern prevented: Recommendation without expiration (never re-evaluated)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Package abandoned by maintainer:
- [ ] Failure scenario handled: Business requirements change beyond package scope:
- [ ] Failure scenario handled: Escape hatch exercised under real load:

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
