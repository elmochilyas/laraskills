# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Repository pattern debate: when it adds value vs. overhead
Knowledge Unit ID: SLP-14
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Repository pattern is the most debated architectural topic in Laravel. Proponents cite testability, centralized query logic, and swappable data sources. Critics argue it's unnecessary ceremony wrapping Eloquent methods one-to-one. Pragmatic position: repositories add value when they solve a real problem — multi-source data, complex query logic, or genuine need for abstraction. They add overhead when they simply wrap `User::find()` with `UserRepository::find()`.

---

# Core Concepts

- **Repository**: Data access abstraction layer. Interface + implementation pattern.
- **Generic repository**: CRUD methods (find, all, create, update, delete) for every entity. Low value.
- **Feature-oriented repository**: Business-specific queries (findOverdueInvoices). Higher value.

---

# When To Use

- Complex, duplicated query logic needs centralization.
- Data comes from multiple sources (Eloquent + external API).
- Need to swap implementations (in-memory for tests, Eloquent for production).
- Following Clean Architecture (port-adapter boundaries required).

---

# When NOT To Use

- Simple CRUD, single data source, small team.
- Repository wraps every Eloquent model one-to-one with generic CRUD.
- Primary justification is "swap the database" (rarely realized in practice).

---

# Best Practices

- **Use feature-oriented repositories, not generic CRUD repositories.** WHY: A repository with `findOverdueInvoices()` provides value by centralizing complex query logic. A repository with `find()`, `all()`, `create()` adds ceremony without value.
- **Skip the BaseRepository.** WHY: Generic base repositories with shared CRUD recreate the problem at the inheritance level. Each repository should have methods specific to its domain.
- **Test repository methods with integration tests.** WHY: A feature-oriented method with a wrong WHERE clause is a data retrieval bug. Untested repositories are dead code.
- **If the "swap the database" justification is primary, skip the repository.** WHY: Eloquent semantics permeate the application. A repository interface doesn't make a MongoDB switch trivial.

---

# Architecture Guidelines

- Repository interface in Domain layer. Implementation in Infrastructure layer.
- Service container binds interface to implementation.
- Methods should solve business queries, not mirror Eloquent.
- Skip if simple CRUD. Prefer Eloquent scopes and query objects.

---

# Performance Considerations

- Repository indirection adds a method call per data access. Negligible.

---

# Security Considerations

- No direct implications. Repositories are data access abstractions.

---

# Common Mistakes

1. **Generic repository:** `BaseRepository` with CRUD methods extended by every entity repository. Cause: following framework patterns blindly. Consequence: ceremony without value. Better: feature-oriented methods.

2. **Repository leaking Eloquent:** Methods returning `Collection` or `LengthAwarePaginator`. Cause: convenience. Consequence: leaks ORM coupling. Better: return arrays or domain types.

3. **Repository without tests:** Wraps Eloquent methods but has no tests. Cause: assuming it works. Consequence: untested data access is dead code. Better: add integration tests.

---

# Anti-Patterns

- **Repository drift**: Interface grows to 20+ methods — data access god object.
- **Abandoned repository**: Created but no longer used. Services call Eloquent directly.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-15 Repository feature vs generic | SLP-16 Query objects |
| SLP-13 Interface contracts | SLP-04 Pyramid architecture | LAP-14 Clean Architecture tradeoffs |

---

# AI Agent Notes

- Default to no repository for simple CRUD.
- Use feature-oriented repositories only when complex query logic needs centralization.
- Never generate generic BaseRepository.
- Always generate integration tests for repository methods.

---

# Verification

- [ ] Repositories are feature-oriented, not generic CRUD
- [ ] No BaseRepository or generic inheritance
- [ ] Repository methods are tested with integration tests
- [ ] Repositories are actually used (not abandoned)
- [ ] Feature-oriented methods map to business queries
