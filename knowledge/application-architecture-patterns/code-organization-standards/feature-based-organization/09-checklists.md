# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** Organizing by feature/vertical slice within app/
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Keep Each Feature Fully Self-Contained followed
- [ ] Never Import Directly from Another Feature's Internal Code followed
- [ ] Use Feature-Scoped Route Files followed
- [ ] Leaky Features prevented
- [ ] Giant Feature / God Feature prevented

---

# Architecture Checklist

- [ ] Keep Each Feature Fully Self-Contained followed
- [ ] Never Import Directly from Another Feature's Internal Code followed
- [ ] Use Feature-Scoped Route Files followed
- [ ] Automate Feature Discovery via Glob Loading followed
- [ ] Establish a Shared Kernel for Cross-Cutting Concerns followed

---

# Implementation Checklist

- [ ] Keep Each Feature Fully Self-Contained followed
- [ ] Never Import Directly from Another Feature's Internal Code followed
- [ ] Use Feature-Scoped Route Files followed
- [ ] Automate Feature Discovery via Glob Loading followed
- [ ] Establish a Shared Kernel for Cross-Cutting Concerns followed
- [ ] Limit Feature Size Ã¢â‚¬â€ Extract Sub-Features followed
- [ ] Match Feature Boundaries to Team Ownership followed
- [ ] Enforce Feature Boundaries via Architecture Tests followed
- [ ] Workflow step completed: **Identify feature boundaries.** List each cohesive business capability (Checkout, UserRegistration, InvoiceGeneration). Ensure each feature is independently understandable and team-ownable.
- [ ] Workflow step completed: **Create feature directory structure.** Create `app/Features/{FeatureName}/` with standard subdirectories: `Controllers/`, `Models/`, `Services/`, `Events/`, `routes.php`. Each feature is a full vertical slice.
- [ ] Workflow step completed: **Move feature code into feature directories.** Relocate all controllers, models, services, events, and jobs belonging to each feature into its feature directory. Update namespace declarations to match new paths.
- [ ] Workflow step completed: **Create feature-scoped route files.** Each feature defines its own `routes.php` file. Load routes automatically via glob in RouteServiceProvider: `foreach (glob(app_path('Features/*/routes.php')) as $file) { Route::middleware('web')->group($file); }`.
- [ ] Workflow step completed: **Establish a shared kernel.** Create `app/Shared/` or `app/Support/` for code genuinely used by multiple features (base controllers, audit logging, utility classes). Never duplicate shared code across features.

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

- [ ] Failure addressed: Leaky features:
- [ ] Failure addressed: Giant features:
- [ ] Failure addressed: Shared code explosion:
- [ ] Failure addressed: Inconsistent structure across features:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Each feature directory contains all classes needed for that capability
- [ ] No direct imports from other feature directories
- [ ] Feature routes are auto-discovered via glob loading
- [ ] Shared kernel is documented and contains only truly shared code
- [ ] Feature boundaries match team ownership boundaries
- [ ] Architecture tests prevent cross-feature coupling
- [ ] No feature directory exceeds 50 files

### Success Criteria
- [ ] Each feature is fully understandable within one directory tree.
- [ ] Cross-feature communication uses only events or contracts.
- [ ] Architecture tests prevent direct imports between features.
- [ ] Features match team ownership with minimal cross-team coordination.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Keep Each Feature Fully Self-Contained followed
- [ ] Never Import Directly from Another Feature's Internal Code followed
- [ ] Use Feature-Scoped Route Files followed
- [ ] Automate Feature Discovery via Glob Loading followed
- [ ] Establish a Shared Kernel for Cross-Cutting Concerns followed
- [ ] Limit Feature Size Ã¢â‚¬â€ Extract Sub-Features followed
- [ ] Match Feature Boundaries to Team Ownership followed
- [ ] Enforce Feature Boundaries via Architecture Tests followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Leaky Features
- [ ] Anti-pattern prevented: Giant Feature / God Feature
- [ ] Anti-pattern prevented: Orphaned Features
- [ ] Anti-pattern prevented: Shared Code Explosion
- [ ] Anti-pattern prevented: Inconsistent Feature Structure

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Leaky features:
- [ ] Failure scenario handled: Giant features:
- [ ] Failure scenario handled: Shared code explosion:

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
