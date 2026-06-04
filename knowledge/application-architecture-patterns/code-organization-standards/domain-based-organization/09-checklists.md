# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Organizing by domain: app/Domains/{Domain} structure
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Never Access Another Domain's Eloquent Models Directly followed
- [ ] Give Each Domain Its Own Service Provider followed
- [ ] Use Domain-Scoped Eloquent Models for Each Domain followed
- [ ] Circular Domain Dependency prevented
- [ ] Domain Boundary Erosion prevented

---

# Architecture Checklist

- [ ] Never Access Another Domain's Eloquent Models Directly followed
- [ ] Give Each Domain Its Own Service Provider followed
- [ ] Use Domain-Scoped Eloquent Models for Each Domain followed
- [ ] Use Domain Events for Cross-Domain Communication followed
- [ ] Document Domain Boundaries Explicitly followed

---

# Implementation Checklist

- [ ] Never Access Another Domain's Eloquent Models Directly followed
- [ ] Give Each Domain Its Own Service Provider followed
- [ ] Use Domain-Scoped Eloquent Models for Each Domain followed
- [ ] Use Domain Events for Cross-Domain Communication followed
- [ ] Document Domain Boundaries Explicitly followed
- [ ] Enforce Domain Isolation via Automated Checks followed
- [ ] Keep Shared Kernel Outside Any Domain followed
- [ ] Ensure Domain Boundaries Are Stable Before Implementation followed
- [ ] Workflow step completed: **Identify stable bounded contexts.** Analyze business domains to identify 3-4 stable contexts with clear boundaries. Document each domain's key models, responsibilities, and dependencies in a `domain-map.md`.
- [ ] Workflow step completed: **Create domain directory structure.** Create `app/Domains/{Domain}/` with `Models/`, `Http/Controllers/`, `Services/`, `Events/`, `Providers/`, and `routes/`. Each domain is a mini-application with its own namespace.
- [ ] Workflow step completed: **Configure PSR-4 mapping.** Add separate namespace roots per domain: `"Domains\\": "app/Domains/"` Ã¢â‚¬â€ or per-domain prefixes if using distinct PSR-4 roots. Ensure no overlap with the default `App\` mapping.
- [ ] Workflow step completed: **Give each domain its own service provider.** Each domain registers its own routes, events, commands, and bindings through a dedicated provider. This enables independent domain lifecycle management.
- [ ] Workflow step completed: **Use domain-scoped Eloquent models.** Each domain owns specific database tables. Domain A never references Domain B's models directly. If the same concept (User) exists in multiple domains, each domain has its own model representing its view.

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

- [ ] Failure addressed: Leaking shared models:
- [ ] Failure addressed: Cross-domain Eloquent access:
- [ ] Failure addressed: Inconsistent boundaries:
- [ ] Failure addressed: Domain too large:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each domain has its own namespace prefix and directory
- [ ] No direct Eloquent model imports across domain boundaries
- [ ] Cross-domain communication uses service contracts or events
- [ ] Domain boundaries are documented with ownership
- [ ] Architecture tests enforce domain isolation
- [ ] Each domain has its own service provider registered
- [ ] No domain acts as a catch-all "Core" dumping ground
- [ ] Shared kernel lives outside any domain

### Success Criteria
- [ ] Each domain is independently understandable and team-ownable.
- [ ] No Eloquent models are imported across domain boundaries.
- [ ] Cross-domain communication uses only contracts or events.
- [ ] Architecture tests fail on any cross-domain import violation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Never Access Another Domain's Eloquent Models Directly followed
- [ ] Give Each Domain Its Own Service Provider followed
- [ ] Use Domain-Scoped Eloquent Models for Each Domain followed
- [ ] Use Domain Events for Cross-Domain Communication followed
- [ ] Document Domain Boundaries Explicitly followed
- [ ] Enforce Domain Isolation via Automated Checks followed
- [ ] Keep Shared Kernel Outside Any Domain followed
- [ ] Ensure Domain Boundaries Are Stable Before Implementation followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Circular Domain Dependency
- [ ] Anti-pattern prevented: Domain Boundary Erosion
- [ ] Anti-pattern prevented: Anemic Domain Directories
- [ ] Anti-pattern prevented: Domain Too Large / Core Dumping Ground

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Leaking shared models:
- [ ] Failure scenario handled: Cross-domain Eloquent access:
- [ ] Failure scenario handled: Inconsistent boundaries:

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
