# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Hybrid: domains inside default Laravel structure
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Apply Domain Subdirectories Consistently Across All Technical Layers followed
- [ ] Establish a Threshold for Creating Domain Subdirectories followed
- [ ] Keep Truly Shared Code Flat at the Technical Layer Root followed
- [ ] Inconsistent Application Across Layers prevented
- [ ] Orphaned Domain Subdirectories prevented

---

# Architecture Checklist

- [ ] Apply Domain Subdirectories Consistently Across All Technical Layers followed
- [ ] Establish a Threshold for Creating Domain Subdirectories followed
- [ ] Keep Truly Shared Code Flat at the Technical Layer Root followed
- [ ] Use `artisan make:` with Subdirectory Paths followed
- [ ] Document the Hybrid Convention Explicitly followed

---

# Implementation Checklist

- [ ] Apply Domain Subdirectories Consistently Across All Technical Layers followed
- [ ] Establish a Threshold for Creating Domain Subdirectories followed
- [ ] Keep Truly Shared Code Flat at the Technical Layer Root followed
- [ ] Use `artisan make:` with Subdirectory Paths followed
- [ ] Document the Hybrid Convention Explicitly followed
- [ ] Use Route Prefix Grouping Without Restructuring Files followed
- [ ] Use Code Review to Catch Misplaced Files followed
- [ ] Use Hybrid as an Intermediate Step, Not a Final State followed
- [ ] Workflow step completed: **Identify domain groupings.** List the business domains (Billing, Catalog, Identity) that appear across technical layers. Use a threshold: "3+ files related to a business concept = create a subdirectory."
- [ ] Workflow step completed: **Apply domain subdirectories consistently.** Create matching subdirectories in every technical layer. If `app/Http/Controllers/Billing/` exists, create `app/Models/Billing/`, `app/Services/Billing/`, etc. Inconsistency creates confusion.
- [ ] Workflow step completed: **Keep shared code flat at the technical layer root.** Leave cross-cutting models and services (User, AuditLog, BaseController) at the root of their layer. If `User` goes inside a domain, that domain becomes a mandatory dependency.
- [ ] Workflow step completed: **Use `artisan make:` with subdirectory paths.** Run `php artisan make:model Billing/Invoice -m` instead of `php artisan make:model Invoice`. Generators accept subdirectory paths and create correct namespaces automatically.
- [ ] Workflow step completed: **Use route prefix grouping.** Group routes by domain using `Route::prefix('billing')->group(...)` to keep URL structure organized around domains.

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

- [ ] Failure addressed: Inconsistent application:
- [ ] Failure addressed: Domain subdirectory for every resource:
- [ ] Failure addressed: Domain proliferation:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] All technical layers consistently use domain subdirectories (or none do)
- [ ] Domain subdirectory creation threshold is documented
- [ ] Shared cross-domain code remains flat at technical layer root
- [ ] `artisan make:` commands work with all subdirectory paths
- [ ] New developers can identify where to place new code
- [ ] Hybrid convention is documented
- [ ] No domain subdirectory contains only 1-2 files (below threshold)

### Success Criteria
- [ ] Domain subdirectories are applied consistently across all technical layers.
- [ ] Shared cross-cutting code remains flat and accessible.
- [ ] Developers can predict file placement without ambiguity.
- [ ] The hybrid structure serves as an intermediate step toward domain isolation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Apply Domain Subdirectories Consistently Across All Technical Layers followed
- [ ] Establish a Threshold for Creating Domain Subdirectories followed
- [ ] Keep Truly Shared Code Flat at the Technical Layer Root followed
- [ ] Use `artisan make:` with Subdirectory Paths followed
- [ ] Document the Hybrid Convention Explicitly followed
- [ ] Use Route Prefix Grouping Without Restructuring Files followed
- [ ] Use Code Review to Catch Misplaced Files followed
- [ ] Use Hybrid as an Intermediate Step, Not a Final State followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Inconsistent Application Across Layers
- [ ] Anti-pattern prevented: Orphaned Domain Subdirectories
- [ ] Anti-pattern prevented: Mixed Flat and Domain Without Rules
- [ ] Anti-pattern prevented: Stagnant Hybrid Architecture

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Inconsistent application:
- [ ] Failure scenario handled: Domain subdirectory for every resource:
- [ ] Failure scenario handled: Domain proliferation:

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
