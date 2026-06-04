# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by layer: app/Http, app/Models, app/Services
Knowledge Unit ID: COS-02
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Layer-based organization groups code by its technical role — Controllers in `app/Http/Controllers/`, Models in `app/Models/`, Services in `app/Services/`. It answers "what does this code do?" by placing all HTTP-handling code together, all data-access code together, and all business-logic code together. This is the default Laravel approach and the most intuitive for MVC-familiar developers.

---

# Core Concepts

- **Technical Role Grouping**: Classes sorted by architectural layer — Presentation (`app/Http/`), Business Logic (`app/Services/`, `app/Actions/`), Data Access (`app/Models/`, `app/Repositories/`), Configuration (`app/Providers/`, `app/Console/`).
- **Framework Mirror**: Each technical directory mirrors a Laravel concept. Http/ mirrors request handling. Models/ mirrors Eloquent.
- **One Place for Every Type**: All controllers in one folder, all models in one folder. Simplifies cross-reference but scatters domain concepts.
- **Natural Extension Path**: Adding `app/Services/`, `app/Enums/`, `app/Events/`, `app/Jobs/` alongside defaults is the first architectural extension most projects make.

---

# When To Use

- Teams under 5 engineers
- Primarily CRUD applications with straightforward business rules
- Projects where most developers are Laravel-native and expect standard conventions
- Early-stage projects where domain boundaries are not yet clear

---

# When NOT To Use

- Applications with 3+ distinct business domains requiring isolation
- Teams of 10+ engineers needing clear ownership boundaries
- Codebases where `app/Services/` contains 30+ unrelated files
- When cross-domain confusion ("which domain does this model belong to?") becomes frequent

---

# Best Practices

- **Add `app/Services/` when controllers grow beyond request handling.** WHY: Controllers should only orchestrate HTTP concerns; extracting logic prevents fat controllers.
- **Establish a delegation rule:** All non-trivial business logic lives in a service class. WHY: Inconsistent extraction (some controllers use services, others don't) creates unpredictability.
- **Use sub-layer grouping within layers:** `app/Http/Controllers/Api/` and `app/Http/Controllers/Web/`. WHY: Prevents single directories from growing to 50+ files.
- **Avoid catch-all directories:** No `app/Helpers/`, `app/Utilities/`, `app/Common/`. WHY: These become dumping grounds without clear ownership. Name directories by specific concern.
- **Enforce layer boundaries via architecture tests.** WHY: Directory structure alone does not prevent a Controller from calling `User::find()` directly.

---

# Architecture Guidelines

- Layer-based organization is the default for a reason — it maps to how Laravel developers think.
- The natural progression is: Default → Add Services → Add Actions → Add Domain directories.
- Controllers validate input (via Form Requests), call services, and return responses — no business logic.
- Services contain business logic but should not become god classes.
- Consider moving to domain-based organization when layer directories exceed 30 files each.

---

# Performance Considerations

- Layer-based organization has no direct performance cost.
- Large single-layer directories (100+ files in `app/Models/`) slow IDE file-tree operations.
- Service container resolution is unaffected by directory structure.

---

# Security Considerations

- Layer boundaries do not provide security isolation — any service can access any model.
- Ensure authentication and authorization logic stays in the appropriate layer (middleware for HTTP auth, policies for model access).

---

# Common Mistakes

1. **God Service accumulation**: `app/Services/UserService.php` grows to handle registration, login, password reset, profile updates, and more. Cause: adding methods to existing service instead of splitting. Consequence: fat controller recreated in service layer. Better: split by responsibility; use action classes for distinct operations.

2. **Elastic directory creep**: Adding `app/Helpers/`, `app/Utilities/`, `app/Common/`, `app/Traits/` as catch-all directories. Cause: no clear naming convention for miscellaneous code. Consequence: dumping grounds with unrelated code. Better: name directories by specific concern or eliminate catch-alls.

3. **Missing service extraction entirely**: Keeping all logic in controllers despite application growth. Cause: not adopting any architectural pattern. Consequence: untestable, unmaintainable controllers. Better: extract to services incrementally.

4. **Repository-y service classes**: Service class that wraps Model calls (`UserService::find()`, `UserService::create()`). Cause: misunderstanding service vs repository responsibility. Consequence: ceremony without value. Better: services orchestrate business logic, not wrap CRUD.

---

# Anti-Patterns

- **God Service Class**: Single service handling all operations for an entity type.
- **Layer Leakage**: Controller calling Eloquent queries directly instead of delegating to services.
- **Inconsistent Extraction**: Some controllers thin, others fat — no team standard.

---

# Examples

Standard layer-based extension:
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   └── Web/
│   └── Requests/
├── Models/
│   ├── User.php
│   ├── Order.php
│   └── Product.php
├── Services/
│   ├── PaymentService.php
│   ├── UserService.php
│   └── OrderService.php
├── Actions/
├── Events/
└── Providers/
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based organization | COS-09 When to deviate |
| MVC pattern awareness | COS-06 Domain-based organization | COS-12 File placement decision trees |

---

# AI Agent Notes

- Default to layer-based organization when generating code for projects following standard Laravel conventions.
- When a Controller grows beyond 15 lines of business logic, suggest extracting to a Service class.
- Watch for god service classes being generated — suggest splitting when a service handles unrelated entity operations.

---

# Verification

- [ ] Controllers contain no business logic beyond HTTP orchestration
- [ ] Services do not wrap Model CRUD without adding business value
- [ ] All controllers consistently delegate to services (no inline business logic)
- [ ] No directory contains more than 30 unrelated files
- [ ] Architecture tests enforce layer boundaries
