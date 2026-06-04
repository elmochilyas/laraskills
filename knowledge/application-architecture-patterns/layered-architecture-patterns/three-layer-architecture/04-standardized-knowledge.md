# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Three-layer architecture: Presentation, Business, Data
Knowledge Unit ID: LAP-01
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Three-layer architecture divides application code into Presentation (handles user interaction), Business Logic (encapsulates rules and orchestration), and Data Access (manages persistence). This architectural foundation is what MVC concretely implements. In Laravel, three layers map to Controllers/Requests (Presentation), Services/Actions/Models (Business), and Eloquent/Repositories (Data). Most Laravel applications implicitly follow this pattern.

---

# Core Concepts

- **Presentation Layer**: Controllers, Form Requests, API Resources, Blade views, routes. Owns HTTP concerns only — zero business logic.
- **Business Layer**: Services, actions, domain models, events. Encapsulates business rules, workflows, calculations. Independent of HTTP and database concerns.
- **Data Layer**: Eloquent models, repositories, query builders, migrations. Manages persistence — no business rules.
- **Dependency Direction**: Strictly inward: Presentation → Business → Data. No layer depends outward.

---

# When To Use

- Most Laravel applications (small to medium)
- Need clear but lightweight separation between HTTP, business logic, and data
- Default MVC structure is causing specific pain (fat controllers, duplicated logic)
- Teams want testable business rules

---

# When NOT To Use

- Ultra-simple CRUD with no business logic — default MVC may suffice
- When team cannot commit to enforcing layer boundaries
- For prototypes where speed is the only priority

---

# Best Practices

- **Extract Service classes when controllers grow beyond 200 lines.** WHY: Controllers should only handle HTTP delegation — extracting services keeps layers clean.
- **Use Form Requests for validation boundaries.** WHY: Keeps Controllers and Services focused on their responsibilities, not input parsing.
- **Never pass Request objects to Service methods.** WHY: This leaks HTTP concerns into the Business layer. Extract needed data in the Controller and pass primitives/DTOs.
- **Enforce layer boundaries with architecture tests.** WHY: Nothing prevents a Controller from calling `Model::find()` directly — only automated enforcement prevents layer bypass.
- **Start with three layers before adding more.** WHY: Three layers handle most needs; additional layers increase complexity and should be justified.

---

# Architecture Guidelines

- Controller → Service → Model is the most common three-layer pattern in Laravel.
- Business layer should be testable without HTTP or database setup.
- Database changes should only affect Data layer. HTTP changes should only affect Presentation layer.
- Layer bypass under time pressure is the most common violation — prevent with CI checks.

---

# Performance Considerations

- Layer indirection adds negligible cost — Controller → Service → Model is three PHP method calls.
- No measurable performance impact at any scale.

---

# Security Considerations

- Authentication and authorization should be applied at the Presentation layer boundary.
- Business layer should not handle authentication — it receives already-authenticated context.

---

# Common Mistakes

1. **Leaky Presentation layer:** Controllers containing business logic or database calls. Cause: convenience over separation. Consequence: untestable, fat controllers. Better: always delegate to Service classes.

2. **Anemic Business layer:** Services that just wrap Model CRUD without adding business value. Cause: misunderstanding service purpose. Consequence: ceremony without benefit (see SLP-18).

3. **Cross-layer shortcuts:** Passing Request objects to Service methods or calling Model directly from Views. Cause: time pressure or lack of discipline. Consequence: layer coupling defeats purpose of layering.

4. **Bypass under pressure:** Calling `Model::find()` from Controller because "it's just one query." Cause: time pressure. Consequence: inconsistent layering. Better: architecture tests catch this automatically.

---

# Anti-Patterns

- **Fat Controller**: Business logic, data access, and response formatting all in one method.
- **Service-in-name-only**: Service class that does nothing but wrap Eloquent CRUD.
- **Layer bypass**: Calling Data layer directly from Presentation.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | LAP-02 Clean Architecture | LAP-12 Incremental migration |
| MVC pattern awareness | LAP-08 Presentation layer | LAP-14 Clean Architecture tradeoffs |

---

# AI Agent Notes

- Default to three-layer architecture for most Laravel projects.
- Always generate Service classes for business logic; never put business logic in Controllers.
- When generating code, respect the dependency direction — Presentation → Business → Data.

---

# Verification

- [ ] Controllers contain zero business logic (only HTTP delegation)
- [ ] Services contain business logic; do not simply wrap CRUD
- [ ] No `Request` objects passed to Service methods
- [ ] No Model calls from Controllers (use Services)
- [ ] Architecture tests enforce layer boundaries in CI
