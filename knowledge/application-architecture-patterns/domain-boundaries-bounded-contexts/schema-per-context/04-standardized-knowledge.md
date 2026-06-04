# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Database schema organization per bounded context
Knowledge Unit ID: DBC-06
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Database schema organization per bounded context partitions the database so each context's tables are clearly identified and isolated. Three strategies: table prefix naming (`billing_invoices`), schema-per-context (PostgreSQL schemas), database-per-context. Prefix naming is most common in Laravel monoliths. Goal: make schema boundary visible at database level, enabling independent evolution and preventing cross-context schema coupling.

---

# Core Concepts

- **Prefix naming**: `billing_invoices`, `catalog_products`, `identity_users`. Single database, simple migration management.
- **Schema-per-context**: PostgreSQL schemas. `CREATE SCHEMA billing; CREATE TABLE billing.invoices (...)`.
- **Database-per-context**: Separate database connections per context. Maximum isolation.

---

# When To Use

- Prefix naming: default for Laravel modular monoliths. Simple, works with any database.
- Schema-per-context: PostgreSQL users wanting stronger isolation without separate databases.
- Database-per-context: extraction to microservice planned, or contexts with different database technology needs.

---

# When NOT To Use

- Inconsistent prefixing (some tables prefixed, others not).
- No prefix at all — ownership is invisible and cross-context queries undetectable.

---

# Best Practices

- **Use prefix naming as the default strategy.** WHY: Simple, works with any database, and enables automated enforcement (PHPStan can check prefix ownership).
- **Ensure all tables have a prefix corresponding to the owning context.** WHY: Any developer seeing `billing_invoices` knows exactly which context owns it. No documentation needed.
- **Govern prefix uniqueness.** WHY: Two contexts using the same prefix creates ambiguity. Maintain a prefix registry.
- **Place migrations in context-specific directories.** WHY: Context migrations live in the context's directory, auto-loaded by the service provider.

---

# Architecture Guidelines

- Prefix naming: default recommendation. Single database, per-context migration directories.
- Schema-per-context: each context has named connection in `config/database.php`.
- Database-per-context: separate full database connection per context.

---

# Performance Considerations

- Prefix naming: no performance cost.
- Schema-per-context: adds schema qualification overhead.
- Database-per-context: adds connection management overhead.

---

# Security Considerations

- Database-per-context provides strongest data isolation. Prefix naming provides naming-level isolation only.

---

# Common Mistakes

1. **Inconsistent prefixing:** Some tables prefixed, others not. Cause: no governance. Consequence: ownership unclear. Better: enforce prefixing for all tables.

2. **No prefix at all:** All tables in shared namespace. Cause: habit. Consequence: ownership invisible, cross-context queries undetectable. Better: prefix all tables.

3. **Prefix conflicts:** Two contexts using same prefix. Cause: no governance. Consequence: ambiguity. Better: maintain prefix registry.

---

# Anti-Patterns

- **Shared tables between contexts**: Table not owned by any single context.
- **Cross-context foreign keys**: Table in one context has FK to another context's table.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-05 Model ownership | MMD-13 Database schema ownership | DBC-07 Cross-context queries |
| MMD-05 Module autonomy | MMD-10 Cross-module data access | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Default to prefix naming for all multi-context Laravel apps.
- Each migration is in context-specific directory with context prefix.
- Enforce prefix ownership with PHPStan rules.

---

# Verification

- [ ] All tables have context prefix
- [ ] Prefix naming convention is documented and enforced
- [ ] No cross-context foreign keys
- [ ] Migrations in context-specific directories
- [ ] No shared tables between contexts
