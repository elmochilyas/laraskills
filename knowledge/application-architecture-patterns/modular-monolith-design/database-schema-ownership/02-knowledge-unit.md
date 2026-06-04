# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Database schema ownership per module
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Database schema ownership means each module owns a specific set of database tables. No other module creates, reads, updates, or deletes those tables directly. The module's database schema is an implementation detail that can change without coordinating with other modules. Schema ownership is enforced by table naming conventions, separate database schemas, or database-level permissions. It is the database-level expression of the module boundary.

---

# Core Concepts

**Table ownership:** Each module owns a set of tables. `Billing` owns `billing_invoices`, `billing_payments`. `Catalog` owns `catalog_products`, `catalog_categories`.

**No cross-module table access:** Catalog module code never runs `SELECT * FROM billing_invoices`. Billing module code never runs `INSERT INTO catalog_products`.

**Access through APIs only:** To get billing data, Catalog calls `BillingService::getInvoice()`. To get catalog data, Billing calls `CatalogService::getProduct()`.

---

# Mental Models

**The "Private Database" model:** Each module treats its tables as a private database that only it can access. Other modules can't even see the table structure.

**The "API as Database Boundary" model:** The module's contracts are the only way to access its data. The database schema is not an API—it's an implementation detail that can be refactored at any time.

**The "Ownership Means Change Control" model:** Ownership means the module owner can change the schema without breaking other modules. If Billing renames a column, Catalog doesn't break because Catalog never directly queries that column.

---

# Internal Mechanics

**Table naming convention:**
```
billing_invoices          # Billing module
billing_invoice_items     # Billing module
catalog_products          # Catalog module
catalog_product_variants  # Catalog module
identity_users            # Identity module
```

This convention enables automated enforcement: a PHPStan rule checks that module B only queries tables with its prefix.

**Database-level enforcement:** Create separate database users with table-level permissions. The Billing module's DB user can only access `billing_*` tables.

**Schema-per-module (PostgreSQL):** Each module owns a separate database schema:
```sql
CREATE SCHEMA billing;
CREATE TABLE billing.invoices (...);
```

---

# Patterns

**Prefix naming convention:** The most common and practical approach. Each module's tables are prefixed (e.g., `billing_`, `catalog_`). This is simple and works with any database.

**Schema-per-module (PostgreSQL only):** Each module gets its own schema. This provides true namespace isolation but requires PostgreSQL and adds query complexity (qualified table names).

**Database-per-module:** Each module has a completely separate database. This is the strongest isolation but adds connection management overhead and prevents any cross-module queries.

---

# Architectural Decisions

**Use prefix naming when:** Single database, module count < 20, team is comfortable with naming discipline. This is the recommended default for most Laravel modular monoliths.

**Use schema-per-module when:** PostgreSQL is the database, module count is high (>10), and you want SQL-level isolation without separate databases.

**Use database-per-module when:** Extraction to microservice is planned, or modules have genuinely different database requirements (e.g., one module needs PostGIS, another doesn't).

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Independent schema evolution | No cross-module queries | Application-level data assembly |
| Module isolation at database level | Table name management | Prefix conventions must be documented |
| Extraction readiness | Cross-module transactions are harder | Saga patterns needed for multi-module consistency |
| Ownership clarity | Migration ordering complexity | Module migrations must run in dependency order |

---

# Performance Considerations

Single-database with prefix isolation has no performance cost. Schema-per-module adds schema qualification overhead. Database-per-module adds connection overhead for cross-module operations.

---

# Production Considerations

Module ownership of tables should be documented. A table registry (`tables.md`) listing each table and its owning module helps new developers.

---

# Common Mistakes

**Shared tables:** Creating tables that don't belong to any specific module or are shared across modules. Every table should have a clear owning module.

**Cross-module foreign keys:** A `catalog_products` table has a `billing_invoice_id` column. This creates schema-level coupling that's visible in the database.

**Migration ordering issues:** Module B's migrations reference tables that don't exist yet because Module A's migrations haven't run. Solve by running migrations in dependency order.

---

# Failure Modes

**Schema ownership violation in migrations:** Module B's migration creates a table with Module A's prefix. Automated checks should catch this.

**Orphan tables:** Tables that were created by a module that has been disabled or removed. Clean up orphaned tables to avoid confusion.

---

# Ecosystem Usage

The `Modulate` package's `modulate:lint` checks that modules only access tables matching their prefix. The `nwidart/modules` package supports module-specific migration directories.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-05 Module autonomy | MMD-10 Cross-module data access | DBC-06 Schema per context |
| MMD-01 Module vs microservice | MMD-11 Module extraction | DBC-07 Cross-context queries |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
