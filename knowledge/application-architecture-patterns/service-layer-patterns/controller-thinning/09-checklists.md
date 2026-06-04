# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** Controller thinning: what to extract and what to keep
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Service returning response objects prevented
- [ ] Controller with business logic prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Aim for the Three-Line Controller pattern.** Each controller method should: (1) receive validated request, (2) call a service/action, (3) return a response. If the method is longer, extract the logic.
- [ ] Workflow step completed: **Always use Form Requests for validation.** Replace `$request->validate()` in controllers with type-hinted Form Request classes. This makes validation testable and reusable.
- [ ] Workflow step completed: **Move business logic to Services or Actions.** If code doesn't involve HTTP request/response handling, it doesn't belong in a controller. Extract to Service (grouped by entity) or Action (single-operation).
- [ ] Workflow step completed: **Use API Resources for response transformation.** Replace inline response formatting (`response()->json([...])` in controllers with dedicated Resource classes. This centralizes transformation logic.
- [ ] Workflow step completed: **Put authorization in Policies.** Use Policy classes with Form Request's `authorize()` method. Never put authorization checks (`if ($post->user_id !== auth()->id())`) in controllers.

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

- [ ] Failure addressed: Over-extraction.
- [ ] Failure addressed: Validation in controller body.
- [ ] Failure addressed: Inconsistent thinning.
- [ ] Failure addressed: Service returning response objects.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] No business logic in controllers (only HTTP concerns)
- [ ] Form Requests handle all validation
- [ ] Policies handle all authorization
- [ ] API Resources handle response formatting
- [ ] Controller methods follow Three-Line pattern
- [ ] Controller methods are Ã¢â€°Â¤ 10 lines
- [ ] Controller total is Ã¢â€°Â¤ 50 lines
- [ ] No over-extraction (simple conditionals kept inline)

### Success Criteria
- [ ] Controllers contain zero business logic Ã¢â‚¬â€ only HTTP orchestration.
- [ ] Controller methods follow the Three-Line pattern (request, service, response).
- [ ] Validation, authorization, and response formatting are in dedicated classes.
- [ ] Controller and method line limits are established and enforced.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Service returning response objects
- [ ] Anti-pattern prevented: Controller with business logic

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Over-extraction.
- [ ] Failure scenario handled: Validation in controller body.
- [ ] Failure scenario handled: Inconsistent thinning.

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
