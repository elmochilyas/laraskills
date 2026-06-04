# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Action class naming: verb-noun commands
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Action name collision prevented
- [ ] Verb inconsistency prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Use Verb-Noun naming with Action suffix.** The verb describes the operation; the noun describes the target. Examples: `CreateUserAction`, `ProcessPaymentAction`, `GenerateInvoiceAction`. The Action suffix prevents naming conflicts with models.
- [ ] Workflow step completed: **Group actions by domain subdirectory.** Use `app/Actions/Billing/`, `app/Actions/User/`, etc. A flat directory with 100+ action files is unmanageable. Domain subdirectories make actions discoverable.
- [ ] Workflow step completed: **Establish a controlled verb vocabulary.** Document approved verbs: Create, Update, Delete, Process, Send, Generate, Cancel, Approve, Reject, Archive. Use consistently Ã¢â‚¬â€ don't let `Create`/`Make`/`Generate` be used interchangeably.
- [ ] Workflow step completed: **Use `execute()` or `handle()` consistently as the single public method.** Pick one convention and apply across all actions. Developers should know to call `$action->execute()` without checking the class.
- [ ] Workflow step completed: **Avoid action names that are too long.** A name like `ProcessAndNotifyPaymentAction` signals the action is doing too much. Split into separate actions orchestrated by a service.

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

- [ ] Failure addressed: Generic action names.
- [ ] Failure addressed: Inconsistent verb choices.
- [ ] Failure addressed: Too-specific names.
- [ ] Failure addressed: Action name collision.
- [ ] Failure addressed: Inconsistent method name.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All actions use Verb-Noun naming with Action suffix
- [ ] Actions are grouped by domain subdirectory
- [ ] Controlled verb vocabulary is documented and followed
- [ ] Single public method uses `execute()` or `handle()` consistently
- [ ] No action name is unreasonably long (3-4 words max)
- [ ] No generic action names (`ProcessAction`, `HandleAction`)

### Success Criteria
- [ ] All action classes follow Verb-Noun naming with consistent Action suffix.
- [ ] Actions are grouped by domain subdirectory for navigability.
- [ ] Controlled verb vocabulary prevents inconsistent verb choices.
- [ ] Single public method uses the same name (`execute` or `handle`) across all actions.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Action name collision
- [ ] Anti-pattern prevented: Verb inconsistency

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Generic action names.
- [ ] Failure scenario handled: Inconsistent verb choices.
- [ ] Failure scenario handled: Too-specific names.

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
