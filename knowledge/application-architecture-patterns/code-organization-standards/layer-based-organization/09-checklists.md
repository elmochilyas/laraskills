# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Organizing by layer: app/Http, app/Models, app/Services
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Keep Controllers Free of Business Logic Beyond HTTP Orchestration followed
- [ ] Extract Every Non-Trivial Business Operation to a Service Class followed
- [ ] Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` followed
- [ ] God Service Class prevented
- [ ] Layer Leakage prevented

---

# Architecture Checklist

- [ ] Keep Controllers Free of Business Logic Beyond HTTP Orchestration followed
- [ ] Extract Every Non-Trivial Business Operation to a Service Class followed
- [ ] Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` followed
- [ ] Enforce Layer Boundaries via Architecture Tests followed
- [ ] Split Services When They Handle Multiple Unrelated Operations followed

---

# Implementation Checklist

- [ ] Keep Controllers Free of Business Logic Beyond HTTP Orchestration followed
- [ ] Extract Every Non-Trivial Business Operation to a Service Class followed
- [ ] Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` followed
- [ ] Enforce Layer Boundaries via Architecture Tests followed
- [ ] Split Services When They Handle Multiple Unrelated Operations followed
- [ ] Never Create Repository-Wrapper Service Classes followed
- [ ] Use Sub-Layer Grouping Within Large Layer Directories followed
- [ ] Keep Models Focused on Eloquent Concerns Only followed
- [ ] Workflow step completed: **Establish a delegation rule.** Define the team standard: all non-trivial business logic lives in a service class, never in a controller or model. This eliminates ambiguity Ã¢â‚¬â€ developers always know where business logic belongs.
- [ ] Workflow step completed: **Add `app/Services/` when controllers grow beyond request handling.** Extract business logic from controllers into service classes. Controllers should only validate input (via Form Requests), call services, and return responses.
- [ ] Workflow step completed: **Use sub-layer grouping within layers.** When a single layer directory exceeds 20-30 files, create subdirectories: `app/Http/Controllers/Api/`, `app/Http/Controllers/Web/`. This preserves discoverability while maintaining the layer-based paradigm.
- [ ] Workflow step completed: **Keep models focused on Eloquent concerns only.** Limit models to data mapping, relationships, scopes, and accessors/mutators. Extract business logic to services or actions.
- [ ] Workflow step completed: **Avoid catch-all directories.** Never create `app/Helpers/`, `app/Utilities/`, or `app/Common/`. Name directories by specific concern Ã¢â‚¬â€ catch-all directories become dumping grounds without clear ownership.

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

- [ ] Failure addressed: God Service accumulation
- [ ] Failure addressed: Elastic directory creep
- [ ] Failure addressed: Missing service extraction
- [ ] Failure addressed: Repository-wrapper service classes

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Controllers contain no business logic beyond HTTP orchestration
- [ ] Services do not wrap Model CRUD without adding business value
- [ ] All controllers consistently delegate to services (no inline business logic)
- [ ] No directory contains more than 30 unrelated files
- [ ] Architecture tests enforce layer boundaries
- [ ] No catch-all directories exist in `app/`
- [ ] Models are limited to Eloquent concerns only

### Success Criteria
- [ ] Controllers are thin Ã¢â‚¬â€ they only validate input, delegate to services, and return responses.
- [ ] Services contain business logic and are organized by entity or capability.
- [ ] Architecture tests prevent layer violations.
- [ ] No catch-all directories exist.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Keep Controllers Free of Business Logic Beyond HTTP Orchestration followed
- [ ] Extract Every Non-Trivial Business Operation to a Service Class followed
- [ ] Avoid Catch-All Directories Like `app/Helpers/` or `app/Common/` followed
- [ ] Enforce Layer Boundaries via Architecture Tests followed
- [ ] Split Services When They Handle Multiple Unrelated Operations followed
- [ ] Never Create Repository-Wrapper Service Classes followed
- [ ] Use Sub-Layer Grouping Within Large Layer Directories followed
- [ ] Keep Models Focused on Eloquent Concerns Only followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: God Service Class
- [ ] Anti-pattern prevented: Layer Leakage
- [ ] Anti-pattern prevented: Inconsistent Extraction
- [ ] Anti-pattern prevented: Repository-Wrapper Service Classes
- [ ] Anti-pattern prevented: Catch-All Directory Creep

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: God Service accumulation
- [ ] Failure scenario handled: Elastic directory creep
- [ ] Failure scenario handled: Missing service extraction

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
