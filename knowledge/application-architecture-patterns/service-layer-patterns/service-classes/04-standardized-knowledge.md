# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service classes: grouping operations by entity
Knowledge Unit ID: SLP-01
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Service classes are the most common architectural extension in Laravel. They group related business operations by entity or domain, extracting logic from controllers into dedicated classes. A `UserService` handles user-related operations; an `OrderService` handles ordering operations. Services sit between controllers and models, orchestrating business logic, managing transactions, and coordinating side effects.

---

# Core Concepts

- **Service classes** group operations by entity: `app/Services/UserService.php` with `register()`, `updateProfile()`, `changePassword()`.
- **Orchestration role**: Services don't do the work themselves — they delegate to models, events, jobs, and external services.
- **Injected via DI**: Controllers receive services via constructor injection.

---

# When To Use

- Always. Service classes should be the default location for business logic in Laravel projects. If you don't know where to put logic, put it in a service class.

---

# When NOT To Use

- Prototype-stage applications where speed is more important than structure.
- Controllers are already thin (delegating to model methods).

---

# Best Practices

- **One responsibility per method.** WHY: Each method should do one complete business operation. `register()`, `changePassword()` — not `doUserStuff()`.
- **Services return data, not responses.** WHY: Services should return models, collections, or DTOs. Response formatting belongs in the controller. A service returning `response()->json(...)` couples business logic to HTTP.
- **Keep constructor dependencies under 5.** WHY: A service with 8+ dependencies is doing too much. Split into separate services.
- **Service methods are transactional.** WHY: Operations spanning multiple database writes should be wrapped in `DB::transaction()`.

---

# Architecture Guidelines

- Services sit between controllers and models.
- Constructor dependencies auto-injected by Laravel container.
- Service class resolution adds negligible overhead.

---

# Performance Considerations

- Service resolution via container is negligible — one resolution per request.

---

# Security Considerations

- No specific security implications. Authorization should be in policies/form requests, not services.

---

# Common Mistakes

1. **God service class:** UserService accumulates 40 methods for registration, auth, profile, billing, notifications. Cause: growing by accretion. Consequence: untestable and unclear responsibility. Better: split by domain.

2. **Anemic service:** Methods that just call model methods without adding value. Cause: extraction without purpose. Consequence: adds boilerplate without benefit. Better: only extract where orchestration is needed.

3. **Service returning responses:** Method returns `response()->json(...)`. Cause: habit. Consequence: couples business logic to HTTP. Better: return data, let controller format response.

---

# Anti-Patterns

- **Service calling service calling service**: Deep call chains create implicit coupling. Use actions for leaf-node operations.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-02 Layer-based organization | SLP-02 Action classes | SLP-10 Service vs Action vs Use Case |
| SLP-03 Controller thinning | SLP-07 Service naming | SLP-18 Anemic domain model |

---

# AI Agent Notes

- Default location for business logic is a service class.
- Group by entity/domain, not by action.
- Keep methods focused — one complete operation per method.

---

# Verification

- [ ] Services group operations by entity/domain
- [ ] Methods return data, not HTTP responses
- [ ] Constructor dependencies ≤ 5
- [ ] Multi-write operations are transactional
- [ ] No god service classes exist
