# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 05-domain-boundaries-bounded-contexts
**Knowledge Unit:** Eloquent model ownership per context
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Shared User model prevented
- [ ] Cross-context JOINs prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Assign each Eloquent model to exactly one bounded context.** The owning context runs the migrations and has exclusive write access. Models live in the context's `Models` directory.
- [ ] Workflow step completed: **Reference cross-context data by ID, not by model import.** Store only the foreign ID as a plain integer. Never import another context's model class. No `use App\Domains\Identity\Models\User` from Billing context.
- [ ] Workflow step completed: **Never use cross-context Eloquent relationships.** No `belongsTo`, `hasMany`, or `belongsToMany` across context boundaries. Eloquent relationships create implicit schema-level coupling.
- [ ] Workflow step completed: **Use event-based synchronization for cross-context data.** When context A needs a local copy of context B's data, listen for events from B and update a local projection. Store only the fields needed.
- [ ] Workflow step completed: **Ensure each database table has exactly one owning context.** No table has multiple contexts performing writes. Write conflicts and undefined migration ordering are the result.

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

- [ ] Failure addressed: One User model to rule them all.
- [ ] Failure addressed: Cross-context model relationships.
- [ ] Failure addressed: Direct table access.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each model belongs to exactly one bounded context
- [ ] No cross-context model imports (belongsTo, hasMany)
- [ ] Cross-context references use IDs, not foreign keys
- [ ] No shared User model across all contexts
- [ ] Event-based sync for cross-context data duplication
- [ ] Local reference models store only needed fields
- [ ] Foreign keys are within-context only
- [ ] Cross-context data accessed through service contracts

### Success Criteria
- [ ] Each Eloquent model lives in exactly one bounded context's directory.
- [ ] No cross-context Eloquent relationships or model imports exist.
- [ ] Cross-context data references use plain integer IDs without FK constraints.
- [ ] Event-based synchronization maintains local projections with only needed fields.
- [ ] All cross-context data access goes through service contracts, never direct table reads.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Shared User model
- [ ] Anti-pattern prevented: Cross-context JOINs

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: One User model to rule them all.
- [ ] Failure scenario handled: Cross-context model relationships.
- [ ] Failure scenario handled: Direct table access.

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
