# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 04-service-layer-patterns
**Knowledge Unit:** DTO pattern: structured data transfer between layers
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] DTO bloat prevented
- [ ] DTO serialization issues prevented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct architecture pattern selected
- [ ] Dependency boundaries respected

---

# Implementation Checklist

- [ ] Workflow step completed: **Create DTOs using PHP 8.1+ promoted constructors with `readonly` properties.** Use `public function __construct(public readonly string $name, ...)`. This ensures immutability with minimal boilerplate.
- [ ] Workflow step completed: **Keep DTOs use-case-specific, not entity-wide.** Create `RegisterUserInput` and `UpdateProfileInput` Ã¢â‚¬â€ not a single `UserDto` with 20+ nullable fields. Each use case gets its own specific DTO.
- [ ] Workflow step completed: **Never add behavior to DTOs.** DTOs are pure data containers with no business logic. Static factory methods (`fromRequest()`, `fromArray()`) are acceptable Ã¢â‚¬â€ they are construction logic, not behavior.
- [ ] Workflow step completed: **Avoid HTTP coupling in DTOs.** Use only plain PHP types. No `Illuminate\Http\Request`, `UploadedFile`, or other framework-specific imports.
- [ ] Workflow step completed: **Implement `JsonSerializable` for complex DTOs.** For DTOs with nested objects, `DateTimeImmutable`, or custom types, implement `JsonSerializable` to ensure correct serialization.

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

- [ ] Failure addressed: DTO with behavior.
- [ ] Failure addressed: DTO as god object.
- [ ] Failure addressed: HTTP coupling.

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] DTOs are immutable (readonly properties, no setters)
- [ ] DTOs contain no business logic (only construction/validation)
- [ ] DTOs contain no HTTP framework imports
- [ ] Each use case has specific input/output DTOs
- [ ] DTOs serialize correctly (JsonSerializable if needed)
- [ ] fromRequest() factory methods exist for HTTP construction
- [ ] Read-heavy lists avoid DTO allocation overhead

### Success Criteria
- [ ] DTOs are immutable with readonly properties and use-case-specific shapes.
- [ ] No business logic or HTTP coupling exists in DTOs.
- [ ] DTOs serialize correctly and have `fromRequest()` factory methods.
- [ ] Read-heavy list endpoints use arrays to avoid allocation overhead.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: DTO bloat
- [ ] Anti-pattern prevented: DTO serialization issues

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: DTO with behavior.
- [ ] Failure scenario handled: DTO as god object.
- [ ] Failure scenario handled: HTTP coupling.

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
