# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** When NOT To Build Custom
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Package liability signals evaluated (at least 3 before recommending exit)
- [ ] Current package cost measured over 2-4 weeks

---

# Architecture Checklist

- [ ] Exit triggers documented for every major architectural package BEFORE adoption
- [ ] Fork-and-maintain option evaluated before committing to full custom build
- [ ] Scope of custom build limited to features the package actually fails at
- [ ] Migration timeline includes parallel run period for old and new systems

---

# Implementation Checklist

- [ ] Workflow step completed: Package liability signals assessed (override %, assumption fights, maintenance status, escape hatch usage)
- [ ] Workflow step completed: Current package cost measured (hours spent on workarounds, upgrades, debugging)
- [ ] Workflow step completed: Custom build cost accounting includes initial build + 3 years of maintenance
- [ ] Workflow step completed: Fork feasibility evaluated (80% rule — if package is 80% right, fork costs ~25% of custom)
- [ ] Workflow step completed: Exit triggers documented for the package before full adoption
- [ ] Workflow step completed: Custom build scope scoped to specific methods the package fails at (not entire package surface)
- [ ] Workflow step completed: Data migration strategy defined for exiting the package

---

# Performance Checklist

- [ ] Custom build performance benchmarked against package (package may have years of optimization)
- [ ] Package-related N+1 queries and bloated serialization measured before deciding to exit
- [ ] Custom build profiling planned (packages already received optimization; custom code needs it)

---

# Security Checklist

- [ ] Security implication of custom build documented (no community security scrutiny, all vulnerabilities yours)
- [ ] Compliance implications evaluated (SOC2, PCI-DSS, HIPAA auditors prefer established packages)
- [ ] Security patch latency budgeted (2-4 hours/month for custom code security review)

---

# Reliability Checklist

- [ ] Failure addressed: Underestimated ongoing maintenance:
- [ ] Failure addressed: Rebuilding entire package surface unnecessarily:
- [ ] Failure addressed: Exiting because of a few minor overrides:
- [ ] Failure addressed: Sunk cost trap (keeping package because "we've invested in it"):
- [ ] Failure addressed: Not-invented-here syndrome:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] At least 3 liability signals present before recommending package exit
- [ ] Current package cost measured (hours spent on workarounds, upgrades, debugging)
- [ ] Custom build cost includes initial build + 3 years of maintenance
- [ ] Fork-and-maintain option evaluated before full custom build
- [ ] Scope of custom build is limited to features the package actually fails at
- [ ] Exit triggers exist for every major package BEFORE adoption
- [ ] Migration timeline includes parallel run period
- [ ] Security and compliance implications of custom build documented
- [ ] Custom build code review standards match or exceed package quality
- [ ] Onboarding documentation planned for custom build (the package had docs for free)

### Success Criteria
- [ ] Custom build decision backed by measured cost data, not frustration
- [ ] 3-year cost projection shows custom build is cheaper than package (with maintenance)
- [ ] Fork evaluated and documented as a middle path before custom build
- [ ] Custom build scope is limited — it replaces what the package fails at, not everything

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Not-invented-here syndrome (rejecting packages because "we can build it better")
- [ ] Anti-pattern prevented: Rewrite as default response (replacing instead of fixing integration)
- [ ] Anti-pattern prevented: Cost-free custom illusion (treating developer time as free)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Custom build takes 3x longer than estimated:
- [ ] Failure scenario handled: Package adds feature we just built custom:
- [ ] Failure scenario handled: Custom build has production incident requiring deep knowledge:

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
