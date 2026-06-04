# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Use Case classes with DTO contracts
Knowledge Unit ID: SLP-06
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Use Case classes represent a single business intent, bridging the gap between action classes (too granular) and service classes (too broad). A use case encapsulates a complete business interaction — what the user wants to achieve. "Register User" is a use case. "Process Checkout" is a use case. Use cases receive typed DTOs, coordinate domain objects, and return output DTOs. They are the natural evolution of service classes toward the Application layer in Clean Architecture.

---

# Core Concepts

- **Single business intent**: One use case = one user goal.
- **DTO contracts**: Input and output are typed DTOs.
- **Framework independence**: No HTTP imports, no facades.
- **Orchestration role**: Coordinates domain objects and infrastructure interfaces.

---

# When To Use

- Complex business operations with distinct intents.
- Need for multiple delivery mechanisms (HTTP + CLI + queue).
- Following Clean Architecture patterns.

---

# When NOT To Use

- Simple CRUD (service methods suffice without use case ceremony).
- Application is prototype stage.

---

# Best Practices

- **Keep business logic in domain entities, not use cases.** WHY: Use cases orchestrate. Domain rules (discount calculations, validation) belong in domain entities or domain services.
- **Use case calling use case is forbidden.** WHY: This couples business intents. Extract shared logic to domain services.
- **Use cases manage transaction boundaries.** WHY: The use case wraps operations in `DB::transaction()` — the unit of work boundary.
- **Log use case execution with timing.** WHY: Use cases are the right level for business-level observability. Log which use cases execute and how long they take.

---

# Architecture Guidelines

- Use case → constructor depends on domain repository interfaces and infrastructure interfaces (event dispatcher, mailer).
- Use case → `execute(InputDto): OutputDto` — clean contract.
- Multiple delivery mechanisms (HTTP controller, CLI command, queue job) can use the same use case.
- In Clean Architecture, use cases ARE the Application layer.

---

# Performance Considerations

- Use case resolution adds one more layer of indirection. Negligible for most applications.

---

# Security Considerations

- No security logic in use cases. Authorization in policies/form requests.

---

# Common Mistakes

1. **Business logic in use cases:** Domain rules in use case execute method. Cause: convenience. Consequence: domain logic scattered. Better: keep domain rules in domain entities/services.

2. **Framework coupling in use case:** `use Illuminate\Http\Request` or `Facades\DB`. Cause: habit. Consequence: use case can't be used from CLI/queue. Better: inject interfaces, not facades.

3. **Giant use cases:** One use case does everything — register user, create workspace, send emails, set up billing. Cause: following user story too literally. Consequence: unmanageable use case. Better: split into coordinated use cases or a service.

---

# Anti-Patterns

- **Use case proliferation**: 100+ use cases for simple CRUD. The overhead isn't justified.
- **Use case calling use case**: Couples business intents. Extract shared logic.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-05 DTO pattern | SLP-10 Service vs Action vs Use Case | LAP-06 Application layer |
| SLP-01 Service classes | CPC-08 CQRS pattern | LAP-09 Framework independence |

---

# AI Agent Notes

- Generate use cases for complex business operations with DTO contracts.
- Use cases should be framework-independent.
- Use cases should not call other use cases.
- Log use case execution for business observability.

---

# Verification

- [ ] Each use case has single business intent
- [ ] Use case has input/output DTOs
- [ ] No framework imports in use case
- [ ] No business logic in use case (only orchestration)
- [ ] Use case doesn't call other use cases
