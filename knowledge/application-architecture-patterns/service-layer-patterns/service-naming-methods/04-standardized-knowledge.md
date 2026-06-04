# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service class naming conventions and method design
Knowledge Unit ID: SLP-07
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Service class naming and method design conventions communicate code intent. A well-named service and its methods reveal what it does, what domain it belongs to, and what abstraction level it operates at. Conventions: services named after the domain entity (`UserService`), methods named as business operations (`register()`, `changePassword()`), consistent method signatures accepting DTOs or validated data and returning typed results.

---

# Core Concepts

- **Class naming**: `{Domain}Service` — `UserService`, `OrderService`, `PaymentService`.
- **Method naming**: Business operations, not CRUD. `register()` not `create()`. `cancelOrder()` not `updateStatus()`.
- **Return types**: Domain objects or DTOs — never HTTP responses.

---

# When To Use

- Always. Follow conventions consistently across the codebase.

---

# When NOT To Use

- Prototype-stage where naming consistency isn't a priority.

---

# Best Practices

- **Use business language for method names.** WHY: If the business says "register a user," the method is `register()`. If they say "cancel order," it's `cancelOrder()`. Technical names like `insert()` don't communicate intent.
- **Maintain one level of abstraction.** WHY: Service methods should call other services, actions, and repositories — not low-level `DB::table()` queries.
- **Avoid generic suffixes.** WHY: `UserManager`, `UserHelper`, `UserUtils` don't communicate architectural role. Use `UserService`.
- **Keep methods under 20-30 methods per service.** WHY: A service with 30+ methods is doing too much. Split by domain or extract actions.

---

# Architecture Guidelines

- Entity-based naming: `UserService`, `OrderService` — paired with primary entity.
- Domain-based naming: `BillingService`, `AuthService` — spans multiple entities within a domain.
- Method prefix conventions: `create`/`update`/`delete` for CRUD, `process`/`handle`/`execute` for workflows, `validate`/`calculate`/`check` for queries.

---

# Performance Considerations

- No performance impact from naming conventions.

---

# Security Considerations

- No implications. Naming is structural.

---

# Common Mistakes

1. **CRUD-named methods:** `createUser()`, `updateUser()`, `deleteUser()`. Cause: thinking in data operations. Consequence: hides business intent. Better: `registerUser()`, `suspendUser()`, `activateUser()`.

2. **Method returning response:** `register(Request $request): JsonResponse`. Cause: habit from writing controllers. Consequence: service is coupled to HTTP. Better: return domain objects.

3. **Too many methods:** 30+ methods on a single service. Cause: adding by accretion. Consequence: god service. Better: split by domain or extract actions.

---

# Anti-Patterns

- **Inconsistent naming**: `UserService`, `UserManager`, `UserHelper` used interchangeably.
- **Method name/behavior mismatch**: `createOrder()` that also sends emails and updates inventory.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-08 Action naming | COS-08 Feature-based naming |
| COS-08 Naming conventions | SLP-10 Decision criteria | AEG-07 Team convention docs |

---

# AI Agent Notes

- Name services as `{Domain}Service`, methods as business operations.
- Never use `Manager`, `Helper`, or `Utils` suffixes.
- Services return domain objects, not HTTP responses.

---

# Verification

- [ ] Service names use `{Domain}Service` convention
- [ ] Method names use business language (not CRUD)
- [ ] No service returns HTTP responses
- [ ] No service has 30+ methods
- [ ] No `Manager`/`Helper`/`Utils` suffixes used
