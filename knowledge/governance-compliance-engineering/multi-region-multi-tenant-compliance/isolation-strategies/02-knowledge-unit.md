# Isolation Strategies

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** multi-region-multi-tenant-compliance
- **Knowledge Unit:** Isolation Strategies
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Isolation Strategies define how tenant data is separated within multi-tenant Laravel applications, ranging from shared databases with row-level scoping to dedicated tenant infrastructure. Choosing the right isolation strategy is a critical compliance and architectural decision that balances data security, operational cost, and application complexity.

---

## Core Concepts

- **Tenant isolation** determines the degree of separation between different customers' data within the application
- **Shared database with tenant scoping** uses a `tenant_id` column on all tables to isolate data at the query level
- **Database-per-tenant** provides a dedicated database instance for each tenant
- **Schema-per-tenant** uses separate schemas within a shared database server
- **Hybrid isolation** mixes strategies based on tenant tier or data sensitivity
- **Global scopes** automatically apply tenant filtering to all queries
- **Connection switching** routes requests to the correct tenant database

---

## Mental Models

- **The Apartment Building:** Shared database is like an apartment building — tenants share the structure (database server) but have private units (tenant_id scoped data). Database-per-tenant is like detached houses — complete separation.
- **The Filing Cabinet:** Shared database is a cabinet with labeled folders for each tenant. Database-per-tenant is separate filing cabinets for each tenant in locked rooms.
- **The Office Building:** Schema-per-tenant is like separate floors in the same building — shared entrance (server) but private floor (schema) with locked doors.

---

## Internal Mechanics

Shared database isolation uses Laravel global scopes to automatically append `WHERE tenant_id = ?` to every query. The tenant context is resolved from the authenticated user or subdomain. Database-per-tenant maintains separate database connections configured in `config/database.php` and switches connections based on tenant resolution. Schema-per-tenant uses PostgreSQL schemas or MySQL databases with separate connection strings. Hybrid isolation implements a strategy pattern — each tenant's tier determines which isolation approach is used.

---

## Patterns

**Shared Database with Global Scopes Pattern:** Single database, `tenant_id` on all tables, global scopes on all models. Benefit: Simplest infrastructure, easiest to manage. Tradeoff: Weakest isolation; query errors can expose cross-tenant data.

**Database-Per-Tenant Pattern:** Separate database instance per tenant, connection switched at runtime. Benefit: Strongest isolation, tenant backup/restore independence. Tradeoff: Database connection limits, connection management overhead.

**Hybrid Isolation Pattern:** Use shared database for low-tier tenants, dedicated databases for premium tenants. Benefit: Cost optimization with compliance proportionality. Tradeoff: Two isolation strategies to implement and maintain.

---

## Architectural Decisions

Start with shared database isolation for MVP and migrate to stronger isolation as compliance requirements grow. Use global scopes for shared database isolation — never rely on application code to remember tenant filtering. Choose database-per-tenant for regulated data or enterprise customers. Use schema-per-tenant as a middle ground when database-per-tenant is too expensive but shared database is insufficient. Hybrid isolation allows cost-efficient scaling while offering premium isolation to high-value customers.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Shared database: simple, low cost | Weakest isolation, query leak risk | Suitable for low-risk applications only |
| Database-per-tenant: strong isolation | Infrastructure cost, connection limits | Maximum compliance but maximum cost |
| Schema-per-tenant: moderate cost/isolation | Schema management overhead | Good middle ground for moderate compliance |
| Hybrid: cost proportional to isolation need | Two implementation paths to maintain | Complex testing for both isolation strategies |

---

## Performance Considerations

Global scopes add `WHERE` clauses to every query — ensure `tenant_id` is indexed on all tables. Database-per-tenant connection switching adds overhead per request — use connection pooling. Schema-per-tenant keeps connections within the same database server — better connection utilization than database-per-tenant. Hybrid isolation needs to resolve tenant tier on every request — cache tenant isolation configuration. Monitor query performance per isolation strategy separately.

---

## Production Considerations

Test tenant isolation boundaries with security tests — verify that tenant A cannot access tenant B's data under any query pattern. Implement tenant-scoped backup and restore procedures. Monitor for cross-tenant data leaks — implement query logging that flags queries without tenant scoping. Document isolation strategy per tenant for compliance evidence. Implement tenant migration between isolation levels (upgrade from shared to dedicated database). Train developers on isolation-safe query patterns.

---

## Common Mistakes

**Relying on developer discipline for tenant scoping** — one query without WHERE tenant_id = ? leaks data. Implement global scopes as mandatory for all multitenant models.

**Sharing model instances between tenants** — a cached model from one tenant used for another. Ensure cache keys include tenant ID.

**Not testing tenant isolation in CI** — security regression due to missing tenant scope. Include cross-tenant data access tests in CI pipeline.

---

## Failure Modes

- **Missing global scope on new model:** New model without tenant scoping creates cross-tenant leak. Enforce tenant scope via model inheritance or interface.
- **Database-per-tenant connection limit exceeded:** Too many tenants overwhelm database server connections. Implement connection pooling or migrate to schema-per-tenant.
- **Hybrid isolation routing error:** Tenant routed to wrong isolation strategy. Implement tenant tier verification before isolation lookup.
- **Cached data cross-tenant leak:** Cache keys without tenant prefix serve wrong data. Namespace all cache keys with tenant ID.

---

## Ecosystem Usage

Laravel supports tenant isolation through: global scopes on models, multi-database connection configuration, middleware for tenant resolution, and event-based tenant context propagation. Packages like `stancl/tenancy` and `spatie/laravel-multitenancy` provide structured multi-tenancy implementations. `spatie/laravel-permission` can be configured for per-tenant role management in shared database setups.

---

## Related Knowledge Units

### Prerequisites
- Multi-Tenant Architecture Fundamentals
- Eloquent Global Scopes
- Database Connection Management

### Related Topics
- Data Residency Tenants (region-based isolation)
- Three-Tier Classification (data-driven isolation)
- Access Control Authorization (tenant-scoped permissions)

### Advanced Follow-up Topics
- Dynamic Tenant Isolation Strategy Switching
- Cross-Tenant Analytics with Federated Queries
- Tenant Isolation Audit and Compliance Verification

---

## Research Notes

The isolation strategy choice is one of the most consequential architectural decisions in multi-tenant applications. The shared database approach (using global scopes) is the default for most Laravel multi-tenant applications due to its simplicity and low cost. However, security-conscious applications and enterprise SaaS offerings increasingly adopt database-per-tenant or hybrid approaches. The PostgreSQL schema-per-tenant approach offers a compelling middle ground — it provides database-level isolation without the connection management overhead of separate database instances. The trend toward stricter data protection regulations (GDPR, CCPA, HIPAA) is pushing more applications toward stronger isolation strategies, even at higher infrastructure cost.
