# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Query objects as alternative to repositories
Knowledge Unit ID: SLP-16
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Query objects are dedicated classes that encapsulate a specific database query or group of related queries. Unlike repositories (which group all data access for an entity), query objects focus on querying — not creating, updating, or deleting. They are a lighter alternative to the repository pattern, providing centralized query logic without the CRUD wrapper overhead. Each query object typically handles one query concern (filtering, searching, reporting).

---

# Core Concepts

- **Single-responsibility query**: One class per distinct query concern: `OverdueInvoicesQuery`, `SearchProductsQuery`.
- **Read-only**: Query objects encapsulate reads only — no writes.
- **Returns DTOs or arrays**: Often returns typed DTOs or arrays instead of Eloquent models.

---

# When To Use

- Complex queries repeated across services.
- Eloquent queries becoming unwieldy in controllers/services.
- Want to decouple read logic from write logic (CQRS-lite).
- When a repository's CRUD overhead isn't justified but query centralization is needed.

---

# When NOT To Use

- Simple `User::find($id)` — doesn't need a query object.
- Every single query in the application — use for complex/repeated queries only.
- When model scopes suffice (scopes are the simplest query encapsulation).

---

# Best Practices

- **Keep query objects read-only.** WHY: Adding `create()`, `update()`, `delete()` blurs the line between query and repository. Query objects are for querying only.
- **Return arrays or DTOs, not Eloquent models.** WHY: Consumers of query objects are often read-only views. Returning Eloquent models couples them to the ORM.
- **Don't create a query object for every query.** WHY: Simple one-liners don't need extraction. Query objects are for complex or repeated queries.
- **Avoid duplication with model scopes.** WHY: If a model has `scopeOverdue()`, don't also create `OverdueInvoicesQuery`. Choose one pattern: scopes for simple, query objects for complex.

---

# Architecture Guidelines

- Query objects are injected into services/controllers via constructor.
- They can be chained (builder pattern) for composable query building.
- They are ideal for query optimization — slow query fixed in one place benefits all consumers.
- Prefer query objects over repositories for read-heavy applications.

---

# Performance Considerations

- No overhead. Query objects use Eloquent directly. Optimize per query (indexes, select optimization).

---

# Security Considerations

- Query objects should respect authorization boundaries. Don't expose unfiltered data queries.

---

# Common Mistakes

1. **Query object with writes:** Adding create/update/delete methods. Cause: convenience. Consequence: blurs read/write separation. Better: keep query objects read-only.

2. **Query object for every query:** Creating objects for simple `find()` calls. Cause: consistency. Consequence: unnecessary classes. Better: simple queries stay in services/controllers.

3. **Returning Eloquent models:** Consumers coupled to ORM. Cause: convenience. Consequence: prevents read model optimization. Better: return DTOs or arrays.

---

# Anti-Patterns

- **Query object explosion**: 50 query objects with overlapping logic. Consolidate into fewer objects with multiple methods.
- **Query/scopes duplication**: Both model scope and query object define same query.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-14 Repository debate | SLP-15 Repository feature vs generic | CPC-08 CQRS pattern |
| SLP-01 Service classes | SLP-04 Pyramid architecture | LAP-07 Infrastructure layer |

---

# AI Agent Notes

- Generate query objects for complex queries, not simple ones.
- Keep read-only — no write methods.
- Return DTOs or arrays, not Eloquent models.
- Prefer over repositories for read-heavy applications.

---

# Verification

- [ ] Query objects are read-only (no write methods)
- [ ] Query objects are for complex/repeated queries, not simple one-liners
- [ ] Return DTOs or arrays, not Eloquent models
- [ ] No duplication with model scopes
- [ ] Queries are testable in isolation
