# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Repository pattern: feature-oriented vs. generic
Knowledge Unit ID: SLP-15
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Feature-oriented repositories encapsulate meaningful business queries: `findOverdueInvoices()`, `getTopCustomersByRevenue()`, `searchProductsByCategory()` — targeted data access methods specific to business needs. Generic repositories (find, all, create, update, delete) add ceremony without business value. Feature-oriented repositories justify their existence by centralizing complex query logic.

---

# Core Concepts

- **Generic repository**: `find($id)`, `findAll()`, `create()`, `update()`, `delete()` — mirrors Eloquent one-to-one.
- **Feature-oriented repository**: `findOverdue(int $days)`, `getMonthlyRevenue(string $yearMonth)` — maps to business needs.
- **Single-use-case methods**: Methods exist because a specific use case needs them.

---

# When To Use

- If you use repositories at all, use feature-oriented.
- Complex query logic needs centralization.
- Query methods map to specific business use cases.

---

# When NOT To Use

- Simple CRUD where Eloquent scopes or query objects suffice.
- Generic BaseRepository or CRUD-only repository.

---

# Best Practices

- **Use feature-oriented repositories always if you use repositories at all.** WHY: Generic repositories add ceremony without value. Feature-oriented methods justify their existence by centralizing meaningful queries.
- **Name methods after business queries, not data operations.** WHY: `findOverdueInvoices()` is meaningful. `findAll()` is not. Method names should communicate the business purpose.
- **Return the right type for each method.** WHY: `findOverdueInvoices()` can return a Collection of models. But `getMonthlyRevenue()` should return a `Money` value object, not a model collection.
- **Avoid repository with 50+ methods.** WHY: The repository becomes a data access god object. Split into multiple repositories by concern.

---

# Architecture Guidelines

- Methods exist because a specific use case needs them. When a new use case needs new data access, add a new method.
- Repository per aggregate root — not per database table.
- Repositories can return DTOs or arrays (not Eloquent models) optimized for read use cases.
- Feature-oriented methods can be optimized per query without affecting other methods.

---

# Performance Considerations

- Feature-oriented methods can be optimized per query. Each method uses the most efficient query for that business need.

---

# Security Considerations

- No direct implications. Query methods should be scoped by authorization rules.

---

# Common Mistakes

1. **Generic base repository:** `BaseRepository` with shared CRUD extended by all repositories. Cause: DRY obsession. Consequence: recreates generic problem at inheritance level. Better: feature-oriented methods only.

2. **Repository returning models for all methods:** Even `getMonthlyRevenue()` returns a model collection. Cause: consistency. Consequence: wrong abstraction level. Better: return Money value object for revenue queries.

3. **Repository with 50+ methods:** Data access god object. Cause: all queries go to one repository. Consequence: unmanageable. Better: split into multiple repositories by concern.

---

# Anti-Patterns

- **Repository becomes query dumping ground**: All query logic goes into one repository per entity.
- **Repository + Eloquent duplicate logic**: Scopes in model and methods in repository define same queries. Choose one pattern.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-14 Repository pattern debate | SLP-16 Query objects | SLP-04 Pyramid architecture |
| SLP-01 Service classes | LAP-07 Infrastructure layer | AEG-01 Architecture testing |

---

# AI Agent Notes

- Generate feature-oriented repositories only.
- Method names should be business queries, not CRUD operations.
- Never generate BaseRepository or generic CRUD methods.
- Generate integration tests for each repository method.

---

# Verification

- [ ] Repository methods are business queries, not CRUD
- [ ] No BaseRepository or inheritance-based generic repository
- [ ] Return types match the query (model, DTO, value object)
- [ ] No repository has 50+ methods
- [ ] Integration tests verify query correctness
