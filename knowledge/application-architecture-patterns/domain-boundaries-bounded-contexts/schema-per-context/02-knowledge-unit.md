# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Database schema organization per bounded context
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Database schema organization per bounded context partitions the database so that each context's tables are clearly identified and isolated. The three strategies are: table prefix naming (e.g., `billing_invoices`), schema-per-context (PostgreSQL schemas), and database-per-context. Prefix naming is the most common in Laravel monoliths. The goal is to make the schema boundary visible at the database level, enabling independent evolution and preventing cross-context schema coupling.

---

# Core Concepts

**Prefix naming (`billing_`, `catalog_`):**
```
billing_invoices
billing_payments
catalog_products
catalog_categories
identity_users
```

**Schema-per-context:**
```sql
CREATE SCHEMA billing;
CREATE TABLE billing.invoices (...);
```

**Database-per-context:** Separate database connections per context.

---

# Mental Models

**The "Namespaced Tables" model:** Just as PHP namespaces organize code, table prefixes organize database objects. A prefix is a namespace for tables.

**The "Visible Ownership" model:** Any developer who sees `billing_invoices` knows exactly which context owns it. No documentation needed.

---

# Internal Mechanics

Prefix strategy implementation:
```php
class CreateInvoicesTable extends Migration {
    public function up(): void {
        Schema::create('billing_invoices', function (Blueprint $table) {
            // ...
        });
    }
}
```

Schema-per-context (PostgreSQL):
```php
class CreateInvoicesTable extends Migration {
    public function up(): void {
        DB::statement('CREATE SCHEMA IF NOT EXISTS billing');
        Schema::connection('billing')->create('invoices', function (Blueprint $table) {
            $table->increments('id');
        });
    }
}
```

---

# Patterns

**Context module migration directory:** Each context's migrations live in its directory. The prefix is configured per context:
```
modules/Billing/database/migrations/
modules/Catalog/database/migrations/
```

**Context-specific database connection:** For schema-per-context or database-per-context, each context has a named connection in `config/database.php`:
```php
'connections' => [
    'billing' => [...],
    'catalog' => [...],
]
```

---

# Architectural Decisions

**Use prefix naming:** Default recommendation for most Laravel modular monoliths. Single database, simple migration management, clear ownership.

**Use schema-per-context:** For PostgreSQL users who want stronger isolation without separate databases.

**Use database-per-context:** When extraction to microservice is planned, or contexts have different database technology needs.

---

# Tradeoffs

| Strategy | Benefit | Cost |
|---|---|---|
| Prefix naming | Simple, works with any DB | Naming discipline required |
| Schema-per-context | True schema isolation | PostgreSQL only, query complexity |
| Database-per-context | Maximum isolation | Connection management, no cross-context queries |

---

# Common Mistakes

**Inconsistent prefixing:** Some tables have prefixes, others don't. Establishes a convention without enforcing it.

**No prefix at all:** All context tables share the same namespace. Ownership is invisible and cross-context queries are difficult to detect.

**Prefix conflicts:** Two contexts using the same prefix. Governance must ensure unique prefixes.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-05 Model ownership | MMD-13 Database schema ownership | DBC-07 Cross-context queries |
| MMD-05 Module autonomy | MMD-10 Cross-module data access | DBC-12 Eventual consistency |

---

## Performance Considerations

Identifying bounded context boundaries adds negligible performance overhead at runtime. The cost is at design time: event storming sessions, context mapping workshops, and documentation. Once boundaries are identified, the performance characteristics depend on the communication pattern between contexts. Synchronous calls between contexts add network latency if services are separated. In a modular monolith, context boundaries add no runtime cost.

---

## Production Considerations

Bounded contexts must be enforced in production through CI checks (architecture tests, import rules). Without enforcement, boundaries degrade: cross-context direct model access creeps in, shared database tables emerge, and the bounded context becomes a folder boundary in name only. Production monitoring should track cross-context call volume and latency (if using service-level boundaries). Team ownership should align with context boundaries in production incident response.

---

## Failure Modes

**Leaky context boundary:** Other contexts directly access Eloquent models or database tables owned by a different context. The boundary exists in folder structure but not in runtime enforcement.

**Wrong boundary identification:** Splitting a domain where the concepts are tightly coupled causes transaction and consistency problems. The overhead of coordinating across the boundary exceeds the benefit of separation.

**Boundary erosion over time:** As the codebase evolves, changes naturally blur context boundaries. Regular architecture reviews and automated enforcement are required to maintain integrity.

---

## Ecosystem Usage

Event Storming (Alberto Brandolini) is the most popular technique for bounded context identification. The Context Mapper DSL provides tooling for context mapping. In the Laravel ecosystem, nwidart/laravel-modules and domain-based directory organization are the primary implementation approaches. Eric Evans Domain-Driven Design (2003) remains the definitive reference. Vaughn Vernons Implementing Domain-Driven Design provides practical implementation guidance.

---

## Research Notes

Research in 2025-2026 shows continued adoption of strategic DDD patterns in Laravel. The community consensus favors starting with coarse context boundaries and splitting later over premature fine-grained separation. The bounded context heuristic (language divergence, team alignment, data lifecycle) remains the standard identification approach. Anti-Corruption Layers are increasingly recognized as essential for legacy Laravel application integration.
