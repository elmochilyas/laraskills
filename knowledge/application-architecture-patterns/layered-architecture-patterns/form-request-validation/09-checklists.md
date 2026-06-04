# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-12-form-request-validation
**Generated:** 2026-06-03
**Based on:** 06
**Note:** Generated from partial input (missing: 04-standardized-knowledge.md, 05-rules.md, 07-decision-trees.md, 08-anti-patterns.md)

---

# Quick Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Production readiness verified

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create Form Request with `php artisan make:request`.** Generate for each distinct HTTP endpoint or resource. Name after the operation it validates (e.g., `StoreInvoiceRequest`, `UpdateUserProfileRequest`).
- [ ] Workflow step completed: **Define `authorize()` method for endpoint-specific access.** Check if the authenticated user can perform this operation. Use Policy gates if available. Return `true` for public endpoints.
- [ ] Workflow step completed: **Define `rules()` method returning validation array.** Add rules for each field. Use Laravel's built-in rules, custom Rule objects, or `Rule::unique()` for database uniqueness.
- [ ] Workflow step completed: **Customize error messages with `messages()` method.** Override default messages for business-specific error text. Use translations for localization if needed.
- [ ] Workflow step completed: **Prepare input before validation using `prepareForValidation()`.** Transform or sanitize input data before validation runs. Use this for normalizing phone numbers, trimming whitespace, etc.

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

- [ ] Failure addressed: Validation in controllers.
- [ ] Failure addressed: Overly permissive rules.
- [ ] Failure addressed: Authorization logic in controller.
- [ ] Failure addressed: Validation and authorization mixed.
- [ ] Failure addressed: Closure-based rules.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] `authorize()` method defined for all non-public endpoints
- [ ] `rules()` covers all expected input fields
- [ ] Custom Rule objects used for complex validations (not closures)
- [ ] Error messages are user-friendly and specific
- [ ] Form Request is injected in Controller method signature
- [ ] Validation is tested independently (unit test for rules())
- [ ] Authorization check is tested separately from validation
- [ ] No inline validation remains in Controller
- [ ] Form Request tests cover valid and invalid inputs

### Success Criteria
- [ ] Every endpoint with 3+ validation rules has a dedicated Form Request.
- [ ] Controllers contain no inline validation logic.
- [ ] Validation and authorization are independently testable.
- [ ] Form Request handles authorization, rules, messages, and input preparation.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] No known anti-patterns for this KU

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Validation in controllers.
- [ ] Failure scenario handled: Overly permissive rules.
- [ ] Failure scenario handled: Authorization logic in controller.

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
