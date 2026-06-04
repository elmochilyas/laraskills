# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 07-architecture-enforcement-governance
**Knowledge Unit:** Import violation detection
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] No import detection prevented
- [ ] Only direct checks prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Default to strict import allowlists per bounded context.** Start every context with an empty allowlist. Add allowed dependencies explicitly as needed. Prevents accidental coupling from day one.
- [ ] Workflow step completed: **Encode the dependency map as Pest architecture tests.** Executable, readable, verified in CI. Use `->not->toUse()` for forbidden imports.
- [ ] Workflow step completed: **Detect transitive dependencies.** If Context A imports from Context B which imports from Context C, A effectively depends on C. Detection must flag this. Test both direct and transitive paths.
- [ ] Workflow step completed: **Run import violation detection in CI as a pre-merge gate.** Configure CI to block merges on import violations. Never rely on developer discipline or IDE warnings alone.
- [ ] Workflow step completed: **Use namespace-based import detection.** Detect violations by matching the namespace of the imported class against the dependency map. Namespace-level detection covers all classes in a context automatically.

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

- [ ] Failure addressed: No detection.
- [ ] Failure addressed: Transitive dependency blind spot.
- [ ] Failure addressed: Detection without enforcement.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Dependency map exists for all contexts
- [ ] Pest architecture tests enforce import rules
- [ ] Transitive dependencies are detected
- [ ] Detection runs in CI and blocks merges
- [ ] Shared kernel is the only universal allowlist
- [ ] IDE provides real-time import violation feedback
- [ ] Strict allowlists per context (not permissive)

### Success Criteria
- [ ] Every bounded context starts with an empty import allowlist Ã¢â‚¬â€ all allowed dependencies are explicitly declared.
- [ ] The dependency map is encoded as Pest architecture tests and maintained as a documented matrix.
- [ ] Both direct and transitive import violations are detected.
- [ ] Import detection runs in CI and blocks merges on violations.
- [ ] All detection uses namespace-level matching, not class-level.
- [ ] The shared kernel is the only context all other contexts may freely import from.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: No import detection
- [ ] Anti-pattern prevented: Only direct checks

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: No detection.
- [ ] Failure scenario handled: Transitive dependency blind spot.
- [ ] Failure scenario handled: Detection without enforcement.

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
