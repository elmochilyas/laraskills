# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Database schema ownership per module
Knowledge Unit ID: MMD-13
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Database schema ownership means each module owns a specific set of database tables. No other module directly creates, reads, updates, or deletes those tables. The module's database schema is an implementation detail that can change without coordinating with other modules. Schema ownership is the database-level expression of the module boundary, enforced by table naming conventions, separate database schemas, or database-level permissions.

---

# Core Concepts

- **Table ownership**: Each module owns a set of tables. Billing owns `billing_invoices`, Catalog owns `catalog_products`.
- **No cross-module table access**: Catalog code never runs `SELECT * FROM billing_invoices`.
- **Access through APIs only**: To get billing data, Catalog calls `BillingService::getInvoice()` via contract.

---

# When To Use

- Always in a modular monolith. Every table must have a clear owning module from day one.

---

# When NOT To Use

- Single-module applications (no cross-module boundary exists).

---

# Best Practices

- **Use prefix naming convention for tables.** WHY: Simple, works with any database, enables automated enforcement (PHPStan can check prefix ownership).
- **Never create cross-module foreign keys.** WHY: A `catalog_products` table with `billing_invoice_id` column creates schema-level coupling visible in the database.
- **Document table ownership.** WHY: A table registry listing each table and its owning module helps new developers understand the schema boundary.
- **Run migrations in dependency order.** WHY: Module B's migrations referencing Module A's tables need Module A's migrations to have run first.

---

# Architecture Guidelines

- Prefix naming (recommended default): `billing_`, `catalog_`, etc. Enables automated prefix-based ownership enforcement.
- Schema-per-module (PostgreSQL): Each module gets its own schema. True namespace isolation but requires PostgreSQL.
- Database-per-module: Strongest isolation, separate connection per module. Extraction-ready but adds connection overhead.

---

# Performance Considerations

- Single-database prefix isolation: no performance cost.
- Schema-per-module: adds schema qualification overhead.
- Database-per-module: adds connection overhead for cross-module operations.

---

# Security Considerations

- Database-level permissions can enforce schema ownership: each module's DB user only accesses its own tables.
- Separate database users with table-level permissions prevent accidental cross-module queries.

---

# Common Mistakes

1. **Shared tables:** Creating tables that don't belong to any specific module. Cause: convenience. Consequence: no ownership clarity. Better: every table assigned to a module.

2. **Cross-module foreign keys:** A column in Module A's table references Module B's table. Cause: thinking relationally instead of modularly. Consequence: schema evolution coupling. Better: reference by ID string without FK constraint.

3. **Migration ordering issues:** Module B's migrations fail because Module A's tables don't exist yet. Cause: dependency order not established. Consequence: migration failures. Better: run migrations in dependency order.

---

# Anti-Patterns

- **Schema ownership violation in migrations**: Module B's migration creates a table with Module A's prefix.
- **Orphan tables**: Tables created by a disabled or removed module, left behind.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-05 Module autonomy | MMD-10 Cross-module data access | DBC-06 Schema per context |
| MMD-01 Module vs microservice | MMD-11 Module extraction | DBC-07 Cross-context queries |

---

# AI Agent Notes

- Always prefix module tables with module name.
- Never generate cross-module foreign keys.
- Default to prefix naming convention unless PostgreSQL with schema-per-module is specified.

---

# Verification

- [ ] Every table has a clear owning module
- [ ] Table naming prefix convention is documented and enforced
- [ ] No cross-module foreign keys exist
- [ ] Module migrations run in dependency order
- [ ] Database permissions restrict per-module table access
